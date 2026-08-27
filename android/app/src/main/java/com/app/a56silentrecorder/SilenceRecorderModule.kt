package com.app.a56silentrecorder

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.RandomAccessFile
import java.text.SimpleDateFormat
import java.util.ArrayDeque
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Captures mono 16-bit PCM at 48 kHz and writes only speech segments to a WAV
 * file. The hold time and pre/post roll implement VAD hysteresis so short gaps
 * inside natural Vietnamese speech do not get clipped.
 */
class SilenceRecorderModule(private val appContext: ReactApplicationContext) : ReactContextBaseJavaModule(appContext) {
  private val sampleRate = 48_000
  private val frameSamples = 960 // 20 ms at 48 kHz
  private val isRunning = AtomicBoolean(false)
  private val isPaused = AtomicBoolean(false)
  private var audioRecord: AudioRecord? = null
  private var writer: RandomAccessFile? = null
  private var worker: Thread? = null
  private var outputFile: File? = null
  private var capturedFrames = 0L
  private var keptFrames = 0L
  private var removedFrames = 0L
  private var thresholdDb = -45.0
  private var holdFrames = 15
  private var preRollFrames = 6
  private var postRollFrames = 6

  override fun getName(): String = "SilenceRecorder"

  @ReactMethod
  fun start(options: ReadableMap, promise: Promise) {
    if (isRunning.get()) {
      promise.reject("E_ACTIVE", "Đang có một phiên ghi âm chạy.")
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && appContext.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_PERMISSION", "Ứng dụng chưa được cấp quyền microphone.")
      return
    }

    try {
      thresholdDb = options.getDouble("thresholdDb")
      holdFrames = max(1, options.getInt("holdMs") / 20)
      preRollFrames = max(0, options.getInt("preRollMs") / 20)
      postRollFrames = max(0, options.getInt("postRollMs") / 20)
      capturedFrames = 0
      keptFrames = 0
      removedFrames = 0

      val recordingsDir = File(appContext.filesDir, "recordings")
      if (!recordingsDir.exists() && !recordingsDir.mkdirs()) throw IllegalStateException("Không thể tạo thư mục bản ghi.")
      val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
      outputFile = File(recordingsDir, "A56_GhiAm_$timestamp.wav")
      writer = RandomAccessFile(outputFile, "rw").apply { writeWavHeader(this, 0) }

      val minBufferSize = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
      if (minBufferSize <= 0) throw IllegalStateException("Thiết bị không hỗ trợ ghi PCM 48 kHz mono.")
      val bufferSize = max(minBufferSize, frameSamples * 2 * 8)
      audioRecord = AudioRecord(
        MediaRecorder.AudioSource.VOICE_RECOGNITION,
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
        bufferSize,
      )
      if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) throw IllegalStateException("Không thể khởi tạo microphone PCM.")

      isPaused.set(false)
      isRunning.set(true)
      audioRecord?.startRecording()
      worker = Thread({ recordLoop() }, "A56SilenceRecorder").also { it.start() }
      promise.resolve(null)
    } catch (error: Exception) {
      releaseRecorder(deleteFile = true)
      promise.reject("E_START", error.message, error)
    }
  }

  @ReactMethod
  fun pause(promise: Promise) {
    if (!isRunning.get() || isPaused.get()) {
      promise.resolve(null)
      return
    }
    isPaused.set(true)
    try {
      audioRecord?.stop()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_PAUSE", error.message, error)
    }
  }

  @ReactMethod
  fun resume(promise: Promise) {
    if (!isRunning.get() || !isPaused.get()) {
      promise.resolve(null)
      return
    }
    try {
      audioRecord?.startRecording()
      isPaused.set(false)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_RESUME", error.message, error)
    }
  }

  @ReactMethod
  fun finish(promise: Promise) {
    if (!isRunning.get()) {
      promise.reject("E_IDLE", "Không có phiên ghi âm để hoàn tất.")
      return
    }
    try {
      isRunning.set(false)
      if (!isPaused.get()) audioRecord?.stop()
      worker?.join(1_500)
      val file = outputFile ?: throw IllegalStateException("Không tìm thấy tệp bản ghi.")
      val dataBytes = keptFrames * 2L
      writer?.let { wav ->
        wav.seek(0)
        writeWavHeader(wav, dataBytes)
        wav.close()
      }
      writer = null
      audioRecord?.release()
      audioRecord = null
      worker = null
      val result = Arguments.createMap().apply {
        putString("uri", "file://${file.absolutePath}")
        putString("filename", file.name)
        putDouble("durationMs", capturedFrames * 20.0)
        putDouble("keptDurationMs", keptFrames * 20.0)
        putDouble("removedSilenceMs", removedFrames * 20.0)
        putDouble("sizeBytes", file.length().toDouble())
        putString("format", "wav")
      }
      outputFile = null
      promise.resolve(result)
    } catch (error: Exception) {
      releaseRecorder(deleteFile = false)
      promise.reject("E_FINISH", error.message, error)
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    releaseRecorder(deleteFile = true)
    promise.resolve(null)
  }

  @ReactMethod
  fun delete(uri: String, promise: Promise) {
    try {
      val file = File(uri.removePrefix("file://"))
      if (file.exists() && !file.delete()) throw IllegalStateException("Không thể xóa tệp.")
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_DELETE", error.message, error)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  private fun recordLoop() {
    val preRoll = ArrayDeque<ShortArray>()
    val pendingSilence = ArrayDeque<ShortArray>()
    var inSpeech = false
    var silentFrameCount = 0
    val buffer = ShortArray(frameSamples)

    while (isRunning.get()) {
      if (isPaused.get()) {
        Thread.sleep(20)
        continue
      }
      val read = audioRecord?.read(buffer, 0, buffer.size, AudioRecord.READ_BLOCKING) ?: break
      if (read <= 0) continue
      val frame = buffer.copyOf(read)
      val db = frameDb(frame)
      val speech = db >= thresholdDb
      capturedFrames += 1

      if (!inSpeech) {
        if (speech) {
          inSpeech = true
          silentFrameCount = 0
          while (preRoll.isNotEmpty()) writeFrame(preRoll.removeFirst())
          writeFrame(frame)
        } else {
          if (preRollFrames == 0) {
            removedFrames += 1
          } else {
            if (preRoll.size == preRollFrames) {
              preRoll.removeFirst()
              removedFrames += 1
            }
            preRoll.addLast(frame)
          }
        }
      } else if (speech) {
        while (pendingSilence.isNotEmpty()) writeFrame(pendingSilence.removeFirst())
        silentFrameCount = 0
        writeFrame(frame)
      } else {
        pendingSilence.addLast(frame)
        silentFrameCount += 1
        if (silentFrameCount > holdFrames) {
          var framesToKeep = postRollFrames
          while (pendingSilence.isNotEmpty()) {
            val silentFrame = pendingSilence.removeFirst()
            if (framesToKeep > 0) {
              writeFrame(silentFrame)
              framesToKeep -= 1
            } else {
              removedFrames += 1
            }
          }
          inSpeech = false
          silentFrameCount = 0
          preRoll.clear()
        }
      }

      emitProgress(db, speech)
    }

    if (inSpeech) {
      var framesToKeep = postRollFrames
      while (pendingSilence.isNotEmpty()) {
        val trailingFrame = pendingSilence.removeFirst()
        if (framesToKeep > 0) {
          writeFrame(trailingFrame)
          framesToKeep -= 1
        } else {
          removedFrames += 1
        }
      }
    }
  }

  private fun writeFrame(frame: ShortArray) {
    val bytes = ByteArray(frame.size * 2)
    var index = 0
    frame.forEach { sample ->
      bytes[index] = (sample.toInt() and 0xFF).toByte()
      bytes[index + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
      index += 2
    }
    writer?.write(bytes)
    keptFrames += 1
  }

  private fun frameDb(frame: ShortArray): Double {
    var sum = 0.0
    frame.forEach { sample ->
      val normalized = sample.toDouble() / 32768.0
      sum += normalized * normalized
    }
    return 20.0 * log10(max(sqrt(sum / frame.size), 1.0e-9))
  }

  private fun emitProgress(db: Double, speech: Boolean) {
    val event = Arguments.createMap().apply {
      putDouble("durationMs", capturedFrames * 20.0)
      putDouble("keptDurationMs", keptFrames * 20.0)
      putDouble("removedSilenceMs", removedFrames * 20.0)
      putDouble("meterDb", db)
      putBoolean("isSpeech", speech)
    }
    appContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("A56RecorderProgress", event)
  }

  private fun releaseRecorder(deleteFile: Boolean) {
    isRunning.set(false)
    isPaused.set(false)
    try { audioRecord?.stop() } catch (_: Exception) { }
    try { worker?.join(500) } catch (_: InterruptedException) { }
    try { audioRecord?.release() } catch (_: Exception) { }
    audioRecord = null
    worker = null
    try { writer?.close() } catch (_: Exception) { }
    writer = null
    if (deleteFile) outputFile?.delete()
    outputFile = null
  }

  private fun writeWavHeader(target: RandomAccessFile, pcmBytes: Long) {
    val byteRate = sampleRate * 2
    target.writeBytes("RIFF")
    writeIntLE(target, 36 + pcmBytes)
    target.writeBytes("WAVE")
    target.writeBytes("fmt ")
    writeIntLE(target, 16)
    writeShortLE(target, 1)
    writeShortLE(target, 1)
    writeIntLE(target, sampleRate.toLong())
    writeIntLE(target, byteRate.toLong())
    writeShortLE(target, 2)
    writeShortLE(target, 16)
    target.writeBytes("data")
    writeIntLE(target, pcmBytes)
  }

  private fun writeIntLE(target: RandomAccessFile, value: Long) {
    target.write(byteArrayOf(
      (value and 0xFF).toByte(),
      ((value shr 8) and 0xFF).toByte(),
      ((value shr 16) and 0xFF).toByte(),
      ((value shr 24) and 0xFF).toByte(),
    ))
  }

  private fun writeShortLE(target: RandomAccessFile, value: Int) {
    target.write(byteArrayOf((value and 0xFF).toByte(), ((value shr 8) and 0xFF).toByte()))
  }
}
