# BCB Web - Huong Dan Chay Du An

Huong dan nay dung cho repo:
- `bcb-backend` (Spring Boot)
- `bcb-frontend` (React + Vite)

## 1. Yeu cau moi truong

- Node.js 20+ (khuyen nghi 20 hoac 22)
- npm 10+
- Java JDK 21 (bat buoc, do backend build `release 21`)
- Maven Wrapper (da co san `mvnw`, `mvnw.cmd`)
- MySQL (co the dung XAMPP MySQL)
- Redis server

Luu y:
- `phpMyAdmin` chi la cong cu quan ly, khong phai DB server.
- Ban phai bat server MySQL/Redis de backend ket noi duoc.

## 2. Tao DB va tai khoan admin

File SQL tong hop da tao san:
- `bcb-backend/database/bcb_project_full.sql`

File nay se:
- Tao database `bcb_project`
- Tao day du schema MySQL cho project
- Seed 1 tai khoan admin

### Import bang phpMyAdmin

1. Mo phpMyAdmin.
2. Chon tab `Import`.
3. Chon file `bcb-backend/database/bcb_project_full.sql`.
4. Bam `Go`.

Tai khoan admin sau khi import:
- Username: `admin`
- Password: `Admin@123`
- Role: `ADMIN`

## 3. Tao file moi truong (`.env`)

### 3.1 Backend: `bcb-backend/.env`

Noi dung mau:

```env
MYSQL_URL=jdbc:mysql://127.0.0.1:3306/bcb_project?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
MYSQL_USER=root
MYSQL_PASS=

SPRING_REDIS_HOST=127.0.0.1
SPRING_REDIS_PORT=6379

JWT_EXPIRATION_MS=86400000
JWT_SECRET_KEY=12345678901234567890123456789012

MOMO_PARTNER_CODE=demo
MOMO_ACCESS_KEY=demo
MOMO_SECRET_KEY=demo
MOMO_REDIRECT_URL=http://localhost:5173/payment-result
MOMO_IPN_URL=http://localhost:8080/api/payment/momo/ipn
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
```

Luu y:
- `JWT_SECRET_KEY` can toi thieu 32 ky tu.
- Neu MySQL co mat khau thi dien vao `MYSQL_PASS`.
- Neu ban dung Redis chay trong Docker service ten `redis`, doi `SPRING_REDIS_HOST=redis`.

### 3.2 Frontend: `bcb-frontend/.env`

Noi dung mau:

```env
VITE_API_URL=http://localhost:8080/api
```

## 4. Lenh chay theo he dieu hanh

## 4.1 macOS / Linux (Terminal)

Bat backend:

```bash
cd bcb-backend
./mvnw spring-boot:run
```

Bat frontend:

```bash
cd bcb-frontend
npm install
npm run dev
```

Dia chi truy cap:
- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:8080/api`

## 4.2 Windows CMD

Bat backend:

```bat
cd bcb-backend
mvnw.cmd spring-boot:run
```

Bat frontend:

```bat
cd bcb-frontend
npm install
npm run dev
```

## 4.3 Windows PowerShell

Bat backend:

```powershell
cd bcb-backend
.\mvnw.cmd spring-boot:run
```

Bat frontend:

```powershell
cd bcb-frontend
npm install
npm run dev
```

## 5. Kiem tra nhanh sau khi chay

- Mo `http://localhost:5173`
- Dang nhap:
  - Username: `admin`
  - Password: `Admin@123`
- Neu loi API:
  - Kiem tra backend da chay chua
  - Kiem tra `VITE_API_URL`
  - Kiem tra MySQL/Redis da bat chua

## 6. Ghi chu ve Docker Compose

Repo hien co `docker-compose.yml`, nhung dang tro toi:
- `bcb-backend/Dockerfile.dev`
- `bcb-frontend/Dockerfile.dev`

Hai file nay hien chua co trong repo, nen chua the `docker compose up` ngay duoc neu khong bo sung Dockerfile.

## 7. Khac phuc loi thuong gap

### 7.1 Loi backend `release version 21 not supported`

Nguyen nhan: Maven dang chay bang Java 17 trong khi project build voi Java 21.

Kiem tra:

```bash
cd bcb-backend
./mvnw -v
```

Neu thay `Java version: 17`, hay ep dung Java 21:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
cd bcb-backend
./mvnw -v
./mvnw spring-boot:run
```

Dat co dinh cho zsh:

```bash
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home' >> ~/.zshrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### 7.2 Trong XAMPP MySQL khong Start duoc

Thuong do port `3306` da bi MySQL khac chiem (vi du Homebrew MySQL).

Kiem tra:

```bash
lsof -nP -iTCP:3306 -sTCP:LISTEN
```

Neu thay process tu Homebrew (`/opt/homebrew/opt/mysql/bin/mysqld`), co 2 cach:

1. Dung luon MySQL Homebrew, khong can bat MySQL trong XAMPP.
2. Hoac tat MySQL Homebrew roi moi bat MySQL XAMPP:

```bash
brew services stop mysql
```

Sau do mo lai XAMPP va Start `MySQL Database`.
