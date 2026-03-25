# Tài Liệu Yêu Cầu

## Giới Thiệu

Dự án BCB (Badminton Court Booking) là hệ thống đặt sân cầu lông trực tuyến gồm frontend React và backend Spring Boot. Qua quá trình review, hệ thống hiện tại có một số vấn đề nghiêm trọng về bảo mật, luồng thanh toán chưa được xác minh, và trải nghiệm người dùng chưa nhất quán. Spec này tập trung vào việc vá các lỗ hổng bảo mật, cải thiện luồng xác thực/phân quyền, và nâng cấp trải nghiệm thanh toán.

## Bảng Thuật Ngữ

- **Hệ thống**: Ứng dụng BCB bao gồm frontend React và backend Spring Boot
- **Người dùng**: Tài khoản có vai trò USER — người đặt sân
- **Quản lý (Manager)**: Tài khoản có vai trò MANAGER — quản lý chi nhánh
- **Admin**: Tài khoản có vai trò ADMIN — quản trị toàn hệ thống
- **Token JWT**: Chuỗi xác thực được cấp sau khi đăng nhập, có thời hạn
- **ProtectedRoute**: Component React kiểm tra quyền truy cập trước khi render trang
- **RoleBasedRoute**: Component React kiểm tra vai trò người dùng
- **AuthContext**: Context React lưu trạng thái xác thực toàn cục
- **SecurityConfig**: Cấu hình Spring Security kiểm soát quyền truy cập API
- **IPN (Instant Payment Notification)**: Webhook từ MoMo xác nhận kết quả thanh toán
- **Đặt cọc**: Thanh toán 50% trước khi đến sân (áp dụng cho đặt sân thường)
- **Đặt cố định**: Đặt sân theo lịch cố định 4 tuần, thanh toán 100%
- **Snackbar**: Thông báo nổi tạm thời hiển thị phản hồi cho người dùng
- **CORS**: Cơ chế kiểm soát truy cập tài nguyên từ nguồn gốc khác
- **Endpoint**: Địa chỉ API cụ thể trên backend

---

## Yêu Cầu

### Yêu Cầu 1: Bảo Vệ Route Phía Frontend

**User Story:** Là một người dùng đã đăng nhập, tôi muốn hệ thống kiểm tra đúng quyền truy cập của mình, để tôi không bị chuyển hướng sai hoặc truy cập được trang không thuộc vai trò của mình.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng truy cập route được bảo vệ VÀ trạng thái xác thực đang tải, THE Hệ thống SHALL hiển thị màn hình loading thay vì chuyển hướng ngay lập tức
2. WHEN người dùng có token hợp lệ trong localStorage nhưng AuthContext chưa tải xong thông tin user, THE Hệ thống SHALL chờ AuthContext hoàn tất trước khi quyết định chuyển hướng
3. WHEN người dùng truy cập route yêu cầu vai trò cụ thể mà không có vai trò đó, THE Hệ thống SHALL chuyển hướng về trang chủ phù hợp với vai trò hiện tại
4. IF token trong localStorage đã hết hạn hoặc không hợp lệ, THEN THE Hệ thống SHALL xóa token và chuyển hướng người dùng về trang đăng nhập

---

### Yêu Cầu 2: Bảo Mật API Backend

**User Story:** Là một admin hệ thống, tôi muốn các endpoint API được bảo vệ đúng cách, để dữ liệu nhạy cảm không bị truy cập trái phép.

#### Tiêu Chí Chấp Nhận

1. WHEN bất kỳ request nào gọi đến endpoint không thuộc danh sách public, THE Hệ thống SHALL yêu cầu token JWT hợp lệ
2. WHEN endpoint `GET /reservations` được gọi mà không có token, THE Hệ thống SHALL trả về HTTP 401
3. WHEN endpoint `PATCH /reservations/schedule-cancel/{id}` được gọi mà không có token, THE Hệ thống SHALL trả về HTTP 401
4. WHEN endpoint `PUT /reservations/cancel/{id}` được gọi mà không có token, THE Hệ thống SHALL trả về HTTP 401
5. WHEN endpoint `GET /auth/blacklisted-tokens` được gọi bởi tài khoản không phải ADMIN, THE Hệ thống SHALL trả về HTTP 403

---

### Yêu Cầu 3: Cấu Hình CORS Linh Hoạt

**User Story:** Là một developer triển khai hệ thống, tôi muốn cấu hình CORS đọc từ biến môi trường, để ứng dụng hoạt động đúng trên cả môi trường local lẫn production.

#### Tiêu Chí Chấp Nhận

