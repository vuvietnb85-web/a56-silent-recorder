# Thiết kế giao diện — A56 Silent Recorder

## Mục tiêu trải nghiệm

Ứng dụng là một **teleprompter kiêm máy ghi âm giọng nói ngoại tuyến** dành cho Samsung Galaxy A56 5G, cố định ở chế độ dọc 9:16 và vận hành chủ yếu bằng một tay. Màn hình không có thanh tab hay điều hướng dư thừa. Toàn bộ giao diện dùng nền gần đen để hạn chế chói mắt khi đọc, với điểm nhấn xanh ngọc giúp nhận biết rõ trạng thái ghi âm.

## Danh sách màn hình

| Màn hình | Nội dung và chức năng chính |
|---|---|
| **Bàn đọc & ghi âm** | Màn hình mặc định gồm đúng năm vùng xếp dọc: bốn thẻ văn bản để dán và đọc nội dung, cùng bảng điều khiển ghi âm cố định ở phần dưới. Người dùng có thể chạm vùng văn bản để sửa, dán, xóa hoặc khóa đọc. |
| **Thư viện bản ghi** | Danh sách cục bộ những tệp đã hoàn tất; nghe lại, chia sẻ hoặc lưu tệp vào vị trí do Android chọn. Không đồng bộ đám mây. |
| **Cài đặt âm thanh** | Điều chỉnh ngưỡng im lặng, thời gian giữ âm, khoảng đệm đầu/cuối câu và chất lượng tệp xuất. Cấu hình được lưu cục bộ. |

## Bố cục màn hình chính

Khối nội dung chiếm vùng an toàn phía trên và được chia thành **bốn ô đọc có chiều cao bằng nhau**. Mỗi ô có nhãn số thứ tự, dấu trạng thái đã lưu và vùng nhập văn bản nhiều dòng. Cỡ chữ được tính lại theo chiều cao khả dụng của mỗi ô, giới hạn trong khoảng 14–28 sp; khi văn bản dài, cỡ chữ giảm dần nhưng không nhỏ hơn mức tối thiểu, sau đó cho phép cuộn nội bộ.

Phần thứ năm là **bảng ghi âm luôn hiện diện ở đáy**. Bảng này cung cấp đồng hồ thời lượng, hiển thị mức âm/giọng nói, trạng thái VAD, và ba thao tác lớn trong vùng ngón tay cái: bắt đầu/tiếp tục, tạm dừng và hoàn tất. Sau khi hoàn tất, ứng dụng xử lý tệp trực tiếp trên máy, đưa bản ghi vào thư viện và hiển thị thao tác “Lưu vào máy”.

## Luồng sử dụng chính

| Tác vụ | Luồng thao tác |
|---|---|
| Chuẩn bị kịch bản | Mở ứng dụng → chạm một trong bốn ô → dán hoặc nhập nội dung → ứng dụng lưu bản thảo cục bộ → quay lại đọc. |
| Ghi âm có loại bỏ im lặng | Chạm **Ghi âm** → cấp quyền micro một lần → đọc kịch bản → thuật toán phát hiện khoảng lặng ở thiết bị → chạm **Hoàn tất** → ứng dụng ghi tệp âm thanh đã gộp → bản ghi xuất hiện trong thư viện. |
| Tải tệp về máy | Mở thư viện → chọn bản ghi → chạm **Lưu vào máy** → chọn thư mục qua trình chọn tệp Android hoặc chia sẻ qua ứng dụng cài đặt trên máy. |
| Tinh chỉnh nhận diện im lặng | Mở cài đặt → chỉnh ngưỡng dB/thời gian giữ/đệm → lưu cục bộ → áp dụng cho lần ghi tiếp theo. |

## Nguyên tắc âm thanh

Theo PDF đính kèm, cấu hình mục tiêu là ghi **PCM đơn kênh 16-bit/48 kHz**, phân tích theo khung 20 ms (960 mẫu), dùng RMS chuyển sang dBFS và VAD Hysteresis. Khoảng lặng chỉ được loại nếu mức tín hiệu dưới ngưỡng liên tục quá thời gian giữ, nhằm tránh cắt cụt phụ âm hoặc khoảng ngắt tự nhiên. Mặc định trải nghiệm dùng ngưỡng -45 dBFS, giữ 300 ms và lưu đệm 120 ms ở hai đầu đoạn giọng nói. Tệp xuất ưu tiên Opus 48 kHz/VBR cho lời nói nếu bridge Android hỗ trợ; phương án tương thích là AAC-LC 48 kHz chất lượng cao, vẫn hoàn toàn ngoại tuyến.

> “Chuẩn Đức” trong sản phẩm được hiện thực dưới dạng ưu tiên **âm thanh lời nói rõ, nhất quán, có thông số minh bạch và không xử lý giả lập làm thay đổi giọng nói**; không đưa ra tuyên bố chứng nhận hay tiêu chuẩn hóa khi chưa có phép đo phòng thí nghiệm.

## Màu sắc và chữ

| Thành phần | Màu | Vai trò |
|---|---:|---|
| Nền | `#080A0B` | Dark mode toàn màn hình, giảm chói khi đọc. |
| Thẻ đọc | `#111619` | Tách bốn phần văn bản mà không làm phân mảnh thị giác. |
| Viền | `#273238` | Phân định nhẹ, duy trì tương phản. |
| Chữ chính | `#F1F7F6` | Ưu tiên khả năng đọc lâu. |
| Chữ phụ | `#9BAAA9` | Nhãn, trạng thái và thông tin kỹ thuật. |
| Nhấn / sẵn sàng | `#35D7B6` | Nhận diện thao tác chủ đạo và âm thanh an toàn. |
| Đang ghi | `#FF5E67` | Trạng thái cần chú ý ngay lập tức. |
| Cảnh báo | `#F0B75A` | Thông tin về mức âm quá thấp hoặc lỗi xuất tệp. |

Typography dùng hệ chữ hệ thống Android, văn bản đọc ưu tiên trọng lượng Medium/Semibold, giãn dòng 1,35–1,45 lần để mắt quét theo chiều dọc thoải mái. Các khoảng đệm sử dụng nhịp 8/13/21 px, kế thừa định hướng thị giác và khoảng trắng trong tài liệu.

## Mô hình dữ liệu cục bộ

| Thực thể | Trường cốt lõi | Lưu trữ |
|---|---|---|
| `ScriptPanel` | `id`, `text`, `updatedAt`, `locked` | AsyncStorage trên thiết bị. |
| `RecorderSettings` | `thresholdDb`, `holdMs`, `preRollMs`, `postRollMs`, `format` | AsyncStorage trên thiết bị. |
| `Recording` | `id`, `uri`, `filename`, `durationMs`, `createdAt`, `format`, `sizeBytes` | Metadata ở AsyncStorage; âm thanh ở bộ nhớ ứng dụng hoặc thư mục do người dùng chọn. |

## Ràng buộc kỹ thuật

Ứng dụng không dùng API, máy chủ, tài khoản, cơ sở dữ liệu mạng hoặc xử lý đám mây. Cấp quyền chỉ gồm microphone và quyền lưu/đọc tệp theo cơ chế chọn tệp của Android. Chế độ toàn màn hình và giữ sáng màn hình chỉ được bật khi đang ghi hoặc khi người dùng chủ động bật trong phiên đọc.

