# ABKHomeDesign - Natro Full Stack Deployment Guide

Bu rehber, ABKHomeDesign uygulamasını Natro'da full-stack olarak deployment etmek için gerekli tüm adımları içerir.

## Ön Gereksinimler

- Natro hesabı
- Node.js support (Natro'da kontrol edin)
- Custom domain ve SSL sertifikası
- Aşağıdaki API anahtarları ve kimlik bilgileri

## 1. Ortam Değişkenleri (Environment Variables)

Natro kontrol panelinde aşağıdaki ortam değişkenlerini ayarlayın:

### Firebase
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
FIREBASE_ADMIN_PRIVATE_KEY=your_firebase_admin_private_key
```

### Trendyol API (İsteğe bağlı)
```
TRENDYOL_API_KEY=your_trendyol_api_key
TRENDYOL_API_SECRET=your_trendyol_api_secret
TRENDYOL_SUPPLIER_ID=your_trendyol_supplier_id
```

### İyzico Ödeme (İsteğe bağlı)
```
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_URI=https://sandbox-api.iyzipay.com (sandbox) veya https://api.iyzipay.com (production)
```

### ImgBB Resim Yükleme
```
IMGBB_API_KEY=your_imgbb_api_key
```

### Node.js Ortam
```
NODE_ENV=production
PORT=your_port_number (Natro tarafından sağlanır, genelde 5000 veya atanan port)
```

## 2. Deployment Adımları

### Adım 1: Projeyi Natro'ya Yükleyin
```bash
# Git repository'yi Natro'da ayarlayın
# veya zip dosyası olarak yükleyin
```

### Adım 2: Ortam Değişkenlerini Ayarlayın
- Natro kontrol panelinde Settings/Environment Variables bölümüne gidin
- Yukarıdaki tüm değişkenleri ekleyin
- Değerlerinizi Firebase, Trendyol, İyzico ve ImgBB'den alın

### Adım 3: Deployment Konfigürasyonu
Natro'da aşağıdaki komutları ayarlayın:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

Veya eğer `start` scripti çalışmazsa:
```bash
NODE_ENV=production node dist/index.cjs
```

### Adım 4: Port Ayarı
- Natro size atanan PORT numarasını not edin (genelde 5000)
- Bu port otomatik olarak environment'a eklenecektir

### Adım 5: Domain Bağlantısı
1. Natro'da verilen IP adresini not edin
2. Domain sağlayıcınızda (Natro DNS) A recordu güncelleyin
3. SSL sertifikasını (Let's Encrypt) Natro'da aktif hale getirin

## 3. Proje Yapısı

```
ABKHomeDesign/
├── client/               # React Frontend
│   ├── src/
│   ├── dist/            # Build output
│   └── vite.config.ts
├── server/              # Express Backend
│   ├── index.ts         # Ana server dosyası
│   ├── routes.ts        # API routes
│   ├── static.ts        # Static file serving
│   └── trendyol.ts      # Trendyol integration
├── shared/              # Shared types/schemas
├── package.json
└── dist/                # Production build output
```

## 4. Build İşlemi

```bash
# Projeyi build et
npm run build

# Output: dist/index.cjs (production server)
# Output: public/ (built frontend)
```

Build sonrası yapı:
- `public/` klasörü React frontend build'i içerir
- `dist/index.cjs` production Express server'ıdır
- Server otomatik olarak `public/` klasöründen static dosyaları serve eder

## 5. Troubleshooting

### Port Hatası
```
Error: Port already in use
```
Çözüm: Natro size atanan PORT kullanın, hard-coded port kullanmayın

### Module Not Found Hatası
```
Error: Cannot find module 'firebase'
```
Çözüm: `npm install` çalıştırın veya bağımlılıkları kontrol edin

### Firebase Credentials Hatası
```
FirebaseError: Invalid service account
```
Çözüm: FIREBASE_ADMIN_PRIVATE_KEY doğru şekilde format edildiğini kontrol edin

### Trendyol Bağlantı Hatası
```
Trendyol API bağlantısı başarısız
```
Çözüm: API anahtarlarını ve Supplier ID'yi doğrulayın, Natro IP'sinin Trendyol'da whitelisted olduğundan emin olun

## 6. Güncellemeler

Projeyi güncellemek için:
1. Local'de değişiklikleri yapın
2. `npm run build` ile build edin
3. Repository'yi Natro'ya push edin
4. Natro otomatik deploy edecektir

## 7. Kontrol Listesi

- [ ] Node.js Natro'da supported
- [ ] Tüm ortam değişkenleri ayarlandı
- [ ] Firebase credentials test edildi
- [ ] `npm run build` başarılı
- [ ] Domain DNS ayarlandı
- [ ] SSL sertifikası aktif
- [ ] Email ve destek ayarları yapıldı
- [ ] Admin kullanıcı oluşturuldu

## 8. Daha Fazla Bilgi

- Firebase: https://firebase.google.com
- Trendyol Developer: https://developer.trendyol.com
- İyzico: https://www.iyzico.com
- ImgBB: https://imgbb.com

## Destek

Herhangi bir sorun için:
1. Natro dokümantasyonunu kontrol edin
2. Port ve ortam değişkenlerini doğrulayın
3. Server loglarını kontrol edin
