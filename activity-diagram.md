# Activity Diagrams - RVM Application (Swimlane Format)

Activity diagrams berdasarkan use case diagram sistem RVM (Reverse Vending Machine) menggunakan format swimlanes (simulasi dengan subgraph Mermaid) untuk menunjukkan tanggung jawab antar aktor.

---

## 1. Login Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S1([Start]) --> U1[Input Email & Password]
        U1 --> U2[Click Login]
        U10[Click Google Login] --> U11[Redirect to Google OAuth]
        U15[Tampilkan Error] --> U1
    end

    subgraph System ["System"]
        U2 --> SY1{Validasi Input}
        SY1 -->|Invalid| U15
        SY1 -->|Valid| SY2[Cek Kredensial di Database]
        SY2 -->|Salah| U15
        SY2 -->|Benar| SY3[Generate JWT Token]
        SY3 --> SY4[Simpan Session]
        SY4 --> U12[Redirect ke Home]
    end

    subgraph ThirdParty ["Third-party (Google)"]
        U11 --> TP1{Verifikasi Akun}
        TP1 -->|Gagal| U15
        TP1 -->|Berhasil| TP2[Kirim Data User]
        TP2 --> SY5{User Terdaftar?}
        SY5 -->|Belum| SY6[Buat User Baru]
        SY6 --> SY3
        SY5 -->|Sudah| SY3
    end

    U12 --> E1([End])

    style S1 fill:#3b82f6,color:#fff
    style E1 fill:#10b981,color:#fff
    style U15 fill:#ef4444,color:#fff
```

---

## 2. Register Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S2([Start]) --> U1[Isi Form Registrasi]
        U1 --> U2[Accept Terms & Conditions]
        U2 --> U3[Click Register]
        U10[Tampilkan Error] --> U1
    end

    subgraph System ["System"]
        U3 --> SY1{Validasi Input}
        SY1 -->|Invalid| U10
        SY1 -->|Valid| SY2{Cek Email Terdaftar?}
        SY2 -->|Sudah| U10
        SY2 -->|Belum| SY3[Hash Password]
        SY3 --> SY4[Simpan User ke Database]
        SY4 --> SY5[Inisialisasi Balance = 0]
        SY5 --> SY6[Generate JWT Token]
        SY6 --> SY7[Simpan Session]
        SY7 --> U4[Redirect ke Home]
    end

    U4 --> E2([End])

    style S2 fill:#3b82f6,color:#fff
    style E2 fill:#10b981,color:#fff
    style U10 fill:#ef4444,color:#fff
```

---

## 3. Manage Profile Activity Diagram (with Reset Password Extension)

```mermaid
flowchart TD
    subgraph User ["User"]
        S3([Start]) --> U1[Buka Halaman Profil]
        U1 --> U2{Pilih Aksi}
        U2 -->|Edit Profil| U3[Ubah Data Profil]
        U3 --> U4[Click Simpan]
        U2 -->|Reset Password| U5[qClick Reset Password]
        U5 --> U6[Input Password Lama]
        U6 --> U7[Input Password Baru]
        U7 --> U8[Konfirmasi Password Baru]
        U8 --> U9[Click Simpan Password]
        U2 -->|Logout| U15[Click Logout]
        U20[Tampilkan Error] --> U2
    end

    subgraph System ["System"]
        U1 --> SY1[Load Data Profil dari DB]
        SY1 --> U2
        
        U4 --> SY2{Validasi Data}
        SY2 -->|Invalid| U20
        SY2 -->|Valid| SY3[Update Database]
        SY3 --> U21[Tampilkan Sukses]
        U21 --> U2
        
        U9 --> SY4{Validasi Password}
        SY4 -->|Password Lama Salah| U20
        SY4 -->|Password Baru Invalid| U20
        SY4 -->|Valid| SY5[Verifikasi Password Lama]
        SY5 --> SY6[Hash Password Baru]
        SY6 --> SY7[Update Password di DB]
        SY7 --> SY8[Logout User]
        SY8 --> U22[Redirect ke Login]
        
        U15 --> SY9{Konfirmasi?}
        SY9 -->|Tidak| U2
        SY9 -->|Ya| SY10[Clear Session]
        SY10 --> U22
    end

    U22 --> E3([End])

    style S3 fill:#3b82f6,color:#fff
    style E3 fill:#10b981,color:#fff
    style U20 fill:#ef4444,color:#fff
```

