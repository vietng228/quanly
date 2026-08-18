# Quản Lý Thu Chi & Bán Hàng — Hướng dẫn dùng thử

App quản lý mặt hàng, nhập hàng, bán hàng, thu chi cho cửa hàng nhỏ. Chạy **hoàn toàn offline** ngay trên điện thoại, không cần cài đặt qua Play Store, không cần mạng.

## 1. Cách mở app trên điện thoại Android

**Cách nhanh nhất (dùng thử ngay):**

1. Giải nén file `quanlyshop.zip` bằng app Quản lý file (Files/File Manager) có sẵn trên điện thoại (hoặc cài app "ZArchiver"/"Files by Google" nếu máy chưa có tool giải nén).
2. Mở thư mục vừa giải nén, tìm file **`index.html`**, bấm vào để mở bằng **Chrome**.
3. App chạy ngay — thêm mặt hàng, nhập/bán hàng, ghi thu chi... dữ liệu tự lưu trên máy.
4. Muốn có icon riêng ngoài màn hình chính: trong Chrome bấm menu ⋮ → **"Thêm vào Màn hình chính"**.

> Lưu ý: mở theo cách này (`file://`), app vẫn hoạt động và lưu dữ liệu bình thường, nhưng phần "cài như app thật" (ẩn thanh địa chỉ, cache để mở lại không cần load lại) sẽ chưa đầy đủ vì trình duyệt yêu cầu chạy qua địa chỉ http/https. Xem cách 2 bên dưới để có trải nghiệm "cài app" đầy đủ.

**Cách 2 (trải nghiệm như app thật, có cài đặt hẳn hoi):**

Chép cả thư mục vào một máy chủ web nhỏ rồi mở qua địa chỉ `http://...`, ví dụ:
- Dùng app **"Web Server for Chrome"**, **"HFS"**, hoặc **Termux** (`pkg install python && python -m http.server 8080` trong thư mục app) trên chính điện thoại, rồi mở `http://localhost:8080` bằng Chrome.
- Hoặc up thư mục lên một dịch vụ hosting tĩnh miễn phí (GitHub Pages, Netlify, Vercel...) rồi mở bằng link https.

Khi mở qua http/https, Chrome sẽ hiện banner "Cài đặt ứng dụng" / bấm ⋮ → **"Cài đặt ứng dụng"** để có app riêng, chạy full màn hình, và cache toàn bộ để **mở lại không cần mạng, không cần load lại**.

## 2. Các tính năng chính

- **Mặt hàng**: tạo danh sách sản phẩm trước (tên, giá nhập/bán mặc định, mã vạch). Có thể quét mã vạch bằng camera để gán cho mặt hàng.
- **Nhập hàng / Bán hàng**: bấm chọn mặt hàng từ danh sách đã lưu (hoặc quét mã vạch để tìm nhanh), nhập ngày, giá, số lượng. Khi bán hàng có thêm tên khách, số điện thoại, địa chỉ.
- **Thu chi**: ghi các khoản thu/chi độc lập (tiền điện, tiền thuê nhà, thu nhập khác...) không thuộc nhập/bán hàng.
- **Tổng quan**: tự động cộng doanh thu, lợi nhuận, chi phí nhập hàng, thu/chi khác theo Hôm nay / Tuần này / Tháng này / Tất cả.
- **Cài đặt → Backup/Restore**: xuất toàn bộ dữ liệu ra 1 file `.json` để lưu trữ hoặc chuyển máy; phục hồi lại khi cần.

## 3. Một vài điều cần biết (bản thử nghiệm)

- Dữ liệu lưu trong bộ nhớ trình duyệt (localStorage) trên chính điện thoại — **nên backup định kỳ**, vì xoá cache Chrome hoặc gỡ app có thể mất dữ liệu.
- Lợi nhuận gộp khi bán hàng được tính theo **giá nhập gần nhất** của mặt hàng tại thời điểm bán (không theo dõi tồn kho theo lô/FIFO chi tiết) — phù hợp cho ước tính nhanh, chưa phải kế toán kho chính xác tuyệt đối.
- Đây là bản dùng thử đầu tiên — góp ý thêm để mình tinh chỉnh: thêm quản lý tồn kho, in hoá đơn, nhiều người dùng, đồ thị thống kê, v.v.
