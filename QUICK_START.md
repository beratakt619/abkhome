# ABKHomeDesign - Hızlı Başlangıç

## Windows Lokal Kurulum (1 dakika!)

### 1. PowerShell Aç
```powershell
cd C:\Users\Lenovo\Desktop\abk
```

### 2. Modülleri Yükle
```powershell
npm install
```

### 3. Başlat
```powershell
npm run dev
```

### 4. Tarayıcıda Aç
**http://localhost:5000**

---

## ✅ Çalışan Özellikleri
- ✅ Frontend (React + Vite)
- ✅ Backend (Express API)
- ✅ Firebase Firestore
- ✅ Trendyol Marketplace
- ✅ Admin Panel (`/admin`)
- ✅ Ürün Yönetimi
- ✅ Sipariş Takibi

---

## 📁 Yapı
```
abk/
├── client/        → Frontend React
├── server/        → Backend Node.js
├── shared/        → Shared Types
├── .env.local     → Credentials (hazır!)
└── package.json   → Dependencies
```

---

## 🆘 Port Sorunu?
```powershell
netstat -ano | findstr :5000
taskkill /PID <numara> /F
npm run dev
```

---

**Hazır!** npm install yap ve npm run dev ile başla! 🚀
