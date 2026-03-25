# Kế Hoạch Triển Khai

- [x] 1. Sửa ProtectedRoute và RoleBasedRoute để xử lý loading state





  - Cập nhật `ProtectedRoute.jsx` để đọc `loading` từ `useAuth()` và render màn hình loading thay vì redirect ngay
  - Cập nhật `RoleBasedRoute.jsx` để đọc `loading` từ `useAuth()` và render màn hình loading khi `loading=true`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Viết property test cho route protection (Property 1)
  - **Property 1: Route bảo vệ không redirect khi đang loading**
  - Dùng fast-check, generate ngẫu nhiên các trạng thái `loading=true` với user null hoặc có giá trị
  - Kiểm tra cả `RoleBasedRoute` và `ProtectedRoute` không render `<Navigate>` khi `loading=true`
  - Annotate: `// Feature: security-and-payment-hardening, Property 1: Route bảo vệ không redirect khi đang loading`
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Cập nhật SecurityConfig backend — bảo vệ các endpoint





  - Thay `anyRequest().permitAll()` bằng `anyRequest().authenticated()` trong `SecurityConfig.java`
  - Khai báo rõ các public endpoint: `/auth/login`, `/auth/register`, `/payment/momo/ipn`, các GET public cho branches/courts/prices/reviews
  - Thêm rule `.requestMatchers("/auth/blacklisted-tokens").hasRole("ADMIN")`
  - Bỏ rule `.requestMatchers("/auth/**").permitAll()` quá rộng, thay bằng từng endpoint cụ thể
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Viết property test cho bảo mật API (Property 2 & 3)
  - **Property 2: Endpoint không public từ chối request không có token**
  - **Property 3: Endpoint blacklisted-tokens chỉ cho ADMIN**
  - Dùng jqwik, generate ngẫu nhiên các endpoint path và HTTP method, kiểm tra 401 khi không có token
  - Generate ngẫu nhiên các role USER/MANAGER, kiểm tra 403 khi gọi `/auth/blacklisted-tokens`
  - Annotate: `// Feature: security-and-payment-hardening, Property 2 & 3`
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 3. Cấu hình CORS đọc từ biến môi trường





  - Thêm `@Value("${app.cors.allowed-origins:http://localhost:5173}")` vào `SecurityConfig.java`
  - Cập nhật `corsConfigurationSource()` để parse danh sách origins từ chuỗi phân cách bằng dấu phẩy
  - Thêm `app.cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:5173}` vào `application.properties`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Kết nối api.jsx interceptor với SnackbarContext





  - Tạo cơ chế callback (event emitter hoặc exported setter) để `api.jsx` có thể gọi `showSnackbar` từ ngoài React tree
  - Cập nhật `SnackbarContext.jsx` để đăng ký callback khi mount
  - Cập nhật response interceptor trong `api.jsx`: thay các `break` rỗng cho case 400, 403, 404 bằng gọi `showSnackbar` với message tương ứng
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 4.1 Viết property test cho error interceptor (Property 4)
  - **Property 4: Mọi lỗi HTTP đều hiển thị qua Snackbar**
  - Dùng fast-check, generate ngẫu nhiên status codes trong tập {400, 403, 404}
  - Kiểm tra interceptor gọi `showSnackbar` và không gọi `window.alert()`
  - Annotate: `// Feature: security-and-payment-hardening, Property 4: Mọi lỗi HTTP đều hiển thị qua Snackbar`
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Thay alert() bằng Snackbar trong CheckoutFixedPage và CheckoutPage




  - Trong `CheckoutFixedPage.jsx`: thay `alert(...)` trong `handleConfirmPayment` và `confirmCancelPayment` bằng `useSnackbar`
  - Trong `CheckoutPage.jsx`: kiểm tra và thay bất kỳ `alert()` nào bằng Snackbar
  - Xóa `console.log("🧾 Gửi danh sách reservationIds:", reservationIds)` trong `CheckoutFixedPage.jsx`
  - _Requirements: 4.4, 6.1, 6.2_

