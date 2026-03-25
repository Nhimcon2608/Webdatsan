# Tài Liệu Thiết Kế

## Tổng Quan

Tài liệu này mô tả thiết kế kỹ thuật cho việc cải thiện bảo mật và luồng thanh toán của hệ thống BCB. Các thay đổi tập trung vào 4 lớp chính: bảo vệ route phía frontend, cấu hình bảo mật backend, luồng xác nhận thanh toán thủ công, và chuẩn hóa xử lý lỗi.

---

## Kiến Trúc

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│                                                      │
│  AuthContext (loading state) ──► RoleBasedRoute      │
│                                      │               │
│  SnackbarContext ◄── api.jsx interceptor             │
│                                      │               │
│  CheckoutPage / CheckoutFixedPage                    │
│       │                                              │
│       └── status: pending_confirmation               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (Spring Boot)               │
│                                                      │
│  SecurityConfig ──► anyRequest().authenticated()     │
│       │                                              │
│  ReservationController                               │
│       ├── @PreAuthorize trên mọi endpoint nhạy cảm  │
│       └── Pageable support                          │
│                                                      │
│  SSEController ──► thông báo xác nhận thanh toán    │
│                                                      │
│  CORS ──► đọc từ ALLOWED_ORIGINS env var            │
└─────────────────────────────────────────────────────┘
```

---

## Các Thành Phần Và Giao Diện

### 1. RoleBasedRoute (Frontend)

Hiện tại component này không xử lý trạng thái `loading` từ AuthContext, dẫn đến race condition.

Thiết kế mới:
```jsx
const RoleBasedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;          // chờ AuthContext
    if (!user) return <Navigate to="/login" />;
    if (user.role !== role) return <Navigate to="/" />;
    return children;
};
```

### 2. ProtectedRoute (Frontend)

Bổ sung kiểm tra loading state để tránh redirect sai khi trang vừa load:
```jsx
const ProtectedRoute = ({ children }) => {
    const { loading } = useAuth();
    const token = localStorage.getItem('authToken');

    if (loading) return <LoadingScreen />;
    if (!token) return <Navigate to="/login" replace />;
    return children;
};
```

### 3. api.jsx — Interceptor Xử Lý Lỗi

Thay thế các `break` rỗng bằng hiển thị Snackbar:
```js
case 400:
    showSnackbar(error.response.data?.message || 'Dữ liệu không hợp lệ', 'error');
    break;
case 403:
    showSnackbar('Bạn không có quyền thực hiện thao tác này', 'error');
    break;
case 404:
    showSnackbar('Không tìm thấy dữ liệu', 'warning');
    break;
```

Vì `api.jsx` không nằm trong React tree, cần dùng một event emitter hoặc export hàm `setSnackbarCallback` để kết nối với SnackbarContext.

### 4. SecurityConfig (Backend)

Thay đổi từ `anyRequest().permitAll()` sang `anyRequest().authenticated()` và khai báo rõ các public endpoint:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/auth/login", "/auth/register").permitAll()
    .requestMatchers("/payment/momo/ipn").permitAll()
    .requestMatchers(HttpMethod.GET, "/branches/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/badminton-courts/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/prices/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
    .requestMatchers("/auth/blacklisted-tokens").hasRole("ADMIN")
    .anyRequest().authenticated()
)
```

### 5. CORS Từ Biến Môi Trường

```java
@Value("${app.cors.allowed-origins:http://localhost:5173}")
private String allowedOrigins;

// Trong corsConfigurationSource():
configuration.setAllowedOrigins(
    Arrays.asList(allowedOrigins.split(","))
);
```

Trong `application.properties`:
```properties
app.cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:5173}
```

### 6. Luồng Thanh Toán Chuyển Khoản — Trạng Thái Mới

Thêm trạng thái `pending_confirmation` vào vòng đời đặt sân:

```
awaiting_payment
      │
      ▼ (user nhấn "Tôi đã chuyển khoản")
pending_confirmation
      │
      ├──► waiting    (manager xác nhận)
      └──► cancel     (manager từ chối)
```

Backend cần thêm endpoint:
- `PUT /reservations/{id}/confirm-payment` — MANAGER xác nhận
- `PUT /reservations/{id}/reject-payment` — MANAGER từ chối

### 7. Phân Trang Reservation

```java
@GetMapping("/branch/{branchId}")
public Page<ReservationResponseDTO> getReservationsByBranch(
    @PathVariable String branchId,
    @RequestParam(required = false) String status,
    @PageableDefault(size = 20, sort = "createAt", direction = Sort.Direction.DESC) Pageable pageable
) {
    return reservationService.getReservationsByBranch(branchId, status, pageable);
}
```

---

## Mô Hình Dữ Liệu

### Thay Đổi Trạng Thái Reservation

Bổ sung giá trị `pending_confirmation` vào comment trong model `Reservation.java`:

```java
/*
 * đang đợi thanh toán: awaiting_payment
 * chờ xác nhận chuyển khoản: pending_confirmation  ← MỚI
 * đang chờ checkin: waiting
 * đã checkin: checked
 * đã hoàn thành: finish
 * đã hủy: cancel
 */
```

Không cần thay đổi schema database vì `status` đã là `varchar(255)`.

### Response Phân Trang

```json
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 8,
  "currentPage": 0,
  "size": 20
}
```

---

## Thuộc Tính Đúng Đắn (Correctness Properties)

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Route bảo vệ không redirect khi đang loading**

Suy luận: Từ prework 1.1 và 1.2 — cả hai đều kiểm tra cùng một điều kiện loading=true. Gộp thành một property tổng quát: với bất kỳ trạng thái loading nào, component không được render Navigate.