---

## 4. View RVM Location Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S4([Start]) --> U1[Buka Halaman Lokasi]
        U1 --> U2{Izinkan Akses Lokasi?}
        U2 -->|Tidak| U10[Tampilkan Peta Default]
        U2 -->|Ya| U3[Berikan Izin Lokasi]
        U10 --> U5
        U5{Interaksi dengan Peta}
        U5 -->|Klik Marker RVM| U6[Lihat Info RVM]
        U6 --> U7[Click Petunjuk Arah]
        U5 -->|Zoom/Drag| U8[Atur View Peta]
        U8 --> U5
        U5 -->|Tutup| E4([End])
    end

    subgraph System ["System"]
        U3 --> SY1[Ambil Koordinat User]
        SY1 --> SY2[Load Peta Leaflet]
        SY2 --> SY3[Fetch Lokasi RVM dari DB]
        SY3 --> SY4[Tampilkan Markers]
        SY4 --> U5
        
        U6 --> SY5[Load Detail RVM]
        SY5 --> U5
        
        U7 --> SY6[Buka Google Maps]
        SY6 --> E4
    end

    style S4 fill:#3b82f6,color:#fff
    style E4 fill:#10b981,color:#fff
```

---

## 5. View Tutorial Video Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S5([Start]) --> U1[Buka Halaman Panduan]
        U1 --> U2{Pilih Aksi}
        U2 -->|Pilih Video| U3[Click Video]
        U3 --> U4[Tonton Video]
        U4 --> U5{Kontrol Video}
        U5 -->|Play/Pause| U6[Toggle Playback]
        U6 --> U5
        U5 -->|Seek/Volume| U7[Adjust Settings]
        U7 --> U5
        U5 -->|Back| U2
        U5 -->|Video Selesai| U2
        U2 -->|Tutup| E5([End])
    end

    subgraph System ["System"]
        U1 --> SY1[Fetch Daftar Video Tutorial]
        SY1 --> U2
        
        U3 --> SY2[Load Video Player]
        SY2 --> SY3[Fetch Video URL]
        SY3 --> U4
    end

    style S5 fill:#3b82f6,color:#fff
    style E5 fill:#10b981,color:#fff
```

---

## 6. View Points Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S6([Start]) --> U1[Buka Halaman Poin]
        U1 --> U2{Pilih Aksi}
        U2 -->|Lihat Riwayat| U3[Click Riwayat]
        U3 --> U10[Redirect ke Riwayat]
        U2 -->|Redeem| U4[Click Redeem]
        U4 --> U11[Redirect ke Redeem]
        U2 -->|Refresh| U5[Pull to Refresh]
        U5 --> U1
        U2 -->|Tutup| E6([End])
    end

    subgraph System ["System"]
        U1 --> SY1{Cek Login}
        SY1 -->|Belum| SY2[Redirect ke Login]
        SY2 --> E6
        SY1 -->|Sudah| SY3[Fetch Balance User]
        SY3 --> SY4[Fetch Total Botol]
        SY4 --> SY5[Fetch Statistik]
        SY5 --> SY6[Tampilkan Data Poin]
        SY6 --> U2
    end

    U10 --> E6
    U11 --> E6

    style S6 fill:#3b82f6,color:#fff
    style E6 fill:#10b981,color:#fff