1. WHEN backend khởi động, THE Hệ thống SHALL đọc danh sách allowed origins từ biến môi trường `ALLOWED_ORIGINS`
2. IF biến môi trường `ALLOWED_ORIGINS` không được cấu hình, THEN THE Hệ thống SHALL sử dụng giá trị mặc định `http://localhost:5173`
3. WHEN request đến từ origin không nằm trong danh sách cho phép, THE Hệ thống SHALL từ chối request với lỗi CORS

---

### Yêu Cầu 4: Xử Lý Lỗi API Phía Frontend

**User Story:** Là một người dùng, tôi muốn nhận được thông báo rõ ràng khi có lỗi xảy ra, để tôi biết cần làm gì tiếp theo thay vì thấy màn hình trắng hoặc không có phản hồi.

#### Tiêu Chí Chấp Nhận

1. WHEN API trả về lỗi HTTP 400, THE Hệ thống SHALL hiển thị thông báo lỗi cụ thể qua Snackbar
2. WHEN API trả về lỗi HTTP 403, THE Hệ thống SHALL hiển thị thông báo "Bạn không có quyền thực hiện thao tác này" qua Snackbar
3. WHEN API trả về lỗi HTTP 404, THE Hệ thống SHALL hiển thị thông báo "Không tìm thấy dữ liệu" qua Snackbar
4. WHILE người dùng đang ở trang thanh toán VÀ xảy ra lỗi xác nhận, THE Hệ thống SHALL hiển thị lỗi qua Snackbar thay vì dùng `alert()`

---

### Yêu Cầu 5: Luồng Xác Nhận Thanh Toán Chuyển Khoản

**User Story:** Là một quản lý chi nhánh, tôi muốn có thể xác nhận hoặc từ chối thanh toán chuyển khoản của khách, để đảm bảo chỉ những đơn đặt sân đã thực sự thanh toán mới được xác nhận.

#### Tiêu Chí Chấp Nhận

1. WHEN người dùng nhấn "Tôi đã chuyển khoản", THE Hệ thống SHALL chuyển trạng thái đặt sân sang `pending_confirmation` thay vì `waiting`
2. WHEN đặt sân có trạng thái `pending_confirmation`, THE Hệ thống SHALL hiển thị đơn đó trong danh sách "Chờ xác nhận thanh toán" trên dashboard quản lý
3. WHEN quản lý xác nhận thanh toán, THE Hệ thống SHALL chuyển trạng thái đặt sân sang `waiting` và gửi thông báo SSE đến người dùng
4. WHEN quản lý từ chối thanh toán, THE Hệ thống SHALL chuyển trạng thái đặt sân sang `cancel` và gửi thông báo SSE đến người dùng
5. WHEN người dùng nhận thông báo xác nhận hoặc từ chối, THE Hệ thống SHALL hiển thị Snackbar với nội dung tương ứng

---

### Yêu Cầu 6: Dọn Dẹp Code Và Chuẩn Hóa

**User Story:** Là một developer trong team, tôi muốn codebase sạch và nhất quán, để việc bảo trì và mở rộng dễ dàng hơn.

#### Tiêu Chí Chấp Nhận

1. WHEN build production được tạo ra, THE Hệ thống SHALL không chứa bất kỳ câu lệnh `console.log` nào trong code frontend
2. WHEN có lỗi xảy ra trong các async function, THE Hệ thống SHALL sử dụng `useSnackbar` từ SnackbarContext thay vì `alert()` hoặc `console.error` đơn thuần
3. WHEN đặt tên file service, THE Hệ thống SHALL sử dụng tên nhất quán theo pattern `[tên]Service.jsx` (ví dụ: `branchService.jsx` thay vì `branchServce.jsx`)
4. WHEN `System.out.println` được dùng trong backend, THE Hệ thống SHALL thay thế bằng logger SLF4J phù hợp

---

### Yêu Cầu 7: Phân Trang Cho Danh Sách Dữ Liệu Lớn

**User Story:** Là một quản lý, tôi muốn danh sách đặt sân được phân trang, để trang dashboard không bị chậm khi có nhiều dữ liệu.

#### Tiêu Chí Chấp Nhận

1. WHEN endpoint `GET /reservations/branch/{branchId}` được gọi, THE Hệ thống SHALL hỗ trợ tham số `page` và `size` để phân trang
2. WHEN tham số `page` và `size` không được truyền vào, THE Hệ thống SHALL trả về trang đầu tiên với tối đa 20 bản ghi
3. WHEN response phân trang được trả về, THE Hệ thống SHALL bao gồm thông tin `totalElements`, `totalPages`, `currentPage`
4. WHEN frontend nhận response phân trang, THE Hệ thống SHALL hiển thị component phân trang cho phép người dùng chuyển trang
