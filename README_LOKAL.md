# ABKHomeDesign - Lokal Çalıştırma (Çalışacak!)

## ✅ Ne Düzeltildi?
Backend API endpoints eklendi - Firebase verileri backend üzerinden gelecek!

## 🚀 Lokal Kurulum (5 dakika)

### 1. PowerShell aç ve gir
```powershell
cd C:\Users\Lenovo\Desktop\abk
```

### 2. Modülleri yükle
```powershell
npm install
```

### 3. Başlat
```powershell
npm run dev
```

### 4. Tarayıcıda aç
```
http://localhost:5000
```

---

## ✅ Çalışacak Özellikleri
✅ Frontend (React)
✅ Backend (Express)
✅ Ürünler ve Kategoriler (Firebase)
✅ Admin Panel `/admin`
✅ Trendyol entegrasyonu

---

## 📋 Önemli Not
- `.env.local` dosyası HAZIR - değiştirme
- Backend otomatik Firebase'e bağlanacak
- Eğer veri yok ise admin panelinden ürün ekle

---

## 🆘 Sorun?
```powershell
# Port zaten kullanımda?
netstat -ano | findstr :5000
taskkill /PID <PID> /F
npm run dev
```

**Başarılar!** 🎉