```

---

## 7. View Transaction History Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S7([Start]) --> U1[Buka Halaman Riwayat]
        U1 --> U2{Pilih Aksi}
        U2 -->|Klik Transaksi| U3[Pilih Detail Transaksi]
        U3 --> U4[Lihat Detail Lengkap]
        U4 --> U2
        U2 -->|Filter| U5[Pilih Filter]
        U5 --> U6{Jenis Filter}
        U6 -->|Semua| U7[Show All]
        U6 -->|Deposit| U8[Show Deposit]
        U6 -->|Redeem| U9[Show Redeem]
        U7 --> U2
        U8 --> U2
        U9 --> U2
        U2 -->|Scroll| U10[Load More]
        U2 -->|Refresh| U11[Pull to Refresh]
        U11 --> U1
        U2 -->|Tutup| E7([End])
    end

    subgraph System ["System"]
        U1 --> SY1{Cek Login}
        SY1 -->|Belum| SY2[Redirect ke Login]
        SY2 --> E7
        SY1 -->|Sudah| SY3[Fetch Riwayat dari DB]
        SY3 --> SY4[Sort by Date DESC]
        SY4 --> SY5[Group by Type]
        SY5 --> SY6{Ada Data?}
        SY6 -->|Tidak| SY7[Tampilkan Empty State]
        SY7 --> E7
        SY6 -->|Ya| SY8[Tampilkan List Transaksi]
        SY8 --> U2
        
        U3 --> SY9[Load Detail Transaksi]
        SY9 --> U4
        
        U10 --> SY10{Ada Data Lagi?}
        SY10 -->|Ya| SY11[Fetch Next Page]
        SY11 --> SY8
        SY10 -->|Tidak| SY12[Tampilkan End Message]
        SY12 --> U2
    end

    style S7 fill:#3b82f6,color:#fff
    style E7 fill:#10b981,color:#fff
```

---

## 8. Redeem Reward Activity Diagram

```mermaid
flowchart TD
    subgraph User ["User"]
        S8([Start]) --> U1[Buka Halaman Redeem]
        U1 --> U2{Pilih Metode Redeem}
        U2 -->|E-wallet| U3[Pilih Provider]
        U3 --> U4{Pilih E-wallet}
        U4 -->|GoPay| U5[Input Nomor GoPay]
        U4 -->|OVO| U6[Input Nomor OVO]
        U4 -->|Dana| U7[Input Nomor Dana]
        U4 -->|BCA| U8[Input Rekening BCA]
        U5 --> U15
        U6 --> U15
        U7 --> U15
        U8 --> U15
        U2 -->|Voucher| U9[Pilih Voucher]
        U9 --> U15
        U2 -->|Pulsa| U10[Input Nomor HP]
        U10 --> U11[Pilih Nominal]
        U11 --> U15[Input Jumlah Poin]
        U15 --> U16[Click Confirm]
        U20[Tampilkan Error] --> U2
    end

    subgraph System ["System"]
        U1 --> SY1{Cek Login}
        SY1 -->|Belum| SY2[Redirect ke Login]
        SY2 --> E8([End])
        SY1 -->|Sudah| SY3[Fetch Balance]
        SY3 --> SY4{Poin Cukup?}
        SY4 -->|Tidak| U20
        SY4 -->|Ya| U2
        
        U9 --> SY5[Fetch Daftar Voucher]
        SY5 --> U9
        
        U16 --> SY6{Validasi}
        SY6 -->|Invalid| U20
        SY6 -->|Valid| SY7[Tampilkan Summary]
        SY7 --> U17{User Konfirmasi?}
        U17 -->|Batal| U2
        U17 -->|Ya| SY8[Deduct Points]
        SY8 --> SY9[Save Transaction]
        SY9 --> SY10[Call Payment Gateway]
    end

    subgraph ThirdParty ["Third-party (Payment Gateway)"]
        SY10 --> TP1[Process Payment Request]
        TP1 --> TP2{API Response}
        TP2 -->|Gagal| TP3[Return Error]
        TP3 --> SY11[Rollback Points]
        SY11 --> U20
        TP2 -->|Berhasil| TP4[Return Success]
        TP4 --> SY12[Update Status Success]
        SY12 --> SY13[Generate Receipt]
        SY13 --> SY14[Send Notification]
        SY14 --> U18[Tampilkan Receipt]
        U18 --> E8
    end

    style S8 fill:#3b82f6,color:#fff
    style E8 fill:#10b981,color:#fff
    style U20 fill:#ef4444,color:#fff
```

---

## 9. Deposit Bottles Activity Diagram (includes Scan QR Code)

