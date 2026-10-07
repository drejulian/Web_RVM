# PWA Icons Setup Guide

Untuk PWA aplikasi ini berfungsi optimal, Anda perlu membuat icon dengan ukuran berikut dan menyimpannya di folder `public/png/`:

## Icons yang Diperlukan:

1. **icon-192x192.png** - Icon untuk Android Home Screen
2. **icon-512x512.png** - Icon untuk App Store, Splash Screen
3. **screenshot-540x720.png** - Screenshot untuk App Store (portrait)
4. **screenshot-1080x1440.png** - Screenshot untuk App Store (portrait, high res)

## Tools untuk Membuat Icons:

### Opsi 1: Online Icon Generator (Recommended)

- **PWA Builder** (https://www.pwabuilder.com/)
  - Upload gambar/logo Anda
  - Otomatis generate icons dengan berbagai ukuran
  - Bisa download langsung dalam format PNG

- **Favicon Generator** (https://realfavicongenerator.net/)
  - Upload logo
  - Generate all required sizes
  - Include PWA icons

### Opsi 2: Using Figma

- Buat design di Figma dengan ukuran 512x512px
- Export sebagai PNG untuk masing-masing ukuran
- Atau gunakan plugin "Export to PNG"

### Opsi 3: Manual dengan Image Editor

- Gunakan Photoshop, GIMP, atau Paint.NET
- Create 512x512px design
- Resize/export untuk ukuran lain yang diperlukan
- Pastikan transparent background (PNG with alpha channel)

## Best Practices:

1. Gunakan format PNG dengan transparent background
2. Pastikan logo terlihat jelas di ukuran kecil (192x192)
3. Icon harus square (1:1 aspect ratio)
4. Hindari shadows dan complex details yang tidak terlihat di thumbnail
5. Use consistent branding colors

## Setelah Membuat Icons:

1. Save semua PNG files di folder `public/png/`
2. Nama file harus sesuai dengan yang di `manifest.json`:
   - icon-192x192.png
   - icon-512x512.png
   - screenshot-540x720.png (opsional)
   - screenshot-1080x1440.png (opsional)

## Testing PWA Installation:

Setelah icons di-upload:

1. Build aplikasi: `npm run build`
2. Start production server: `npm start`
3. Akses di HTTPS (PWA hanya bekerja di HTTPS)
4. Buka DevTools → Application → Manifest
5. Cek apakah manifest.json ter-load dengan benar
6. Di Android: Akan ada notifikasi "Add to Home Screen"
7. Di iOS: Use Share → Add to Home Screen

## Troubleshooting:

- **Icon tidak muncul di home screen**: Pastikan icon paths di manifest.json sesuai dengan file yang aktual
- **PWA tidak ter-install**: Beberapa requirement:
  - HTTPS adalah mandatory
  - manifest.json harus valid JSON
  - Service worker harus ter-register dengan benar
  - Icon minimal 192x192px harus tersedia
- **Offline tidak berfungsi**: Periksa service worker registration di DevTools

## File Structure:

```
public/
├── manifest.json (sudah dibuat)
└── png/
    ├── icon-192x192.png
    ├── icon-512x512.png
    ├── screenshot-540x720.png (opsional)
    └── screenshot-1080x1440.png (opsional)
```
