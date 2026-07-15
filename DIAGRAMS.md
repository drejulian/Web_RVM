# Arsitektur Sistem RVM (Reverse Vending Machine)

Dokumentasi lengkap arsitektur sistem aplikasi web RVM dengan diagram Mermaid.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer - PWA"
        Browser[Web Browser]
        PWA[Service Worker<br/>Offline Support]
        ReactApp[React 19 Components]
        NextRouter[Next.js 15 Router]
        
        subgraph "UI Components"
            Maps[Leaflet Maps<br/>RVM Locations]
            QRScanner[QR Scanner<br/>html5-qrcode]
            QRGen[QR Generator<br/>qrcode.react]
            AuthUI[Auth Components<br/>Google OAuth Button]
        end
        
        subgraph "State Management"
            UserContext[User Context]
            LocationContext[Location Context]
            InstallContext[Install Context]
        end
    end
    
    subgraph "Server Layer - Node.js"
        subgraph "Next.js Server"
            NextServer[Next.js Server<br/>Port 3000]
            APIRoutes[API Routes<br/>/api/*]
        end
        
        subgraph "Custom Server"
            ExpressHTTP[HTTP Server<br/>Express + Next]
            SocketIOSrv[Socket.IO Server<br/>Web Client Updates]
            MQTTClientSrv[MQTT Client<br/>mqtt.js v5.15.1]
        end
        
        subgraph "Middleware"
            AuthMiddleware[Auth Middleware<br/>JWT Validation]
            CORSMiddleware[CORS Handler]
        end
    end
    
    subgraph "Business Logic Layer"
        AuthService[Auth Service<br/>JWT + OAuth + bcrypt]
        BottleService[Bottle Service<br/>Deposit/Redeem Logic]
        UserService[User Service<br/>Profile Management]
        NewsService[News Service<br/>Content Management]
        LocationService[Location Service<br/>RVM + Arduino]
    end
    
    subgraph "Data Access Layer"
        PrismaClient[Prisma Client<br/>ORM]
        
        subgraph "Database Models"
            UserModel[User Model]
            BottleModel[Bottle Models]
            LocationModel[Location Models]
            VoucherModel[Voucher Models]
            AdminModel[Admin Models]
        end
    end
    
    subgraph "Database"
        PostgreSQL[(PostgreSQL<br/>Primary Database)]
    end
    
    subgraph "External Services"
        HiveMQCloud[HiveMQ Cloud<br/>MQTT Broker<br/>Port 8883 TLS]
        GoogleOAuth[Google OAuth 2.0<br/>Authentication]
        Firebase[Firebase Admin<br/>Cloud Messaging]
        PaymentGW[Payment Gateways<br/>BCA/GoPay/OVO/Dana]
        EmailService[Nodemailer<br/>Email Service]
    end
    
    subgraph "IoT Layer"
        Arduino1[Arduino Device 1<br/>deviceId: RVM-001]
        Arduino2[Arduino Device 2<br/>deviceId: RVM-002]
        ArduinoN[Arduino Device N<br/>deviceId: RVM-N]
        
        Sensors[Ultrasonic Sensors<br/>Distance Detection]
    end
    
    Browser --> ReactApp
    ReactApp --> NextRouter
    ReactApp --> Maps
    ReactApp --> QRScanner
    ReactApp --> QRGen
    ReactApp --> AuthUI
    ReactApp --> UserContext
    ReactApp --> LocationContext
    ReactApp --> InstallContext
    ReactApp --> PWA
    
    ReactApp --> APIRoutes
    ReactApp --> SocketIOSrv
    
    NextRouter --> NextServer
    APIRoutes --> ExpressHTTP
    ExpressHTTP --> AuthMiddleware
    ExpressHTTP --> CORSMiddleware
    
    APIRoutes --> AuthService
    APIRoutes --> BottleService
    APIRoutes --> UserService
    APIRoutes --> NewsService
    APIRoutes --> LocationService
    
    AuthService --> PrismaClient
    BottleService --> PrismaClient
    UserService --> PrismaClient
    NewsService --> PrismaClient
    LocationService --> PrismaClient
    
    PrismaClient --> UserModel
    PrismaClient --> BottleModel
    PrismaClient --> LocationModel
    PrismaClient --> VoucherModel
    PrismaClient --> AdminModel
    
    UserModel --> PostgreSQL
    BottleModel --> PostgreSQL
    LocationModel --> PostgreSQL
    VoucherModel --> PostgreSQL
    AdminModel --> PostgreSQL
    
    AuthService -.-> GoogleOAuth
    AuthService -.-> EmailService
    LocationService -.-> Firebase
    BottleService -.-> PaymentGW
    
    Arduino1 -->|MQTT Publish| HiveMQCloud
    Arduino2 -->|MQTT Publish| HiveMQCloud
    ArduinoN -->|MQTT Publish| HiveMQCloud
    Sensors --> Arduino1
    Sensors --> Arduino2
    Sensors --> ArduinoN
    
    HiveMQCloud -->|MQTT Subscribe| MQTTClientSrv
    MQTTClientSrv --> BottleService
    MQTTClientSrv --> LocationService
    BottleService --> SocketIOSrv
    SocketIOSrv -.->|Real-time Events| ReactApp
    
    style Browser fill:#3b82f6,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style Arduino1 fill:#00979d,color:#fff
    style Arduino2 fill:#00979d,color:#fff
    style ArduinoN fill:#00979d,color:#fff
    style HiveMQCloud fill:#ff6b6b,color:#fff
    style MQTTClientSrv fill:#8b5cf6,color:#fff
    style SocketIOSrv fill:#06b6d4,color:#fff
    style GoogleOAuth fill:#4285f4,color:#fff
    style Firebase fill:#ffca28,color:#000
```

---

## 2. System Architecture Overview - Simplified (Hybrid MQTT + Socket.IO)

Versi sederhana dari arsitektur sistem yang mudah dipahami dan dijelaskan.

```mermaid
graph TB
    subgraph "Layer 1: Client"
        Client[Web Browser / PWA<br/>Next.js + React]
    end
    
    subgraph "Layer 2: Application Server"
        WebServer[Next.js Server<br/>Frontend + API Routes]
        SocketIO[Socket.IO Server<br/>Web Client Updates]
        MQTTClient[MQTT Client<br/>Subscribe from Arduino]
    end
    
    subgraph "Layer 3: Business Logic"
        Services[Services Layer<br/>MQTT, Bottle, Auth, User, Location, News]
    end
    
    subgraph "Layer 4: Database"
        DB[(PostgreSQL<br/>Data Storage)]
        ORM[Prisma ORM<br/>Database Access]
    end
    
    subgraph "Layer 5: External Systems"
        MQTTBroker[HiveMQ Cloud<br/>MQTT Broker]
        IoT[Arduino Devices<br/>ESP32 + Sensors]
        APIs[External APIs<br/>Google OAuth, Payment, Firebase]
    end
    
    Client -->|HTTP/HTTPS| WebServer
    Client <-->|Socket.IO| SocketIO
    
    WebServer --> Services
    SocketIO -.->|Broadcast Events| Client
    
    IoT -->|MQTT Publish| MQTTBroker
    MQTTBroker -->|MQTT Subscribe| MQTTClient
    MQTTClient -->|Process Data| Services
    Services -->|Broadcast via Socket.IO| SocketIO
    
    Services --> ORM
    ORM --> DB
    
    Services -.->|API Calls| APIs
    
    style Client fill:#3b82f6,color:#fff
    style WebServer fill:#10b981,color:#fff
    style SocketIO fill:#06b6d4,color:#fff
    style MQTTClient fill:#8b5cf6,color:#fff
    style MQTTBroker fill:#ff6b6b,color:#fff
    style Services fill:#8b5cf6,color:#fff
    style DB fill:#336791,color:#fff
    style ORM fill:#6366f1,color:#fff
    style IoT fill:#00979d,color:#fff
    style APIs fill:#f59e0b,color:#fff
```

**Penjelasan Singkat:**

- **Layer 1 (Client)**: Aplikasi web yang diakses user melalui browser atau diinstall sebagai PWA
- **Layer 2 (Application Server)**: 
  - Next.js menangani web pages dan API
  - Socket.IO untuk real-time updates ke web clients
  - MQTT Client untuk menerima data dari Arduino via cloud broker
- **Layer 3 (Business Logic)**: Services yang menangani logika bisnis (autentikasi, bottle management, MQTT processing)
- **Layer 4 (Database)**: PostgreSQL untuk data storage, diakses melalui Prisma ORM
- **Layer 5 (External Systems)**: 
  - HiveMQ Cloud sebagai MQTT Broker (cloud-based)
  - Arduino ESP32 devices untuk deteksi botol
  - External APIs untuk OAuth/Payment

**Alur Data Utama:**
1. User ↔ Web Server (request/response HTTP)
2. Arduino → MQTT Broker (HiveMQ) → Server MQTT Client → Services → Database
3. Services → Socket.IO → Web Clients (real-time bottle detection updates)
4. Services → External APIs (authentication, payment processing)

**Arsitektur Hybrid:**
- **MQTT Protocol**: Untuk komunikasi Arduino → Server (reliable, lightweight untuk IoT)
- **Socket.IO/WebSocket**: Untuk komunikasi Server → Web Clients (real-time browser updates)
- **Server sebagai Bridge**: Menerima MQTT messages, memproses, lalu broadcast via Socket.IO

---

## 3. Technology Stack

```mermaid
graph LR
    subgraph "Frontend Stack"
        FE1[Next.js 15.3.0<br/>React 19.0.0]
        FE2[Tailwind CSS 3.4.1<br/>PostCSS 8]
        FE3[TypeScript 5.7.2]
        FE4[Leaflet 1.9.4<br/>react-leaflet 5.0.0]
        FE5[html5-qrcode 2.3.8<br/>qrcode.react 4.2.0]
        FE6[next-pwa 5.6.0<br/>PWA Support]
    end
    
    subgraph "Backend Stack"
        BE1[Node.js<br/>Express 5.1.0]
        BE2[Socket.IO 4.8.1<br/>Web Client Real-time]
        BE3[MQTT 5.15.1<br/>IoT Communication]
        BE4[Prisma 6.12.0<br/>ORM]
        BE5[jsonwebtoken 9.0.2<br/>JWT Auth]
        BE6[bcryptjs 3.0.2<br/>Password Hash]
        BE7[@react-oauth/google<br/>OAuth 0.13.5]
    end
    
    subgraph "Database"
        DB1[(PostgreSQL<br/>Relational DB)]
    end
    
    subgraph "External APIs"
        EXT1[Google OAuth 2.0]
        EXT2[Firebase Admin 13.7.0<br/>FCM]
        EXT3[Nodemailer 8.0.4<br/>Email]
        EXT4[Payment APIs<br/>BCA/GoPay/etc]
    end
    
    subgraph "IoT"
        IOT1[Arduino Devices<br/>HTTP/WebSocket]
        IOT2[Ultrasonic Sensors<br/>HC-SR04]
    end
    
    FE1 --> BE1
    FE1 --> BE2
    BE1 --> BE4
    BE4 --> DB1
    BE1 --> BE5
    BE1 --> BE6
    FE1 --> BE7
    BE7 -.-> EXT1
    BE1 -.-> EXT2
    BE1 -.-> EXT3
    BE1 -.-> EXT4
    IOT1 --> BE3
    BE3 --> BE1
    IOT2 --> IOT1
    
    style BE2 fill:#06b6d4,color:#fff
    style BE3 fill:#8b5cf6,color:#fff
```

---

## 4. API Routes Structure

```mermaid
graph TB
    subgraph "Authentication APIs"
        AUTH1[POST /api/auth/register]
        AUTH2[POST /api/auth/login]
        AUTH3[POST /api/auth/logout]
        AUTH4[POST /api/auth/google]
        AUTH5[POST /api/auth/forgot-password]
        AUTH6[POST /api/auth/reset-password]
        AUTH7[GET /api/auth/token]
    end
    
    subgraph "User Management APIs"
        USER1[GET /api/profile]
        USER2[GET /api/profile-simple]
        USER3[PUT /api/user/profile]
        USER4[GET /api/user-stats]
        USER5[GET /api/users]
    end
    
    subgraph "Bottle Management APIs"
        BOTTLE1[GET /api/bottles]
        BOTTLE2[POST /api/bottle-count]
        BOTTLE3[GET /api/bottle-count/arduino]
        BOTTLE4[POST /api/bottle-count/claim]
        BOTTLE5[POST /api/bottle-count/user-mapping]
        BOTTLE6[GET /api/bottles/history]
        BOTTLE7[GET /api/bottles/statistics]
    end
    
    subgraph "Location APIs"
        LOC1[GET /api/rvm-locations]
        LOC2[GET /api/detail-locations]
        LOC3[DELETE /api/rvm-locations/[id]/delete]
        LOC4[PUT /api/rvm-locations/[id]/edit]
    end
    
    subgraph "Transaction APIs"
        TRANS1[GET /api/transactions/history]
    end
    
    subgraph "News APIs"
        NEWS1[GET /api/news]
        NEWS2[GET /api/news/latest]
        NEWS3[POST /api/news-publish]
        NEWS4[GET /api/news-debug]
    end
    
    subgraph "Diagnostic & Health APIs"
        DIAG1[GET /api/health]
        DIAG2[GET /api/diagnostic]
        DIAG3[GET /api/db-test]
        DIAG4[GET /api/test-prisma]
        DIAG5[GET /api/setup-check]
        DIAG6[GET /api/schema-check]
        DIAG7[GET /api/debug-rvm]
        DIAG8[GET /api/test]
    end
    
    subgraph "Socket.IO"
        SOCKET1[WS /api/socket]
    end
    
    AUTH1 --> AuthService
    AUTH2 --> AuthService
    AUTH3 --> AuthService
    AUTH4 --> AuthService
    AUTH5 --> AuthService
    AUTH6 --> AuthService
    AUTH7 --> AuthService
    
    USER1 --> UserService
    USER2 --> UserService
    USER3 --> UserService
    USER4 --> UserService
    USER5 --> UserService
    
    BOTTLE1 --> BottleService
    BOTTLE2 --> BottleService
    BOTTLE3 --> BottleService
    BOTTLE4 --> BottleService
    BOTTLE5 --> BottleService
    BOTTLE6 --> BottleService
    BOTTLE7 --> BottleService
    
    LOC1 --> LocationService
    LOC2 --> LocationService
    LOC3 --> LocationService
    LOC4 --> LocationService
    
    TRANS1 --> BottleService
    
    NEWS1 --> NewsService
    NEWS2 --> NewsService
    NEWS3 --> NewsService
    NEWS4 --> NewsService
    
    SOCKET1 --> SocketServer
    
    style AuthService fill:#3b82f6,color:#fff
    style BottleService fill:#10b981,color:#fff
    style UserService fill:#8b5cf6,color:#fff
    style LocationService fill:#f59e0b,color:#fff
    style NewsService fill:#ef4444,color:#fff
    style SocketServer fill:#06b6d4,color:#fff
```

---

## 5. Real-time Communication Flow (Hybrid MQTT + Socket.IO)

```mermaid
sequenceDiagram
    participant Arduino as Arduino Device<br/>(ESP32)
    participant HiveMQ as HiveMQ Cloud<br/>(MQTT Broker)
    participant MQTTService as MQTT Service<br/>(Server)
    participant BottleService as Bottle Service
    participant Database as PostgreSQL
    participant SocketIO as Socket.IO Server
    participant WebClient as Web Client
    
    Note over Arduino,WebClient: System Initialization
    
    MQTTService->>HiveMQ: Connect as MQTT Client
    HiveMQ-->>MQTTService: Connected
    MQTTService->>HiveMQ: Subscribe to rvm/device/+/bottles
    MQTTService->>HiveMQ: Subscribe to rvm/device/+/status
    MQTTService->>HiveMQ: Subscribe to rvm/device/+/session/request
    
    WebClient->>SocketIO: Connect via WebSocket
    SocketIO-->>WebClient: Connected Event
    WebClient->>SocketIO: Join Room "bottle-detection"
    
    Note over Arduino,WebClient: Arduino Bottle Detection Flow
    
    Arduino->>Arduino: Ultrasonic Sensor<br/>Detects Bottle
    Arduino->>HiveMQ: MQTT Publish<br/>Topic: rvm/device/RVM-001/bottles<br/>{deviceId, bottleCount, rvmLocationId, distance}
    HiveMQ->>MQTTService: Forward MQTT Message
    
    MQTTService->>MQTTService: Parse JSON Payload<br/>handleBottleDetection()
    MQTTService->>Database: Validate Device<br/>SELECT FROM arduino_connections
    Database-->>MQTTService: Device Valid
    MQTTService->>Database: Validate Location<br/>SELECT FROM rvm_locations
    Database-->>MQTTService: Location Valid
    
    MQTTService->>Database: INSERT INTO bottle_counts<br/>(deviceId, count, distance, source: 'arduino_mqtt')
    Database-->>MQTTService: Record Created (ID)
    
    MQTTService->>SocketIO: broadcastBottleDetection()<br/>{deviceId, bottleCount, totalUnclaimed, locationName}
    SocketIO->>WebClient: Emit "bottle_detected"<br/>to "bottle-detection" room
    
    MQTTService->>HiveMQ: MQTT Publish<br/>Topic: rvm/server/RVM-001/confirmation<br/>{success, recordId, timestamp}
    HiveMQ->>Arduino: Forward Confirmation
    
    WebClient->>WebClient: Update UI<br/>Show Bottle Count
    Arduino->>Arduino: LED Blinks<br/>Confirmation Received
    
    Note over Arduino,WebClient: User Claims Bottles (via Web App)
    
    WebClient->>BottleService: HTTP POST /api/bottle-count/claim<br/>{userId, deviceId}
    BottleService->>Database: BEGIN TRANSACTION
    BottleService->>Database: SELECT unclaimed bottles WHERE deviceId
    BottleService->>Database: UPDATE user_bottle_counts<br/>(increment bottles & points)
    BottleService->>Database: UPDATE bottle_counts SET userBottleCountId
    BottleService->>Database: INSERT INTO bottle_transactions
    BottleService->>Database: COMMIT TRANSACTION
    Database-->>BottleService: Transaction Success
    
    BottleService->>SocketIO: Emit "bottles_claimed"
    SocketIO->>WebClient: Event {userId, totalBottles, points}
    
    WebClient->>WebClient: Update Balance<br/>Show Receipt
```

---

## 6. Authentication Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant NextJS as Next.js App
    participant AuthAPI as Auth API
    participant AuthService as Auth Service
    participant Google as Google OAuth
    participant Database as PostgreSQL
    participant Email as Email Service
    
    Note over User,Email: Email/Password Registration
    
    User->>NextJS: Fill Registration Form
    NextJS->>AuthAPI: POST /api/auth/register<br/>{email, password, nama, phoneNumber}
    AuthAPI->>AuthService: Register User
    AuthService->>AuthService: Hash Password (bcrypt)
    AuthService->>Database: INSERT INTO users
    Database-->>AuthService: User Created
    AuthService->>AuthService: Generate JWT Token
    AuthService-->>AuthAPI: {token, user}
    AuthAPI-->>NextJS: Set Cookie (token)
    NextJS-->>User: Redirect to /home
    
    Note over User,Email: Email/Password Login
    
    User->>NextJS: Fill Login Form
    NextJS->>AuthAPI: POST /api/auth/login<br/>{email, password}
    AuthAPI->>AuthService: Authenticate
    AuthService->>Database: SELECT FROM users WHERE email
    Database-->>AuthService: User Data
    AuthService->>AuthService: Compare Password (bcrypt)
    AuthService->>AuthService: Generate JWT Token
    AuthService-->>AuthAPI: {token, user}
    AuthAPI-->>NextJS: Set Cookie (token)
    NextJS-->>User: Redirect to /home
    
    Note over User,Email: Google OAuth Login
    
    User->>NextJS: Click "Login with Google"
    NextJS->>Google: Redirect to Google OAuth
    Google->>User: Show Google Login
    User->>Google: Authenticate
    Google-->>NextJS: OAuth Callback + Code
    NextJS->>AuthAPI: POST /api/auth/google<br/>{code, credential}
    AuthAPI->>AuthService: Verify Google Token
    AuthService->>Google: Verify Token
    Google-->>AuthService: User Info
    AuthService->>Database: SELECT or INSERT user
    Database-->>AuthService: User Data
    AuthService->>AuthService: Generate JWT Token
    AuthService-->>AuthAPI: {token, user}
    AuthAPI-->>NextJS: Set Cookie (token)
    NextJS-->>User: Redirect to /home
    
    Note over User,Email: Password Reset Flow
    
    User->>NextJS: Click "Forgot Password"
    NextJS->>AuthAPI: POST /api/auth/forgot-password<br/>{email}
    AuthAPI->>AuthService: Generate Reset Token
    AuthService->>Database: Store Reset Token
    AuthService->>Email: Send Reset Email
    Email-->>User: Email with Reset Link
    User->>NextJS: Click Reset Link
    NextJS->>AuthAPI: POST /api/auth/reset-password<br/>{token, newPassword}
    AuthAPI->>AuthService: Validate Token
    AuthService->>Database: Check Token Expiry
    Database-->>AuthService: Token Valid
    AuthService->>AuthService: Hash New Password
    AuthService->>Database: UPDATE password
    AuthService-->>AuthAPI: Success
    AuthAPI-->>NextJS: Password Updated
    NextJS-->>User: Redirect to /login
```

---

## 7. Bottle Deposit Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant WebApp as Web App
    participant QRScanner as QR Scanner
    participant LocationAPI as Location API
    participant BottleAPI as Bottle API
    participant Arduino as Arduino Device<br/>(ESP32)
    participant HiveMQ as HiveMQ Cloud<br/>(MQTT Broker)
    participant MQTTService as MQTT Service
    participant SocketIO as Socket.IO
    participant Database as PostgreSQL
    
    Note over User,Database: User Opens App and Finds RVM
    
    User->>WebApp: Open App
    WebApp->>LocationAPI: GET /api/rvm-locations
    LocationAPI->>Database: SELECT FROM rvm_locations
    Database-->>LocationAPI: Location Data
    LocationAPI-->>WebApp: RVM Locations
    WebApp->>WebApp: Display Map with Markers
    User->>WebApp: Select RVM Location
    WebApp->>WebApp: Show Navigation
    
    Note over User,Database: User Arrives at RVM
    
    User->>WebApp: Click "Scan QR Code"
    WebApp->>QRScanner: Activate Camera
    QRScanner->>QRScanner: Scan QR Code
    QRScanner-->>WebApp: QR Data {deviceId: "RVM-001"}
    WebApp->>LocationAPI: Validate Device
    LocationAPI->>Database: SELECT FROM arduino_connections
    Database-->>LocationAPI: Device Valid
    LocationAPI-->>WebApp: Device Info + Location
    
    Note over User,Database: Start Deposit Session
    
    WebApp->>SocketIO: Connect to Socket.IO
    SocketIO-->>WebApp: Connected
    WebApp->>SocketIO: Join room "bottle-detection"
    WebApp->>WebApp: Show "Ready to Accept Bottles"
    
    Note over User,Database: User Inserts Bottles
    
    User->>Arduino: Insert Bottle #1
    Arduino->>Arduino: Ultrasonic Sensor Detects<br/>Distance < 10cm
    Arduino->>HiveMQ: MQTT Publish<br/>rvm/device/RVM-001/bottles<br/>{deviceId, bottleCount: 1, rvmLocationId, distance: 5.2}
    HiveMQ->>MQTTService: Forward Message
    MQTTService->>Database: INSERT INTO bottle_counts<br/>(deviceId, count, distance, source: 'arduino_mqtt')
    Database-->>MQTTService: Bottle Count Saved
    MQTTService->>SocketIO: broadcastBottleDetection()
    SocketIO->>WebApp: Event "bottle_detected" {deviceId, count: 1, total: 1}
    WebApp->>WebApp: Update UI: "1 Bottle Detected"
    MQTTService->>HiveMQ: Publish Confirmation<br/>rvm/server/RVM-001/confirmation
    HiveMQ->>Arduino: Confirmation Received
    
    User->>Arduino: Insert Bottle #2
    Arduino->>Arduino: Sensor Detects
    Arduino->>HiveMQ: MQTT Publish<br/>rvm/device/RVM-001/bottles<br/>{deviceId, bottleCount: 1, distance: 6.1}
    HiveMQ->>MQTTService: Forward Message
    MQTTService->>Database: INSERT INTO bottle_counts
    Database-->>MQTTService: Saved
    MQTTService->>SocketIO: broadcastBottleDetection()
    SocketIO->>WebApp: Event {deviceId, count: 1, total: 2}
    WebApp->>WebApp: Update UI: "2 Bottles Detected"
    
    User->>Arduino: Insert Bottle #N
    Arduino->>HiveMQ: MQTT Publish
    HiveMQ->>MQTTService: Forward Message
    MQTTService->>Database: INSERT INTO bottle_counts
    MQTTService->>SocketIO: broadcastBottleDetection()
    SocketIO->>WebApp: Event {total: N}
    WebApp->>WebApp: Update UI: "N Bottles Detected"
    
    Note over User,Database: User Claims Bottles
    
    User->>WebApp: Click "Claim Bottles"
    WebApp->>BottleAPI: POST /api/bottle-count/claim<br/>{userId, deviceId}
    BottleAPI->>Database: BEGIN TRANSACTION
    BottleAPI->>Database: SELECT unclaimed bottles WHERE deviceId
    Database-->>BottleAPI: Bottle Count Records (N bottles)
    BottleAPI->>Database: UPDATE bottle_counts SET userBottleCountId
    BottleAPI->>Database: SELECT or INSERT user_bottle_counts
    BottleAPI->>BottleAPI: Calculate Points (N � 50)
    BottleAPI->>Database: UPDATE user_bottle_counts<br/>SET totalBottles += N<br/>SET points += (N � 50)
    BottleAPI->>Database: INSERT INTO bottle_transactions<br/>(type: DEPOSIT, bottleCount: N, pointsEarned: N�50)
    BottleAPI->>Database: COMMIT TRANSACTION
    Database-->>BottleAPI: Transaction Complete
    
    BottleAPI->>SocketIO: Emit "bottles_claimed"
    SocketIO->>WebApp: Event {totalBottles, points, transaction}
    
    BottleAPI-->>WebApp: Success Response<br/>{totalBottles, points, pointsEarned}
    WebApp->>WebApp: Show Receipt<br/>"N bottles deposited<br/>(N�50) points earned"
    
    Note over User,Database: User Views Balance
    
    User->>WebApp: View Balance
    WebApp->>BottleAPI: GET /api/bottles
    BottleAPI->>Database: SELECT FROM user_bottle_counts
    Database-->>BottleAPI: User Balance Data
    BottleAPI-->>WebApp: {totalBottles, points, redeemableCount}
    WebApp->>WebApp: Display Balance and History
```

---

## 8. Redemption Flow Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant WebApp as Web App
    participant BottleAPI as Bottle API
    participant PaymentGW as Payment Gateway
    participant Database as PostgreSQL
    participant Email as Email Service
    
    Note over User,Email: User Decides to Redeem Points
    
    User->>WebApp: Navigate to Redeem Page
    WebApp->>BottleAPI: GET /api/user-stats
    BottleAPI->>Database: SELECT FROM user_bottle_counts
    Database-->>BottleAPI: {points: 5000, redeemableCount: 100}
    BottleAPI-->>WebApp: User Stats
    WebApp->>WebApp: Show Available Points<br/>"5000 points available"
    
    Note over User,Email: Redeem to E-Wallet (GoPay/OVO/Dana)
    
    User->>WebApp: Select "Redeem to E-Wallet"
    WebApp->>WebApp: Show Options<br/>GoPay/OVO/Dana/BCA
    User->>WebApp: Select GoPay<br/>Enter Phone: 08123456789<br/>Amount: 2000 points (Rp 20,000)
    WebApp->>BottleAPI: POST /api/transactions/redeem<br/>{type: "gopay", phone: "08123456789", points: 2000}
    BottleAPI->>Database: BEGIN TRANSACTION
    BottleAPI->>Database: SELECT user_bottle_counts WHERE userId
    Database-->>BottleAPI: Current Balance {points: 5000}
    BottleAPI->>BottleAPI: Validate Sufficient Points
    BottleAPI->>PaymentGW: Transfer Request<br/>{provider: "gopay", phone: "08123456789", amount: 20000}
    PaymentGW->>PaymentGW: Process Transfer
    PaymentGW-->>BottleAPI: Transfer Success<br/>{transactionId: "TRX-12345"}
    BottleAPI->>Database: UPDATE user_bottle_counts<br/>SET points -= 2000<br/>SET redeemableCount -= 40
    BottleAPI->>Database: INSERT INTO bottle_transactions<br/>(type: REDEEM, pointsUsed: 2000)
    BottleAPI->>Database: COMMIT TRANSACTION
    Database-->>BottleAPI: Success
    BottleAPI->>Email: Send Receipt Email
    BottleAPI-->>WebApp: Redemption Success
    WebApp->>WebApp: Generate QR Receipt
    WebApp->>WebApp: Show Success Message<br/>"Rp 20,000 sent to GoPay"
    User->>WebApp: View Receipt/QR Code
    
    Note over User,Email: Redeem to Voucher
    
    User->>WebApp: Select "Redeem Voucher"
    WebApp->>BottleAPI: GET /api/vouchers
    BottleAPI->>Database: SELECT FROM vouchers WHERE isActive
    Database-->>BottleAPI: Available Vouchers
    BottleAPI-->>WebApp: Voucher List
    WebApp->>WebApp: Show Vouchers<br/>Alfamart (1000pts)<br/>Indomaret (1000pts)
    User->>WebApp: Select Alfamart Voucher
    WebApp->>BottleAPI: POST /api/vouchers/redeem<br/>{voucherId, userId}
    BottleAPI->>Database: BEGIN TRANSACTION
    BottleAPI->>Database: Check voucher stock
    BottleAPI->>Database: Check user points
    BottleAPI->>Database: UPDATE user_bottle_counts SET points -= 1000
    BottleAPI->>Database: UPDATE vouchers SET stock -= 1
    BottleAPI->>Database: INSERT INTO voucher_redemptions
    BottleAPI->>Database: COMMIT TRANSACTION
    BottleAPI-->>WebApp: Voucher Code Generated
    WebApp->>WebApp: Show Voucher QR Code
```

---

## 9. Component Architecture

```mermaid
graph TB
    subgraph "Pages - Next.js App Router"
        P1[/splash]
        P2[/onboarding]
        P3[/login]
        P4[/registration]
        P5[/home]
        P6[/lokasi - RVM Locations]
        P7[/qr - QR Scanner]
        P8[/bottlein - Bottle Deposit]
        P9[/profil - User Profile]
        P10[/aktifitas - Activity History]
        P11[/reedem-decision - Redeem Choice]
        P12[/reedem-gopay, /reedem-bca, /reedem-voucher]
        P13[/receipt-qr - Receipt Display]
        P14[/news - News Articles]
    end
    
    subgraph "Components"
        subgraph "UI Components"
            C1[Navbar]
            C2[Modal]
            C3[AuthDialog]
            C4[Carousel]
            C5[BottleCountDisplay]
            C6[InstallButton]
            C7[GoogleLoginButton]
        end
        
        subgraph "Feature Components"
            C8[LeafletMap]
            C9[OnboardingTour]
            C10[DeviceGuard]
        end
        
        subgraph "Container Components"
            C11[ForgotPassword Container]
            C12[NewPassword Container]
            C13[OptionItems Container]
            C14[ReceiptRedeemQR Container]
            C15[Maps Container]
            C16[Terms Container]
        end
    end
    
    subgraph "Contexts - State Management"
        CTX1[UserContextNew]
        CTX2[LocationContext]
        CTX3[InstallContext]
    end
    
    subgraph "Services"
        S1[auth-service.js]
        S2[bottle-service.js]
        S3[user-service.js]
        S4[location-service.js]
        S5[news-service.js]
    end
    
    subgraph "Hooks"
        H1[use-fetch.js]
        H2[use-socket-clients.js]
    end
    
    P5 --> C1
    P5 --> C8
    P6 --> C8
    P7 --> C1
    P8 --> C5
    P9 --> C1
    
    P3 --> C7
    P3 --> C3
    
    P5 --> CTX1
    P6 --> CTX2
    All --> CTX3
    
    CTX1 --> S1
    CTX1 --> S3
    CTX2 --> S4
    
    S1 --> H1
    S2 --> H1
    S2 --> H2
    S3 --> H1
    S4 --> H1
    S5 --> H1
```

---

## 10. Deployment Architecture (Hybrid MQTT + Socket.IO)

```mermaid
graph TB
    subgraph "Client Devices"
        Mobile[Mobile Browsers<br/>Android/iOS]
        Desktop[Desktop Browsers<br/>Chrome/Firefox/Safari]
        PWA[Installed PWA]
    end
    
    subgraph "Production Server"
        NodeServer[Node.js Server<br/>Port 3000]
        NextApp[Next.js 15 App]
        SocketIOSrv[Socket.IO Server<br/>Port 3000]
        MQTTClient[MQTT Client<br/>mqtt.js]
        PrismaORM[Prisma Client]
    end
    
    subgraph "Database Server"
        PG[(PostgreSQL<br/>Database)]
    end
    
    subgraph "Cloud Services"
        HiveMQCloud[HiveMQ Cloud<br/>MQTT Broker<br/>Port 8883 TLS]
        GoogleAPI[Google OAuth API]
        FirebaseAPI[Firebase Admin API]
        PaymentAPI[Payment Gateway APIs]
        EmailSMTP[Email SMTP Server]
    end
    
    subgraph "IoT Devices Network"
        RVM1[RVM Device #1<br/>Arduino ESP32]
        RVM2[RVM Device #2<br/>Arduino ESP32]
        RVMN[RVM Device #N<br/>Arduino ESP32]
    end
    
    Mobile -->|HTTPS/WSS| NodeServer
    Desktop -->|HTTPS/WSS| NodeServer
    PWA -->|HTTPS/WSS| NodeServer
    
    NodeServer --> NextApp
    NodeServer --> SocketIOSrv
    NodeServer --> MQTTClient
    NextApp --> PrismaORM
    PrismaORM --> PG
    
    SocketIOSrv -.->|WebSocket| Mobile
    SocketIOSrv -.->|WebSocket| Desktop
    SocketIOSrv -.->|WebSocket| PWA
    
    MQTTClient -->|MQTTS<br/>Subscribe| HiveMQCloud
    
    RVM1 -->|MQTTS Publish<br/>Port 8883| HiveMQCloud
    RVM2 -->|MQTTS Publish<br/>Port 8883| HiveMQCloud
    RVMN -->|MQTTS Publish<br/>Port 8883| HiveMQCloud
    
    NextApp -.-> GoogleAPI
    NextApp -.-> FirebaseAPI
    NextApp -.-> PaymentAPI
    NextApp -.-> EmailSMTP
    
    style NodeServer fill:#10b981,color:#fff
    style SocketIOSrv fill:#06b6d4,color:#fff
    style MQTTClient fill:#8b5cf6,color:#fff
    style HiveMQCloud fill:#ff6b6b,color:#fff
    style PG fill:#336791,color:#fff
    style RVM1 fill:#00979d,color:#fff
    style RVM2 fill:#00979d,color:#fff
    style RVMN fill:#00979d,color:#fff
```

**Penjelasan Deployment:**

- **Client Layer**: Browser dan PWA connect via HTTPS/WebSocket Secure (WSS)
- **Application Server**: 
  - Next.js untuk HTTP/API requests
  - Socket.IO Server untuk real-time updates ke clients
  - MQTT Client (mqtt.js) untuk subscribe dari HiveMQ Cloud
  - Prisma ORM untuk database access
- **Cloud MQTT Broker**: HiveMQ Cloud (external managed service)
  - Port 8883 dengan TLS encryption
  - Handles MQTT pub/sub untuk semua Arduino devices
  - Reliable message delivery dengan QoS 1
- **IoT Network**: Arduino ESP32 devices publish sensor data via MQTTS
- **Security**: 
  - MQTTS (MQTT over TLS) untuk Arduino → HiveMQ
  - WSS (WebSocket Secure) untuk Browser ↔ Server
  - HTTPS untuk API calls

---

## 11. Database Schema Reference

Untuk detail lengkap Entity Relationship Diagram (ERD), lihat file [ERD.md](./ERD.md).

**Entitas Utama:**
- User - Data pengguna aplikasi
- UserBottleCount - Saldo botol dan poin user
- BottleTransaction - Riwayat transaksi deposit/redeem
- BottleCount - Raw data deteksi dari Arduino
- ArduinoConnection - Status koneksi perangkat Arduino
- RvmLocation - Lokasi mesin RVM
- Voucher & VoucherRedemption - Sistem voucher reward
- News - Konten berita dan artikel
- Admin & AuditLog - Manajemen admin dan audit trail
- SystemConfig - Konfigurasi sistem

**Business Rules:**
- 1 botol = 50 poin
- Points dapat ditukar ke e-wallet, voucher, atau pulsa
- Setiap transaksi tercatat di audit log
- Arduino devices dapat beroperasi dengan atau tanpa user login (anonymous detection)

---

## Rangkuman Arsitektur

### Arsitektur Berlapis (Layered Architecture)

Sistem RVM menggunakan arsitektur berlapis dengan pemisahan yang jelas:

1. **Client Layer (PWA)**: Next.js 15 + React 19 dengan PWA support untuk offline capability
2. **API Layer**: Next.js API Routes + Custom Express Server + Socket.IO untuk real-time
3. **Business Logic Layer**: Services (Auth, Bottle, User, Location, News)
4. **Data Access Layer**: Prisma ORM dengan type-safe queries
5. **Database Layer**: PostgreSQL untuk data persistence
6. **IoT Layer**: Arduino devices dengan ultrasonic sensors

### Pola Komunikasi

**Synchronous (HTTP/REST):**
- Client → API Routes untuk operasi CRUD standar
- Autentikasi menggunakan JWT tokens di cookies
- RESTful endpoints dengan standard HTTP methods

**Asynchronous - Hybrid Protocol:**
- **Arduino → Server**: MQTT Protocol via HiveMQ Cloud
  - Arduino publishes to topics: `rvm/device/{deviceId}/bottles`, `/status`, `/session/request`
  - Lightweight, reliable, built for IoT devices
  - QoS 1 untuk guaranteed delivery
  - MQTTS (MQTT over TLS) untuk security
- **Server → Web Clients**: Socket.IO (WebSocket)
  - Real-time updates untuk bottle detection
  - Room-based broadcasting (`bottle-detection` room)
  - Automatic reconnection handling
- **Server sebagai Bridge**: 
  - MQTT Service subscribes dari HiveMQ Cloud
  - Processes dan saves data ke database
  - Broadcasts events ke web clients via Socket.IO
- Event-driven architecture untuk responsiveness

### Keputusan Teknis Utama

**1. Next.js 15 dengan App Router**
- SSR dan SSG untuk performa optimal
- API Routes terintegrasi untuk backend
- File-based routing untuk developer experience

**2. Prisma ORM**
- Type-safe database queries
- Migration management yang robust
- Auto-generated client untuk TypeScript

**3. Hybrid MQTT + Socket.IO untuk Real-time**
- **MQTT Protocol** untuk Arduino → Server communication
  - External HiveMQ Cloud broker (managed, scalable)
  - MQTTS (TLS encryption) untuk security
  - QoS 1 untuk guaranteed message delivery
  - Topic-based pub/sub pattern: `rvm/device/+/bottles`
  - Lightweight protocol ideal untuk IoT devices dengan bandwidth terbatas
- **Socket.IO** untuk Server → Web Clients communication
  - Bi-directional communication dengan web browsers
  - Room-based broadcasting untuk efficiency
  - Automatic reconnection handling
  - Browser-compatible (no MQTT support in browsers)
- **Server sebagai Bridge** antara MQTT dan Socket.IO
  - MQTT Service subscribes dari cloud broker
  - Processes data dan saves ke database via Prisma
  - Broadcasts ke web clients via Socket.IO
  - Decouples IoT layer dari client layer

**4. PostgreSQL Database**
- ACID compliance untuk transaction integrity
- JSON support untuk flexible schema (position, images)
- Robust indexing untuk query performance

**5. PWA Implementation**
- Offline-first strategy dengan service workers
- App-like experience di mobile devices
- Push notifications via Firebase

### Alur Data Utama

```
User deposits bottle ? Arduino detects ? Socket.IO broadcasts ? 
API processes ? Database updates ? Client UI updates ? Receipt generated
```

**Karakteristik:**
- Real-time updates (< 1 second latency)
- Transaction atomicity (all-or-nothing)
- Audit trail lengkap
- Scalable untuk multiple RVM locations

### Skalabilitas & Performa

**Current Capacity:**
- Multiple concurrent users per RVM device
- Real-time broadcasting ke semua connected clients
- Database optimized dengan indexes dan transactions

**Scaling Strategy:**
- Horizontal: Tambah Arduino devices per location
- Vertical: Database connection pooling via Prisma
- Caching: Client-side state management dengan React Context

---

## Teknologi Stack Detail

| Kategori | Teknologi | Versi | Fungsi |
|----------|-----------|-------|--------|
| **Frontend** | Next.js | 15.3.0 | React framework dengan SSR |
| | React | 19.0.0 | UI library |
| | Tailwind CSS | 3.4.1 | Styling framework |
| | TypeScript | 5.7.2 | Type safety |
| | Leaflet | 1.9.4 | Maps & geolocation |
| **Backend** | Node.js | Latest | Runtime environment |
| | Express | 5.1.0 | HTTP server |
| | Socket.IO | 4.8.1 | WebSocket server (web clients) |
| | MQTT.js | 5.15.1 | MQTT client (Arduino comm) |
| | Prisma | 6.12.0 | Database ORM |
| **Auth** | jsonwebtoken | 9.0.2 | JWT authentication |
| | bcryptjs | 3.0.2 | Password hashing |
| | @react-oauth/google | 0.13.5 | Google OAuth |
| **Database** | PostgreSQL | Latest | Relational database |
| **External** | Firebase Admin | 13.7.0 | Push notifications |
| | Nodemailer | 8.0.4 | Email service |
| **IoT** | Arduino ESP32 | - | Microcontroller |
| | HC-SR04 | - | Ultrasonic sensor |

---

*Dokumentasi terakhir diperbarui: Juni 2026*
*Untuk detail database schema, lihat [ERD.md](./ERD.md)*
*Untuk deployment dan setup, lihat [README.md](./README.md)*