```mermaid
flowchart TD
    subgraph User ["User"]
        S9([Start]) --> U1[Tiba di Lokasi RVM]
        U1 --> U2[Buka QR Scanner]
        U2 --> U3{Izinkan Kamera?}
        U3 -->|Tidak| U20[Tampilkan Error]
        U20 --> E9([End])
        U3 -->|Ya| U4[Scan QR Code RVM]
        U4 --> U10[Lihat Layar Deposit]
        U10 --> U11[Masukkan Botol ke Mesin]
        U15[Lihat Counter Update] --> U16{Masukkan Lagi?}
        U16 -->|Ya| U11
        U16 -->|Tidak| U17[Click Klaim]
        U17 --> U18{Konfirmasi?}
        U18 -->|Batal| U10
        U18 -->|Ya| U19[Lihat Receipt]
        U19 --> E9
    end

    subgraph System ["System"]
        U2 --> SY1{Cek Login}
        SY1 -->|Belum| SY2[Redirect ke Login]
        SY2 --> E9
        SY1 -->|Sudah| U3
        
        U4 --> SY3{Validasi QR}
        SY3 -->|Invalid| U20
        SY3 -->|Valid| SY4[Extract Location ID]
        SY4 --> SY5{Lokasi Terdaftar?}
        SY5 -->|Tidak| U20
        SY5 -->|Ya| SY6[Create Session]
        SY6 --> SY7[Save Session to DB]
        SY7 --> SY8[Connect Socket.IO]
        SY8 --> SY9[Join Room by Location]
        SY9 --> U10
        
        SY15[Receive MQTT Message] --> SY16{Validasi Device}
        SY16 -->|Invalid| SY17[Ignore]
        SY16 -->|Valid| SY18{Validasi Session}
        SY18 -->|Tidak Ada| SY19[Create Direct Session]
        SY19 --> SY20[Process Bottle]
        SY18 -->|Ada| SY20
        SY20 --> SY21[Increment Counter]
        SY21 --> SY22[Calculate Points: x50]
        SY22 --> SY23[Save to DB]
        SY23 --> SY24[Broadcast via Socket.IO]
        SY24 --> U15
        
        U18 --> SY25[Close Session]
        SY25 --> SY26[Final Calculation]
        SY26 --> SY27[Update Balance]
        SY27 --> SY28[Create Transaction]
        SY28 --> SY29[Generate Receipt]
        SY29 --> SY30[Send Notification]
        SY30 --> U19
    end

    subgraph Arduino ["Arduino/RVM Device"]
        U11 --> AR1[Sensor Deteksi Botol]
        AR1 --> AR2[Botol Terdeteksi]
        AR2 --> AR3[Publish to MQTT]
        AR3 --> SY15
    end

    style S9 fill:#3b82f6,color:#fff
    style E9 fill:#10b981,color:#fff
    style U20 fill:#ef4444,color:#fff
    style AR1 fill:#00979d,color:#fff
    style AR2 fill:#00979d,color:#fff
    style AR3 fill:#00979d,color:#fff
```

---

## Summary

File ini berisi **9 activity diagrams dalam format swimlanes** yang sesuai dengan use case diagram sistem RVM:

### Swimlanes yang Digunakan:
- **User**: Aktivitas yang dilakukan oleh pengguna
- **System**: Proses yang dilakukan oleh backend sistem (Next.js, Database, Socket.IO)
- **Arduino/RVM Device**: Aktivitas perangkat IoT untuk deteksi botol
- **Third-party**: Integrasi eksternal (Google OAuth, Payment Gateway)

### Daftar Activity Diagrams:

1. **Login** - User, System, Third-party (Google OAuth)
2. **Register** - User, System
3. **Manage Profile** (extends: Reset Password) - User, System
4. **View RVM Location** - User, System
5. **View Tutorial Video** - User, System
6. **View Points** - User, System
7. **View Transaction History** - User, System
8. **Redeem Reward** - User, System, Third-party (Payment Gateway)
9. **Deposit Bottles** (includes: Scan QR Code) - User, System, Arduino

Setiap diagram menunjukkan alur kerja lengkap dengan swimlanes untuk memisahkan tanggung jawab antar aktor, decision points, error handling, dan integrasi sistem real-time.

