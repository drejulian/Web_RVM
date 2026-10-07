# Panduan Deploy Web RVM ke Railway

## Langkah 1: Setup Railway Account

1. Buka https://railway.app
2. Sign up dengan GitHub account Anda
3. Authorize Railway untuk akses GitHub

## Langkah 2: Deploy dari GitHub

1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository: `derbitrijulian/web_rvm`
4. Railway akan otomatis detect Next.js project

## Langkah 3: Configure Environment Variables

Di Railway Dashboard, tambahkan environment variables berikut:

**Database:**
```
DATABASE_URL=your-supabase-database-url-with-pgbouncer
DIRECT_URL=your-supabase-direct-connection-url
```

> ⚠️ **Penting:** Ambil nilai asli dari file `.env` lokal Anda

**Auth & Security:**
```
JWT_SECRET=your-jwt-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> ⚠️ **Penting:** Gunakan nilai asli dari file `.env` lokal Anda, jangan commit secrets ke Git!

**Node Environment:**
```
NODE_ENV=production
```

## Langkah 4: Deploy

1. Railway akan otomatis build dan deploy
2. Tunggu sampai status berubah menjadi **"Active"**
3. Copy URL deployment (contoh: `https://web-rvm-production.up.railway.app`)

## Langkah 5: Update Mesin RVM

Setelah dapat Railway URL, update file `E:\mesin_rvm\.env.production`:

```env
WEB_RVM_URL=https://your-railway-url.up.railway.app
NEXT_PUBLIC_WEB_RVM_URL=https://your-railway-url.up.railway.app
```

Ganti `your-railway-url` dengan URL Railway Anda yang sebenarnya.

## Langkah 6: Testing

1. Buka Railway URL di browser
2. Cek browser console - seharusnya ada log "Socket.IO server initialized"
3. Test koneksi dari mesin RVM

## Troubleshooting

**Jika build gagal:**
- Cek logs di Railway dashboard
- Pastikan semua env variables sudah diset

**Jika Socket.IO tidak connect:**
- Pastikan Railway URL sudah benar di mesin_rvm
- Cek CORS configuration (sudah diset ke `origin: '*'`)

**Jika database error:**
- Pastikan DATABASE_URL dan DIRECT_URL sudah benar
- Test koneksi database dari Railway logs

## Catatan Penting

- Railway free tier: 500 jam/bulan ($5 credit)
- Setelah free credit habis, akan pause otomatis
- Untuk production, upgrade ke paid plan
