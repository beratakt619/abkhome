# Natro Deployment Checklist

## 🔧 Kurulum Öncesi

- [ ] Natro'da Node.js ve npm support olduğunu kontrol et
- [ ] Firebase project oluştur
- [ ] Firebase admin credentials indir
- [ ] ImgBB hesabı oluştur ve API key al
- [ ] Trendyol seller account'una erişimi kontrol et
- [ ] İyzico account'una erişimi kontrol et (isteğe bağlı)
- [ ] Custom domain satın al
- [ ] Natro'dan static IP ve hosting bilgileri al

## 📋 Ortam Değişkenleri

### Firebase Setup
- [ ] VITE_FIREBASE_API_KEY
- [ ] VITE_FIREBASE_AUTH_DOMAIN
- [ ] VITE_FIREBASE_PROJECT_ID
- [ ] VITE_FIREBASE_STORAGE_BUCKET
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
- [ ] VITE_FIREBASE_APP_ID
- [ ] VITE_FIREBASE_MEASUREMENT_ID
- [ ] FIREBASE_ADMIN_PRIVATE_KEY

### API Keys
- [ ] IMGBB_API_KEY
- [ ] TRENDYOL_API_KEY (opsiyonel)
- [ ] TRENDYOL_API_SECRET (opsiyonel)
- [ ] TRENDYOL_SUPPLIER_ID (opsiyonel)
- [ ] IYZICO_API_KEY (opsiyonel)
- [ ] IYZICO_SECRET_KEY (opsiyonel)

## 🚀 Deployment

- [ ] Local'de `npm run build` başarılı
- [ ] `dist/index.cjs` dosyası oluştu
- [ ] `public/` klasörü build artifacts'ı içeriyor
- [ ] Proje Natro'ya yüklendi
- [ ] Tüm ortam değişkenleri Natro'da ayarlandı
- [ ] Build command: `npm run build` olarak set edildi
- [ ] Start command: `npm start` olarak set edildi

## 🌐 Domain & DNS

- [ ] Natro hosting IP adresini not et
- [ ] Domain registrar'da A record Natro IP'sine yönlendir
- [ ] MX records varsa kontrol et
- [ ] SSL sertifikasını aktif et
- [ ] `example.com` ve `www.example.com` için CNAME/A records

## ✅ Test

- [ ] Ana sayfa (/) açılıyor
- [ ] Ürünler sayfası (/urunler) açılıyor
- [ ] Admin panel (/admin) admin kullanıcı ile açılıyor
- [ ] Login/Register çalışıyor
- [ ] Ürün yükleme (ImgBB) çalışıyor
- [ ] Trendyol sync çalışıyor (eğer kullanılıyorsa)
- [ ] İyzico payment entegrasyonu çalışıyor (eğer kullanılıyorsa)
- [ ] WebSocket bağlantıları normal

## 📊 Monitoring

- [ ] Server loglarını kontrol et
- [ ] Error loglarını kontrol et
- [ ] Database bağlantısı kontrol et
- [ ] API response times kontrol et
- [ ] Uptime monitoring setup et

## 🔐 Security

- [ ] HTTPS aktif (SSL sertifikası)
- [ ] API rate limiting set et (opsiyonel)
- [ ] CORS ayarları doğru
- [ ] Admin credentials güvenli (strong password)
- [ ] Database access logs enable et
- [ ] API keys ve secrets secure way'de stored

## 📧 Configuration

- [ ] Contact email ayarladı
- [ ] Contact phone ayarladı
- [ ] Address bilgileri ekledi
- [ ] Legal pages (gizlilik, şartlar) ekledi
- [ ] Shipping settings ayarladı
- [ ] Payment methods enable/disable et

## 🎯 İyileştirmeler (Opsiyonel)

- [ ] CDN setup et (image serving için)
- [ ] Caching headers configure et
- [ ] Database backups ayarla
- [ ] Analytics enable et
- [ ] Email notifications setup et
- [ ] Admin notifications setup et
