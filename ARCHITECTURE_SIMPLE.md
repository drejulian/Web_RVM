# Arsitektur Sistem RVM - Versi Sederhana

Dokumentasi arsitektur sistem RVM yang mudah dipahami dan dijelaskan.

---

## 1. Gambaran Umum Sistem

```mermaid
graph TB
    subgraph "User Interface"
        Mobile[Mobile/Desktop Browser<br/>PWA Application]
    end
    
    subgraph "Application Server"
        Next[Next.js Application<br/>Frontend + Backend]
        Socket[Socket.IO<br/>Real-time Communication]
    end
    
    subgraph "Database"
        DB[(PostgreSQL<br/>Data Storage)]
    end
    
    subgraph "RVM Hardware"
        Arduino[Arduino Devices<br/>Bottle Detection]
        Sensor[Ultrasonic Sensors]
    end
    
    subgraph "External Services"
        Auth[Google OAuth<br/>Authentication]
        Payment[Payment Gateways<br/>Redemption]
    end
    
    Mobile --> Next
    Mobile --> Socket
    Next --> DB
    Socket --> DB
    Arduino --> Socket
    Sensor --> Arduino
    Next -.-> Auth
    Next -.-> Payment
    
    style Mobile fill:#3b82f6,color:#fff
    style Next fill:#10b981,color:#fff
    style DB fill:#336791,color:#fff
    style Arduino fill:#00979d,color:#fff
```

**Penjelasan Komponen:**

1. **User Interface**: Aplikasi web PWA yang bisa diakses dari browser atau diinstall
2. **Application Server**: Next.js menangani frontend dan backend API
3. **Socket.IO**: Real-time communication untuk deteksi botol langsung
4. **PostgreSQL**: Database untuk menyimpan semua data
5. **Arduino Devices**: Perangkat IoT di setiap mesin RVM untuk deteksi botol
6. **External Services**: Google OAuth untuk login, Payment Gateway untuk redeem

---

## 2. Alur Kerja Utama

```mermaid
flowchart TD
    Start([User Buka Aplikasi]) --> Login{Sudah Login?}
    Login -->|Belum| DoLogin[Login/Register]
    Login -->|Sudah| Map[Lihat Peta RVM]
    DoLogin --> Map
    
    Map --> Pilih[Pilih Lokasi RVM]
    Pilih --> Scan[Scan QR Code RVM]
    Scan --> Insert[Masukkan Botol]
    
    Insert --> Detect[Arduino Deteksi Botol]
    Detect --> Count[Hitung & Tampilkan<br/>di Layar Real-time]
    Count --> More{Masukkan<br/>Lagi?}
    
    More -->|Ya| Insert
    More -->|Tidak| Claim[Klaim Botol]
    
    Claim --> Update[Update Saldo<br/>1 botol = 50 poin]
    Update --> Receipt[Tampilkan Receipt]
    
    Receipt --> Redeem{Mau Redeem?}
    Redeem -->|Ya| Choose[Pilih E-wallet/<br/>Voucher/Pulsa]
    Redeem -->|Tidak| End([Selesai])
    Choose --> Process[Proses Redeem]
    Process --> End
    
    style Start fill:#3b82f6,color:#fff
    style End fill:#10b981,color:#fff
    style Detect fill:#00979d,color:#fff
```

---

## 3. Technology Stack

**Frontend:**
- Next.js 15 + React 19 (Web Application)
- Tailwind CSS (Styling)
- Leaflet (Maps untuk lokasi RVM)
- PWA (Installable app, offline support)

**Backend:**
- Node.js + Express (Server)
- Socket.IO (Real-time communication)
- Prisma (Database ORM)
- JWT (Authentication)

**Database:**
- PostgreSQL (Relational database)

**IoT:**
- Arduino ESP32 (Microcontroller)
- Ultrasonic Sensors (Deteksi botol)

**External Services:**
- Google OAuth (Login)
- Firebase (Notifications)
- Payment Gateways (BCA, GoPay, OVO, Dana)

---

## 4. Fitur Utama

1. **Autentikasi**: Login dengan email/password atau Google OAuth
2. **Peta Lokasi**: Tampilan peta interaktif untuk mencari RVM terdekat
3. **Scan QR**: Scan QR code di mesin RVM untuk memulai deposit
4. **Deteksi Real-time**: Botol terdeteksi langsung muncul di layar
5. **Sistem Poin**: 1 botol = 50 poin
6. **Redeem Rewards**: Tukar poin ke e-wallet, voucher, atau pulsa
7. **Riwayat Transaksi**: Lihat semua aktivitas deposit dan redeem
8. **Notifikasi**: Push notification untuk update penting

---

## 5. Deployment

