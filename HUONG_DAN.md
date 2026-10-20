# Sử dụng trên GitHub Pages như trước

Bản này chạy trực tiếp bằng GitHub Pages, không cần VPS, API riêng, `.env` hoặc chạy `npm start`. Dữ liệu và tài khoản đồng bộ trực tiếp vào file JSON trong repo private đang dùng.

## 1. Cập nhật app

- Sao lưu dữ liệu ở app cũ trước khi cập nhật.
- Đưa `index.html`, `QuanLyThuChi.html`, `sw.js`, `manifest.json`, thư mục `js`, `css`, `vendor`, `icons` lên repo mã nguồn đang bật GitHub Pages.
- Mở lại link Pages cũ và tải lại trang. Cache phiên bản mới sẽ thay bản cũ.
- Giữ nguyên tên repo private, nhánh và đường dẫn dữ liệu cũ để không phải nhập lại lịch sử hàng hóa.

## 2. Tạo admin ngay trên điện thoại hoặc máy tính

1. Mở link GitHub Pages cũ.
2. Nếu thiết bị đã có cấu hình đồng bộ hợp lệ, app dùng lại. Nếu chưa có, nhập Owner, Repo private, Nhánh, Đường dẫn file dữ liệu và Token như trước rồi bấm **Kết nối**.
3. Khi file dữ liệu chưa có tài khoản, app hiện **Tạo admin lần đầu**. Chủ cửa hàng tự đặt tên đăng nhập, mật khẩu ít nhất 8 ký tự và nhập lại mật khẩu, rồi bấm **Tạo admin**.
4. App lưu tài khoản cùng dữ liệu lên repo private. Các lần sau đăng nhập bằng tài khoản vừa tạo, không tạo lại admin.

Token cần quyền đọc/ghi Contents của repo dữ liệu private. Không đưa token vào mã nguồn public. Không cần gửi token qua chat.

## 3. Tạo tài khoản nhân viên

- Đăng nhập admin → **Thêm → Quản lý tài khoản**.
- Điền tên đăng nhập, mật khẩu → **Tạo nhân viên**.
- Có thể khóa/mở khóa và đổi mật khẩu nhân viên tại đây.
- Bấm **Phân quyền** bên cạnh nhân viên → chọn quyền **Thêm mới / Sửa / Xóa** cho từng mục và **Xem báo cáo Tổng quan** → **Lưu quyền**.
- Nhân viên mới và tài khoản cũ chưa được tùy chỉnh mặc định chỉ được tạo đơn bán, phiếu nhập và khách hàng. Bỏ hết lựa chọn sẽ thu hồi toàn bộ quyền ghi dữ liệu.
- Quyền được lưu chung trong repo private và áp dụng trên máy nhân viên khi đồng bộ. Quản lý tài khoản, cấu hình, nhập Excel và backup/restore vẫn chỉ dành cho admin.
- Quyền sửa hóa đơn bán hàng bao gồm thu nợ; nhân viên vẫn được xem danh mục, tồn kho và lịch sử như trước.
- Mật khẩu được băm PBKDF2 cùng salt riêng, không lưu dạng văn bản. Không thể xem lại mật khẩu cũ; admin đặt lại khi cần.

| Chức năng | Nhân viên mặc định | Admin |
| --- | --- | --- |
| Bán hàng, tạo đơn, in hóa đơn | Có | Có |
| Nhập hàng cho mặt hàng đã có | Có | Có |
| Thêm khách hàng | Có | Có |
| Xem mặt hàng, tồn kho, tra cứu | Có | Có |
| Sửa/xóa hóa đơn, phiếu nhập, khách hàng | Không | Có |
| Thêm/sửa/xóa mặt hàng, trả NCC | Không | Có |
| Tổng quan, thu chi, thu nợ | Admin có thể cấp | Có |
| Cấu hình | Không | Có |
| Quản lý tài khoản, nhập Excel, backup/restore | Không | Có |

## 4. Đăng nhập trên điện thoại khác

1. Mở **cùng link GitHub Pages**.
2. Lần đầu trên thiết bị đó, chủ cửa hàng nhập cùng cấu hình repo private và token ở màn **Kết nối dữ liệu cửa hàng**.
3. Khi tải xong dữ liệu, app hiện màn đăng nhập. Nhân viên nhập tài khoản được cấp; không tạo admin mới.
4. Cấu hình được nhớ trên thiết bị. Các lần sau không phải nhập lại token. Nhân viên không có mục Cài đặt trong giao diện.

Có thể thêm link Pages vào màn hình chính bằng tính năng **Thêm vào màn hình chính** của trình duyệt. Chọn **Ghi nhớ đăng nhập trên thiết bị này** để mở lại vẫn đăng nhập. Bỏ chọn thì phiên tạm có thời hạn 8 giờ trong tab. Đăng xuất hoặc xóa dữ liệu trình duyệt sẽ xóa phiên đã nhớ.

## 5. Trả NCC và đồng bộ

- Thêm/sửa/xóa trả NCC đều tự đồng bộ GitHub, cập nhật tổng nhập và tồn kho.
- App chỉ báo lưu thành công sau khi GitHub xác nhận. Một đơn nhiều dòng được đồng bộ trong một lần ghi file.
- Máy khác tải dữ liệu mới mỗi 60 giây khi trang đang mở và không nhập form; admin có thể dùng **Đồng bộ lại ngay** trong Cài đặt.
- Nếu hai máy lưu cùng một phiên bản, máy lưu sau được báo có thay đổi, tải lại dữ liệu mới; hãy thực hiện lại thao tác.
- Khi lỗi mạng không rõ kết quả, kiểm tra/đồng bộ lại trước khi nhập lại để tránh tạo trùng.
- Tài khoản, mật khẩu băm và thông tin cửa hàng đi cùng file đồng bộ/backup. File backup cũ chưa có tài khoản sẽ giữ tài khoản hiện có khi phục hồi.

## 6. Xem theo ngày, tuần và tháng

Các màn **Tổng quan, Bán hàng, Nhập hàng, Trả NCC, Thu chi và Tra cứu** đều có:

- Hôm nay / Hôm qua.
- Tuần này / Tuần trước.
- Tháng này / Tháng trước.
- Tất cả.
- Tùy chỉnh: chọn Từ ngày và Đến ngày.

Khoảng ngày áp dụng cho lịch sử nhập, bán và trả NCC; bao gồm cả hai ngày biên. Tuần bắt đầu từ thứ Hai. Tuần/tháng trước lấy trọn kỳ; tuần/tháng hiện tại tính đến hôm nay. Khoảng tùy chỉnh nhập ngược tự đổi thứ tự khi lọc.

Chọn khoảng ngày xem được lịch sử ngay cả khi không nhập từ khóa. Có thể kết hợp từ khóa theo mã SP, IMEI, tên/số điện thoại khách hàng với khoảng ngày. Danh mục mặt hàng và khách hàng vẫn tìm trong toàn bộ dữ liệu.

## Giới hạn của bản Pages

Phân quyền giúp khóa thao tác trong app, phù hợp cách dùng nhỏ đã thống nhất. Người có token hoặc biết sửa dữ liệu/trình duyệt vẫn có thể vượt qua; đây không phải kiểm soát quyền phía máy chủ. Token và dữ liệu được lưu tại trình duyệt như bản cũ.

## Dành cho cập nhật mã nguồn

Người dùng điện thoại không cần chạy lệnh. Khi sửa mã nguồn, có thể sinh lại HTML gộp và chạy kiểm tra bằng Node.js:

```powershell
npm run bundle
npm test
```