- [ ] 6. Triển khai luồng pending_confirmation — Backend
  - Thêm endpoint `PUT /reservations/{id}/confirm-payment` trong `ReservationController.java` (chỉ MANAGER)
  - Thêm endpoint `PUT /reservations/{id}/reject-payment` trong `ReservationController.java` (chỉ MANAGER)
  - Thêm method `confirmPayment(String id)` và `rejectPayment(String id)` trong `ReservationService.java`
  - `confirmPayment`: chuyển status sang `waiting`, gửi SSE đến player
  - `rejectPayment`: chuyển status sang `cancel`, gửi SSE đến player
  - Cập nhật `updateStatus` trong `ReservationService.java` để cho phép `pending_confirmation` là trạng thái hợp lệ
  - _Requirements: 5.1, 5.3, 5.4_

- [ ]* 6.1 Viết property test cho payment state machine (Property 5 & 6)
  - **Property 5: Xác nhận chuyển khoản chuyển sang pending_confirmation**
  - **Property 6: State machine thanh toán — quản lý duyệt/từ chối**
  - Dùng jqwik, generate ngẫu nhiên reservation với status `awaiting_payment`, kiểm tra sau confirm thì status = `pending_confirmation`
  - Generate ngẫu nhiên reservation với status `pending_confirmation`, kiểm tra confirm → `waiting`, reject → `cancel`
  - Annotate: `// Feature: security-and-payment-hardening, Property 5 & 6`
  - **Validates: Requirements 5.1, 5.3, 5.4**

- [ ] 7. Triển khai luồng pending_confirmation — Frontend
  - Cập nhật `CheckoutPage.jsx`: `handleConfirmPayment` gọi API cập nhật status sang `pending_confirmation` thay vì `waiting`
  - Cập nhật `CheckoutFixedPage.jsx`: `handleConfirmPayment` gọi API cập nhật status sang `pending_confirmation` thay vì `waiting`
  - Cập nhật `Reservation.jsx` (manager): thêm filter/tab "Chờ xác nhận thanh toán" cho status `pending_confirmation`
  - Thêm nút "Xác nhận" và "Từ chối" trong bảng quản lý cho các reservation có status `pending_confirmation`
  - Kết nối SSE để hiển thị Snackbar khi nhận thông báo xác nhận/từ chối từ manager
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Thêm phân trang cho GET /reservations/branch/{branchId}
  - Cập nhật `ReservationController.java`: thêm `Pageable` vào endpoint `GET /branch/{branchId}` với `@PageableDefault(size = 20)`
  - Cập nhật `ReservationService.java`: thêm method `getReservationsByBranch(String branchId, String status, Pageable pageable)` trả về `Page<ReservationResponseDTO>`
  - Cập nhật `ReservationRepository.java`: thêm query method hỗ trợ `Pageable`
  - Response phải bao gồm `content`, `totalElements`, `totalPages`, `currentPage`
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 8.1 Viết property test cho phân trang (Property 7)
  - **Property 7: Response phân trang luôn có đủ cấu trúc**
  - Dùng jqwik, generate ngẫu nhiên giá trị `page` (số nguyên không âm) và `size` (số nguyên dương)
  - Kiểm tra response luôn chứa đủ 4 trường: `content`, `totalElements`, `totalPages`, `currentPage`
  - Annotate: `// Feature: security-and-payment-hardening, Property 7: Response phân trang luôn có đủ cấu trúc`
  - **Validates: Requirements 7.1, 7.3**

- [ ] 9. Dọn dẹp console.log và System.out.println
  - Xóa các `console.log` active (không phải comment) trong: `voucherService.jsx`, `partnershipRequestService.jsx`, `branchServce.jsx`, `authService.jsx`, `CheckoutFixedPage.jsx`, `BranchDetailPage.jsx`, `PartnershipRequestPage.jsx`, `BranchDetail.jsx`, `Footer.jsx`, `BookingDetail.jsx`
  - Thay `System.out.println` trong `ReservationService.java`, `PartnershipRequestService.java`, `MoMoController.java` bằng logger SLF4J (`log.info(...)` hoặc `log.debug(...)`)
  - _Requirements: 6.1, 6.4_

- [ ] 10. Đổi tên file branchServce.jsx thành branchService.jsx
  - Đổi tên file `bcb-frontend/src/services/branchServce.jsx` thành `branchService.jsx`
  - Cập nhật tất cả import trong codebase trỏ đến file cũ
  - _Requirements: 6.3_

- [ ] 11. Checkpoint — Đảm bảo tất cả tests pass
  - Ensure all tests pass, ask the user if questions arise.