```mermaid
graph LR
    User[Users] --> Server[Production Server<br/>Node.js + Next.js]
    Server --> DB[(PostgreSQL<br/>Database)]
    Arduino[Arduino Devices] --> Server
    Server -.-> External[External APIs<br/>Google/Payment/Firebase]
    
    style Server fill:#10b981,color:#fff
    style DB fill:#336791,color:#fff
    style Arduino fill:#00979d,color:#fff
```

**Infrastruktur:**
- Web Server: Node.js (Port 3000)
- Database: PostgreSQL (Cloud/On-premise)
- Arduino Devices: Terhubung via WiFi/Internet ke server
- External APIs: Google OAuth, Payment Gateways, Firebase

---

## 6. Data Flow Sederhana

**Proses Deposit Botol:**
```
User scan QR ? Arduino detect ? Socket.IO broadcast ? 
Database update ? UI update ? Points bertambah
```

**Proses Redeem:**
```
User pilih redeem ? Validasi poin ? Payment Gateway ? 
Database update ? Konfirmasi sukses
```

---

## 7. Use Case Diagram

### 7.1 Main System Use Cases

```mermaid
graph TB
    subgraph "Actors"
        User((User))
        Admin((Admin))
        Arduino[Arduino Device]
        External[External Systems]
    end
    
    subgraph "RVM System"
        subgraph "User Use Cases"
            UC1[Register Account]
            UC2[Login]
            UC3[View RVM Locations]
            UC4[Scan QR Code]
            UC5[Deposit Bottles]
            UC6[Claim Bottles]
            UC7[View Balance]
            UC8[View History]
            UC9[Redeem Points]
            UC10[Update Profile]
            UC11[Read News]
        end
        
        subgraph "Admin Use Cases"
            AC1[Manage RVM Locations]
            AC2[Manage Arduino Devices]
            AC3[Manage Vouchers]
            AC4[Publish News]
            AC5[View Statistics]
            AC6[View Audit Logs]
            AC7[Manage Users]
        end
        
        subgraph "Arduino Use Cases"
            AR1[Detect Bottles]
            AR2[Send Detection via MQTT]
            AR3[Report Device Status]
            AR4[Handle Sessions]
        end
        
        subgraph "System Processing"
            SYS1[Process Detection]
            SYS2[Calculate Points]
            SYS3[Validate Transaction]
            SYS4[Send Notifications]
        end
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    
    Admin --> UC2
    Admin --> AC1
    Admin --> AC2
    Admin --> AC3
    Admin --> AC4
    Admin --> AC5
    Admin --> AC6
    Admin --> AC7
    
    Arduino --> AR1
    Arduino --> AR2
    Arduino --> AR3
    Arduino --> AR4
    
    UC2 -.-> External
    UC9 -.-> External
    AR2 --> SYS1
    SYS1 --> SYS2
    UC6 --> SYS3
    SYS3 --> SYS4
    
    style User fill:#3b82f6,color:#fff
    style Admin fill:#f59e0b,color:#fff
    style Arduino fill:#00979d,color:#fff
    style External fill:#8b5cf6,color:#fff
```

### 7.2 Detailed User Use Cases

```mermaid
flowchart TD
    User((User))
    
    subgraph "Authentication"
        UC1[Register Account]
        UC2[Login with Email]
        UC3[Login with Google OAuth]
        UC4[Reset Password]
        UC5[Logout]
    end
    
    subgraph "Bottle Management"
        UC6[Find RVM Location]
        UC7[Scan QR Code]
        UC8[Deposit Bottles]
        UC9[Claim Bottles]
        UC10[View Balance]
        UC11[View Transaction History]
    end
    
    subgraph "Redemption"
        UC12[Redeem to E-wallet]
        UC13[Redeem to Voucher]
        UC14[Redeem to Pulsa]
        UC15[Generate Receipt QR]
    end
    
    subgraph "Profile Management"
        UC16[View Profile]
        UC17[Update Profile]
        UC18[Change Password]
        UC19[View Statistics]
    end
    
    subgraph "Information"
        UC20[Read News Articles]
        UC21[View RVM Details]
        UC22[Get Notifications]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    User --> UC16
    User --> UC17
    User --> UC18
    User --> UC19
    User --> UC20
    User --> UC21
    User --> UC22
    
    style User fill:#3b82f6,color:#fff
```

### 7.3 Admin Use Cases

