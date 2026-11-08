# ⚡ Zitnits Link4M Headless Bypass Suite (v4.0 API Edition)

> **Giải pháp tối thượng cho Link4M / Link1s:** Chạy ngầm bộ đếm thời gian nhà tài trợ (What-On) bằng **API thuần 100% không cần render trang web**, tự động bắt mã và nạp mã, tự động nhận link đích ngay khi giải Captcha.

---

## 🚀 Cài Đặt Nhanh (Tampermonkey / Violentmonkey)

👉 **[Nhấp vào đây để Cài đặt Loader 1-Click (zitnits_headless.user.js)](https://raw.githubusercontent.com/khanghack222/zitnits-link4m-headless/main/zitnits_headless.user.js)**

*(Sau khi nhấp, trình duyệt sẽ tự động mở hộp thoại Tampermonkey -> Bấm **Install**).*

---

## ⚡ Điểm Khác Biệt & Khắc Phục Lỗi

1. **Khắc phục triệt để lỗi chuyển hướng về `link4m.com`**:
   - Loại bỏ hoàn toàn selector bắt link generic `a[href]`.
   - Hook trực tiếp tầng mạng (Fetch & XMLHttpRequest) tới endpoint `/links/get-link-info` của Link4M để bóc đúng `res.url` của trang đích.
2. **Cơ chế Headless API Timer cho nhà tài trợ**:
   - Khi mở trang nhiệm vụ, script bóc tách token & session từ `service-v2.js?key=...`.
   - Gửi request `POST /widget/client.js` để kích hoạt bộ đếm trên server What-On.
   - Chạy timer 60s (step 1) và 15s (step 2) hoàn toàn ngầm không cần cuộn trang hay render DOM.
   - Lấy mã trực tiếp và nạp vào form Link4M.
3. **Quy trình tối giản cho người dùng**:
   - Bạn chỉ cần nhấp giải Captcha trên Link4M.
   - Toàn bộ khâu còn lại tự động 100%.

---

## 🧩 Cài đặt Chrome Extension (Thủ Công)

Nếu bạn muốn dùng Extension Manifest V3 thay vì Userscript:

1. Tải thư mục [`extension/`](./extension) về máy.
2. Mở trình duyệt, truy cập `chrome://extensions`.
3. Bật **Developer mode** (Chế độ dành cho nhà phát triển).
4. Bấm **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục `extension/`.
