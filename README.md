# A56 Ghi Âm

**A56 Ghi Âm** là ứng dụng Android vận hành tại thiết bị, dành cho đọc kịch bản và ghi giọng nói có tự động cắt khoảng lặng. Thiết kế hướng đến Samsung Galaxy A56 5G, hiển thị toàn màn hình dọc với bốn vùng văn bản đọc và một vùng điều khiển ghi âm cố định ở phía dưới. Ứng dụng không yêu cầu tài khoản, mạng, máy chủ, dịch vụ AI hay truyền tệp lên đám mây.

## Chức năng đã hiện thực

| Khu vực | Hành vi |
|---|---|
| **Bốn vùng đọc** | Dán hoặc nhập nội dung, khóa từng vùng trước khi đọc, tự giảm cỡ chữ theo lượng ký tự và lưu lại trên máy. |
| **Bảng ghi âm** | Bắt đầu, tạm dừng, tiếp tục và hoàn tất. Màn hình được giữ sáng trong lúc ghi; thanh điều hướng được ẩn cho trải nghiệm toàn màn hình. |
| **Lọc khoảng lặng** | Bộ ghi native nhận PCM mono 16-bit/48 kHz, phân tích khung 20 ms, đo RMS/dBFS và chỉ bỏ khoảng lặng khi tín hiệu thấp hơn ngưỡng liên tục qua thời gian giữ. |
| **Tệp đầu ra** | Tạo WAV PCM 48 kHz không nén ở bộ nhớ ứng dụng. Sau đó chọn **Tệp → Lưu** để mở trình chia sẻ/lưu tệp của Android. |
| **Cài đặt cục bộ** | Điều chỉnh ngưỡng im lặng, thời gian giữ, đệm đầu và đệm cuối; dữ liệu kịch bản, cài đặt và thư viện tệp dùng AsyncStorage cục bộ. |

## Cấu hình âm thanh mặc định

| Thông số | Giá trị | Ý nghĩa |
|---|---:|---|
| Tần số lấy mẫu | 48.000 Hz | Phù hợp khung 20 ms gồm 960 mẫu và chất lượng lời nói băng rộng. |
| Số kênh / lượng tử hóa | Mono / PCM 16-bit | Bảo toàn lời nói, không nén mất dữ liệu ở đầu ra WAV. |
| Nguồn micro | `VOICE_RECOGNITION` | Ưu tiên luồng giọng nói của Android và giảm xử lý tăng âm không cần thiết. |
| Ngưỡng VAD | −45 dBFS | Mốc khởi đầu có thể tinh chỉnh theo môi trường. |
| Thời gian giữ | 300 ms | Không cắt các ngắt nghỉ rất ngắn giữa tiếng hoặc từ. |
| Đệm đầu/cuối | 120 ms / 120 ms | Giảm nguy cơ mất phụ âm đầu và đuôi câu. |

> Thuật ngữ “chất lượng chuẩn Đức” được diễn giải trong sản phẩm là **ưu tiên kỹ thuật, thông số rõ ràng và tệp PCM không nén**. Ứng dụng không đưa ra tuyên bố chứng nhận âm thanh, bit-perfect hay giảm nhiễu phần cứng mà chưa kiểm định trên thiết bị thực tế.

## Thuật toán cắt khoảng lặng

Với mỗi khung PCM 20 ms, ứng dụng tính năng lượng RMS và chuyển đổi sang dBFS. Khi mức âm đạt hoặc vượt ngưỡng, khung được ghi; khi thấp hơn ngưỡng, nó được giữ tạm. Chỉ sau khi im lặng vượt thời gian giữ, bộ ghi mới chép lại tối đa phần đệm cuối và loại phần im lặng còn lại. Ở đầu đoạn giọng nói mới, bộ ghi đặt lại phần đệm đầu trước khi ghi khung chứa giọng nói. Cơ chế này là VAD Hysteresis, giúp tránh hiện tượng chặt tiếng khi mức âm dao động quanh ngưỡng.

## Kiến trúc không kết nối mạng

| Thành phần | Thực hiện tại máy |
|---|---|
| Ghi và xử lý âm thanh | `AudioRecord` native Android, luồng nền và ghi WAV trực tiếp. |
| Phát hiện khoảng lặng | Tính RMS/dBFS trên chính các mẫu PCM đang thu. |
| Lưu kịch bản/cài đặt/danh mục | AsyncStorage nội bộ. |
| Lưu bản ghi | Bộ nhớ riêng của ứng dụng; người dùng chủ động xuất thông qua hộp thoại Android. |

## Kiểm thử đã chạy

Lệnh `pnpm test && pnpm check` đã hoàn tất thành công. Bộ kiểm thử xác minh sàn dBFS của im lặng, ngưỡng giữ VAD, tái bắt đầu đoạn giọng nói, cỡ chữ thích ứng, định dạng thời lượng/dung lượng và tên tệp WAV.

## Tạo APK Android

Dự án đã có mã native Android trong thư mục `android/`; bộ ghi PCM thực sự chỉ hoạt động trong APK Android, không hoạt động trong bản xem trước web. Để tạo APK, hãy dùng nút **Publish** ở giao diện dự án sau khi checkpoint xuất hiện. Quá trình này sẽ xây dựng APK phù hợp để cài đặt lên Galaxy A56 5G; không nên tự biên dịch APK trong môi trường xem trước.

Khi cài APK lần đầu, Android sẽ hỏi quyền microphone. Quyền này là bắt buộc để ghi âm và là quyền nhạy cảm duy nhất của chức năng lõi.