```mermaid
flowchart TD
    Admin((Admin))
    
    subgraph "Location Management"
        AC1[Create RVM Location]
        AC2[Update RVM Location]
        AC3[Delete RVM Location]
        AC4[View All Locations]
    end
    
    subgraph "Device Management"
        AC5[Register Arduino Device]
        AC6[Monitor Device Status]
        AC7[View Device Logs]
        AC8[Update Device Config]
    end
    
    subgraph "Voucher Management"
        AC9[Create Voucher]
        AC10[Update Voucher]
        AC11[Set Voucher Stock]
        AC12[Deactivate Voucher]
    end
    
    subgraph "Content Management"
        AC13[Publish News Article]
        AC14[Edit News Article]
        AC15[Delete News Article]
    end
    
    subgraph "Analytics & Monitoring"
        AC16[View System Statistics]
        AC17[View User Statistics]
        AC18[View Bottle Statistics]
        AC19[Export Reports]
        AC20[View Audit Logs]
    end
    
    subgraph "User Management"
        AC21[View All Users]
        AC22[Manage User Roles]
        AC23[Ban/Unban Users]
    end
    
    Admin --> AC1
    Admin --> AC2
    Admin --> AC3
    Admin --> AC4
    Admin --> AC5
    Admin --> AC6
    Admin --> AC7
    Admin --> AC8
    Admin --> AC9
    Admin --> AC10
    Admin --> AC11
    Admin --> AC12
    Admin --> AC13
    Admin --> AC14
    Admin --> AC15
    Admin --> AC16
    Admin --> AC17
    Admin --> AC18
    Admin --> AC19
    Admin --> AC20
    Admin --> AC21
    Admin --> AC22
    Admin --> AC23
    
    style Admin fill:#f59e0b,color:#fff
```

### 7.4 Arduino & System Use Cases

```mermaid
flowchart TD
    Arduino[Arduino Device]
    
    subgraph "Bottle Detection Flow"
        AR1[Initialize Sensors]
        AR2[Monitor Distance]
        AR3[Detect Bottle]
        AR4[Publish to MQTT]
        AR5[Receive Confirmation]
        AR6[Update LED Status]
    end
    
    subgraph "Session Management"
        AR7[Request Active Session]
        AR8[Receive Session Data]
        AR9[Direct User Assignment]
    end
    
    subgraph "Device Health"
        AR10[Report Device Status]
        AR11[Send Heartbeat]
        AR12[Report Errors]
        AR13[Monitor WiFi Connection]
    end
    
    subgraph "System Processing"
        SYS1[Receive MQTT Message]
        SYS2[Validate Device]
        SYS3[Validate Location]
        SYS4[Save to Database]
        SYS5[Calculate Points]
        SYS6[Broadcast via Socket.IO]
        SYS7[Send Confirmation]
    end
    
    Arduino --> AR1
    AR1 --> AR2
    AR2 --> AR3
    AR3 --> AR4
    AR4 --> SYS1
    
    SYS1 --> SYS2
    SYS2 --> SYS3
    SYS3 --> SYS4
    SYS4 --> SYS5
    SYS5 --> SYS6
    SYS6 --> SYS7
    SYS7 --> AR5
    AR5 --> AR6
    
    Arduino --> AR7
    AR7 --> SYS1
    SYS1 --> AR8
    AR8 --> AR9
    
    Arduino --> AR10
    Arduino --> AR11
    Arduino --> AR12
    Arduino --> AR13
    
    style Arduino fill:#00979d,color:#fff
```

**Penjelasan Use Cases:**

**User Use Cases:**
- **Authentication**: Register, login (email/Google), reset password
- **Bottle Management**: Find RVM, scan QR, deposit, claim bottles, view balance
- **Redemption**: Redeem points ke e-wallet, voucher, atau pulsa
- **Profile**: Manage profil, lihat statistik personal
- **Information**: Baca artikel, notifikasi, info RVM

**Admin Use Cases:**
- **Location Management**: CRUD RVM locations di peta
- **Device Management**: Monitor dan manage Arduino devices
- **Voucher Management**: Buat dan kelola voucher rewards
- **Content**: Publish dan manage news articles
- **Analytics**: View statistics, reports, audit logs
- **User Management**: Manage users dan roles

**Arduino Use Cases:**
- **Detection Flow**: Sensor → Detect → Publish MQTT → Confirmation
- **Session Management**: Handle user sessions untuk direct assignment
- **Health Monitoring**: Report status, heartbeat, errors

**System Processing:**
- Receive MQTT dari Arduino
- Validate device dan location
- Save ke database
- Calculate points (1 bottle = 50 points)
- Broadcast real-time updates via Socket.IO
- Send confirmation ke Arduino

---

## Kesimpulan

Sistem RVM ini menggunakan arsitektur modern dengan:
- **Web application** yang responsif dan bisa diinstall (PWA)
- **Real-time communication** untuk pengalaman user yang smooth
- **IoT integration** dengan Arduino untuk hardware detection
- **Secure authentication** dengan JWT dan Google OAuth
- **Scalable database** dengan PostgreSQL

**Business Rule Utama:**
- 1 botol plastik = 50 poin
- Poin bisa diredeem ke berbagai metode pembayaran
- Semua transaksi tercatat untuk audit trail

---

*Untuk arsitektur detail lengkap, lihat [DIAGRAMS.md](./DIAGRAMS.md)*
*Untuk database schema, lihat [ERD.md](./ERD.md)*