*Với mọi* trạng thái `loading=true` trong AuthContext (bất kể user là null hay có giá trị), component `RoleBasedRoute` và `ProtectedRoute` SHALL render màn hình loading và SHALL NOT render component `<Navigate>`.

**Validates: Requirements 1.1, 1.2**

---

**Property 2: Endpoint không public từ chối request không có token**

Suy luận: Từ prework 2.1, 2.2, 2.3, 2.4 — tất cả đều là instance của cùng một rule. Gộp thành property tổng quát thay vì liệt kê từng endpoint.

*Với mọi* HTTP request đến bất kỳ endpoint nào không thuộc danh sách public (`/auth/login`, `/auth/register`, `/payment/momo/ipn`, các GET public) mà không có header `Authorization: Bearer <token>` hợp lệ, THE Hệ thống SHALL trả về HTTP status 401.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

**Property 3: Endpoint blacklisted-tokens chỉ cho ADMIN**

Suy luận: Từ prework 2.5 — áp dụng cho mọi role không phải ADMIN, không chỉ một user cụ thể.

*Với mọi* token JWT hợp lệ thuộc role USER hoặc MANAGER, request đến `GET /auth/blacklisted-tokens` SHALL trả về HTTP 403.

**Validates: Requirements 2.5**

---

**Property 4: Mọi lỗi HTTP đều hiển thị qua Snackbar**

Suy luận: Từ prework 4.1, 4.2, 4.3, 4.4 — tất cả đều kiểm tra cùng một pattern: lỗi HTTP → Snackbar. Gộp thành một property bao quát tất cả error codes.

*Với mọi* response lỗi HTTP có status code trong tập {400, 403, 404}, interceptor trong `api.jsx` SHALL gọi hàm hiển thị Snackbar với message tương ứng và SHALL NOT gọi `window.alert()`.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

**Property 5: Xác nhận chuyển khoản chuyển sang pending_confirmation**

Suy luận: Từ prework 5.1 — áp dụng cho mọi reservation có trạng thái awaiting_payment, không chỉ một reservation cụ thể.

*Với mọi* reservation có trạng thái `awaiting_payment`, khi người dùng gọi hành động xác nhận đã chuyển khoản, THE Hệ thống SHALL cập nhật trạng thái reservation thành `pending_confirmation` và SHALL NOT cập nhật thành `waiting`.

**Validates: Requirements 5.1**

---

**Property 6: State machine thanh toán — quản lý duyệt/từ chối**

Suy luận: Từ prework 5.3 và 5.4 — cả hai đều là state transitions từ `pending_confirmation`. Gộp thành một property về state machine.

*Với mọi* reservation có trạng thái `pending_confirmation`, khi quản lý thực hiện hành động xác nhận thì trạng thái SHALL chuyển sang `waiting`; khi quản lý từ chối thì trạng thái SHALL chuyển sang `cancel`. Không có trạng thái trung gian nào khác được phép.

**Validates: Requirements 5.3, 5.4**

---

**Property 7: Response phân trang luôn có đủ cấu trúc**

Suy luận: Từ prework 7.1 và 7.3 — gộp thành một property kiểm tra cả việc hỗ trợ params lẫn cấu trúc response.

*Với mọi* giá trị `page` (số nguyên không âm) và `size` (số nguyên dương) hợp lệ được truyền vào `GET /reservations/branch/{branchId}`, response SHALL luôn chứa đủ 4 trường: `content`, `totalElements`, `totalPages`, `currentPage`.

**Validates: Requirements 7.1, 7.3**

---

## Xử Lý Lỗi

| Tình huống | Hành vi hiện tại | Hành vi mới |
|---|---|---|
| API 400 | Bỏ qua (break rỗng) | Snackbar error với message từ response |
| API 403 | Bỏ qua (break rỗng) | Snackbar "Không có quyền thực hiện" |
| API 404 | Bỏ qua (break rỗng) | Snackbar "Không tìm thấy dữ liệu" |
| Lỗi xác nhận thanh toán | `alert()` | Snackbar error |
| Lỗi hủy đặt cố định | `alert()` | Snackbar error |
| Token hết hạn | Redirect login (đúng) | Giữ nguyên + xóa token |

---

## Chiến Lược Kiểm Thử

### Unit Tests

- Test `RoleBasedRoute` với các trạng thái: loading=true, user=null, user với role đúng, user với role sai
- Test `ProtectedRoute` với loading=true và token=null
- Test interceptor `api.jsx` với mock response 400/403/404
- Test hàm `updateReservation` với status `pending_confirmation`

### Property-Based Tests

Sử dụng thư viện **fast-check** cho frontend và **jqwik** cho backend.

Mỗi property-based test chạy tối thiểu 100 lần với input ngẫu nhiên.

Mỗi test được annotate với comment:
`// Feature: security-and-payment-hardening, Property {N}: {mô tả}`

- **Property 1** — Generate ngẫu nhiên các trạng thái loading/user, kiểm tra RoleBasedRoute không render Navigate khi loading=true
- **Property 2** — Generate ngẫu nhiên các endpoint path và HTTP method, kiểm tra response 401 khi không có token
- **Property 3** — Generate ngẫu nhiên các role (USER, MANAGER, ADMIN), kiểm tra chỉ ADMIN được truy cập blacklisted-tokens
- **Property 4** — Generate ngẫu nhiên HTTP status codes lỗi, kiểm tra Snackbar luôn được gọi
- **Property 5** — Generate ngẫu nhiên reservation với status awaiting_payment, kiểm tra sau confirm thì status = pending_confirmation
- **Property 6** — Generate ngẫu nhiên page/size params, kiểm tra response luôn có đủ 4 trường phân trang
