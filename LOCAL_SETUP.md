# ABK Home Design - Lokal Kurulum Rehberi

## Sistem Gereksinimleri
- Node.js 18+ 
- npm veya yarn

## Kurulum Adımları

### 1. Bağımlılıkları Yükle
```bash
cd abk
npm install
```

### 2. Environment Değişkenlerini Ayarla
```bash
cp .env.example .env
```

Sonra `.env` dosyasını açıp aşağıdaki değerleri gir:

#### Firebase Setup
1. [Firebase Console](https://console.firebase.google.com/) açın
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. Proje ayarlarından:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

4. Admin SDK key için:
   - Proje Ayarları → Hizmet Hesapları → Node.js seçin
   - Yeni private key oluşturun
   - JSON dosyasındaki `private_key` değerini `FIREBASE_ADMIN_PRIVATE_KEY` olarak kopyala

#### ImgBB API Key
1. [ImgBB](https://imgbb.com/api) üzerinde hesap oluşturun
2. API key'inizi alın
3. `IMGBB_API_KEY` ile yapıştırın

#### Session Secret
Rasgele güvenli bir string girin (örn: `openssl rand -base64 32`)

#### iyzico (İsteğe Bağlı)
Ödeme işlevini kullanacaksanız, [iyzico](https://iyzico.com/) hesabınızdan API key alın

### 3. Uygulamayı Çalıştır
```bash
npm run dev
```

Uygulama **http://localhost:5000** adresinde açılacak

## Dosya Yapısı
```
abk/
├── client/              # React Frontend
├── server/              # Express Backend
├── shared/              # Shared TypeScript types
├── package.json
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS
└── .env                 # Environment variables (git ignored)
```

## Geliştirme

### Frontend Değişiklikleri
- `client/src/` klasöründe çalışın
- Otomatik hot reload aktif olacak

### Backend Değişiklikleri
- `server/` klasöründe çalışın
- `npm run dev` otomatik olarak dinleyecek

## Sorun Giderme

### Port 5000 zaten kullanımda
```bash
# Port değiştir
npm run dev -- --port 3000
```

### Firebase Hatası: Permission Denied
- `.env` dosyasındaki Firebase anahtarlarını kontrol edin
- Firestore veritabanı kurallarını kontrol edin

### ImgBB Upload Hatası
- `IMGBB_API_KEY` değerini doğrulayın
- API anahtarın aktif olduğunu kontrol edin

## Notlar
- Bu proje Turkish language kullanıyor
- Firebase Firestore gerektiriyor (lokalde emulator kullanabilirsiniz)
- Tüm hassas veriler `.env` dosyasında saklanır (git ignore'da)

---
**Sorular için:** Proje belgesine bakın veya admin panelini (http://localhost:5000/admin) kontrol edin
