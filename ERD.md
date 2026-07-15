# Database Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| UserBottleCount : "has"
    UserBottleCount ||--o{ BottleCount : "tracks"
    UserBottleCount ||--o{ BottleTransaction : "records"
    Admin ||--o{ AuditLog : "creates"
    Voucher ||--o{ VoucherRedemption : "has"
    User ||--o{ VoucherRedemption : "redeems"
    RvmLocation ||--o{ ArduinoConnection : "hosts"
    RvmLocation ||--o{ BottleTransaction : "processes"
    ArduinoConnection ||--o{ BottleTransaction : "executes"
    ArduinoConnection ||--o{ BottleCount : "records"
    BottleTransaction ||--o{ BottleCount : "aggregates"
    User ||--o{ ArduinoSession : "creates"
    ArduinoConnection ||--o{ ArduinoSession : "hosts"

    User {
        string id PK
        string email UK
        string nama
        string password
        string phoneNumber
        string googleId UK
        boolean isGoogleAuth
        string resetPasswordToken
        datetime resetPasswordTokenExpiry
        datetime createdAt
        datetime updatedAt
    }

    Admin {
        string id PK
        string email UK
        string nama
        string password
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime lastLogin
    }

    UserBottleCount {
        string id PK
        string userId FK
        int totalBottles
        int redeemableCount
        int lifetimeCount
        int points
        int lifetimePoints
        datetime lastUpdated
    }

    BottleTransaction {
        string id PK
        string userBottleCountId FK
        string deviceId FK
        int locationId FK
        string transactionType
        int bottleCount
        int pointsEarned
        datetime timestamp
    }

    BottleCount {
        int id PK
        string deviceId FK
        int count
        float distance
        string source
        datetime timestamp
        string userBottleCountId FK
        string bottleTransactionId FK
    }

    ArduinoConnection {
        int id PK
        string deviceId UK
        int locationId FK
        string ipAddress
        string status
        datetime lastPing
        datetime createdAt
        datetime updatedAt
    }

    RvmLocation {
        int id PK
        string name
        string address
        json position
        int capacity
        int currentStock
        string capacityStatus
        string operationalHours
        string contactNumber
        string status
        string image
        json images
        datetime createdAt
        datetime updatedAt
    }

    AuditLog {
        string id PK
        string adminId FK
        string action
        string targetType
        string targetId
        json details
        string ipAddress
        datetime timestamp
    }

    News {
        string id PK
        string title
        string content
        string imageUrl
        string category
        boolean isPublished
        datetime publishedAt
        string createdBy
        datetime createdAt
        datetime updatedAt
    }

    Voucher {
        string id PK
        string code UK
        string partner
        int value
        int pointCost
        int stock
        boolean isActive
        datetime expiryDate
        datetime createdAt
        datetime updatedAt
    }

    VoucherRedemption {
        string id PK
        string voucherId FK
        string userId
        string status
        datetime redeemedAt
        datetime usedAt
    }

    SystemConfig {
        string id PK
        string key UK
        string value
        string description
        datetime updatedAt
    }

    ArduinoSession {
        string id PK
        string deviceId FK
        string userId FK
        datetime expiresAt
        boolean isActive
        datetime createdAt
        datetime confirmedAt
    }
```

## Entity Descriptions

### User Management
- **User**: End users who use the RVM system for bottle recycling
- **Admin**: System administrators with different roles (SUPER_ADMIN, ADMIN, OPERATOR, CONTENT_MANAGER)

### Bottle Tracking
- **UserBottleCount**: Aggregate bottle and points tracking for each user
- **BottleTransaction**: Individual transaction records (deposit, redeem, adjustment)
- **BottleCount**: Raw bottle count data from devices

### Device & Location
- **ArduinoConnection**: Arduino device connection status and management
- **RvmLocation**: Physical locations of RVM machines
- **ArduinoSession**: Temporary sessions linking users to Arduino devices for direct bottle assignment via MQTT

### Voucher System
- **Voucher**: Available vouchers that can be redeemed with points
- **VoucherRedemption**: Records of voucher redemptions by users

### System
- **AuditLog**: Admin action audit trail
- **News**: News and announcements for users
- **SystemConfig**: System-wide configuration key-value pairs

## Relationship Details

1. **User ↔ UserBottleCount** (1:1)
   - One user has one bottle count record
   - Cascade delete enabled

2. **UserBottleCount ↔ BottleCount** (1:N)
   - One user bottle count tracks many individual bottle counts
   - Cascade delete enabled

3. **UserBottleCount ↔ BottleTransaction** (1:N)
   - One user bottle count has many transactions
   - Cascade delete enabled

4. **Admin ↔ AuditLog** (1:N)
   - One admin creates many audit log entries
   - Cascade delete enabled

5. **Voucher ↔ VoucherRedemption** (1:N)
   - One voucher can be redeemed multiple times
   - Cascade delete enabled

6. **RvmLocation ↔ ArduinoConnection** (1:N)
   - One RVM location can host multiple Arduino devices
   - locationId is optional (nullable) - devices may exist without assigned locations
   - Allows tracking which Arduino devices are deployed at each physical location

7. **User ↔ VoucherRedemption** (1:N)
   - One user can redeem multiple vouchers
   - Tracks voucher redemption history per user
   - Cascade delete enabled

8. **ArduinoConnection ↔ BottleTransaction** (1:N)
   - One Arduino device can process many transactions
   - deviceId in BottleTransaction references unique deviceId in ArduinoConnection
   - Allows tracking which specific device processed each transaction
   - SetNull on delete (preserves transaction history even if device is removed)

9. **ArduinoConnection ↔ BottleCount** (1:N)
   - One Arduino device records many bottle counts
   - deviceId in BottleCount references unique deviceId in ArduinoConnection
   - Tracks raw sensor data from each device
   - Cascade delete enabled

10. **BottleTransaction ↔ BottleCount** (1:N)
    - One BottleTransaction aggregates many raw BottleCount records
    - bottleTransactionId in BottleCount references BottleTransaction
    - Example: User deposits 5 bottles → 5 BottleCount records → 1 BottleTransaction
    - Links business transaction to individual sensor readings for complete audit trail
    - SetNull on delete (preserves raw sensor data even if transaction is removed)

11. **RvmLocation ↔ BottleTransaction** (1:N)
    - One location processes many transactions
    - locationId in BottleTransaction references RvmLocation
    - Direct relationship for efficient location-based queries and reporting
    - SetNull on delete (preserves transaction history even if location is removed)

12. **User ↔ ArduinoSession** (1:N)
    - One user can create multiple Arduino sessions
    - Manages temporary sessions for direct bottle assignment via MQTT
    - Session expires after defined period for security
    - Cascade delete enabled (sessions deleted when user is deleted)
    - Enables MQTT-based direct assignment: Arduino → MQTT → Server checks session → Direct user credit

13. **ArduinoConnection ↔ ArduinoSession** (1:N)
    - One Arduino device can host multiple user sessions
    - deviceId in ArduinoSession references unique deviceId in ArduinoConnection
    - Allows tracking which device is currently assigned to which user
    - Only one active session per device at a time (enforced by application logic)
    - Cascade delete enabled (sessions deleted when device is removed)
    - Index on [deviceId, isActive] for efficient active session queries

## Enumerations

### AdminRole
- SUPER_ADMIN
- ADMIN
- OPERATOR
- CONTENT_MANAGER

### BottleTransactionType
- DEPOSIT
- REDEEM
- ADJUSTMENT
