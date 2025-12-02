import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Iyzipay from "iyzipay";
import crypto from "crypto";
import {
  initTrendyol,
  getTrendyolProducts,
  getProductByBarcode,
  createTrendyolProduct,
  updateTrendyolStock,
  getTrendyolOrders,
  getTrendyolCategories,
  getTrendyolBrands,
  getCategoryAttributes,
  getCargoCompanies,
} from "./trendyol";

let db: any = null;

// Initialize Firebase Admin SDK (optional - only if credentials available)
async function initializeFirebase() {
  try {
    const admin = await import("firebase-admin");
    if (!admin.default.apps || !admin.default.apps.length) {
      const serviceAccount = {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
      };
      
      if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount),
          projectId: serviceAccount.projectId,
        });
        db = admin.default.firestore();
        console.log("✅ Firebase Admin SDK initialized - Firestore ready");
      }
    }
  } catch (err) {
    console.log("❌ Firebase Admin SDK not available:", err);
  }
}

initializeFirebase();

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || "sandbox-api-key",
  secretKey: process.env.IYZICO_SECRET_KEY || "sandbox-secret-key",
  uri: process.env.IYZICO_URI || "https://sandbox-api.iyzipay.com"
});

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ABK${year}${month}${day}${random}`;
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FTR${year}${month}-${random}`;
}

function generateConversationId(): string {
  return crypto.randomUUID();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Debug environment variables
  app.get("/api/debug/env", (req: Request, res: Response) => {
    res.json({
      firebase: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0
      },
      trendyol: {
        apiKey: !!process.env.TRENDYOL_API_KEY,
        apiSecret: !!process.env.TRENDYOL_API_SECRET,
        supplierId: !!process.env.TRENDYOL_SUPPLIER_ID
      }
    });
  });

  // Initialize Firebase Firestore with sample data
  app.post("/api/init-firestore", async (req: Request, res: Response) => {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Firebase Admin SDK not initialized" 
      });
    }

    try {
      const now = new Date().toISOString();

      // Create categories
      const categoriesData = [
        {
          id: "cat1",
          name: "Yatak Linen",
          slug: "yatak-linen",
          description: "Yüksek kaliteli yatak çarşafları ve nevresim takımları",
          isActive: true,
          productCount: 0,
          createdAt: now,
          order: 1
        },
        {
          id: "cat2",
          name: "Havlu ve Bornoz",
          slug: "havlu-bornoz",
          description: "Premium havlu ve bornoz koleksiyonu",
          isActive: true,
          productCount: 0,
          createdAt: now,
          order: 2
        },
        {
          id: "cat3",
          name: "Dekoratif Yastıklar",
          slug: "dekoratif-yastiklar",
          description: "Ev dekorasyonu için dekoratif yastıklar",
          isActive: true,
          productCount: 0,
          createdAt: now,
          order: 3
        },
      ];

      for (const cat of categoriesData) {
        await db.collection("categories").doc(cat.id).set(cat);
      }

      // Create sample products
      const productsData = [
        {
          id: "prod1",
          name: "Premium Yatak Çarşafı Seti",
          description: "Pamuklu, çok yumuşak yatak çarşafı seti. 200 iplik sayısı.",
          price: 299.99,
          discountPrice: 249.99,
          images: ["https://via.placeholder.com/400x500?text=Yatak+Carsafi"],
          categoryId: "cat1",
          stock: 50,
          isActive: true,
          isNew: true,
          rating: 4.5,
          reviewCount: 12,
          attributes: {
            fabricType: "Pamuk",
            color: "Beyaz",
            size: "160x200",
            length: "200cm",
            width: "160cm",
            material: "%100 Pamuk",
            careInstructions: "40°C sıcak suda yıkayınız"
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: "prod2",
          name: "Lüks Havlu Seti 6 Parça",
          description: "Mısır pamuklu, absorbent ve dayanıklı havlu seti",
          price: 199.99,
          images: ["https://via.placeholder.com/400x500?text=Havlu+Seti"],
          categoryId: "cat2",
          stock: 30,
          isActive: true,
          isNew: false,
          rating: 4.8,
          reviewCount: 25,
          attributes: {
            fabricType: "Mısır Pamuku",
            color: "Gri",
            size: "70x140cm",
            material: "%100 Mısır Pamuku",
            careInstructions: "60°C sıcak suda yıkayınız"
          },
          createdAt: now,
          updatedAt: now
        },
        {
          id: "prod3",
          name: "Dekoratif Kırlent Yastığı",
          description: "Keten kumaştan yapılmış, modern tasarımlı dekoratif yastık",
          price: 89.99,
          images: ["https://via.placeholder.com/400x500?text=Kirlent+Yastigi"],
          categoryId: "cat3",
          stock: 45,
          isActive: true,
          isNew: true,
          rating: 4.3,
          reviewCount: 8,
          attributes: {
            fabricType: "Keten",
            color: "Bej",
            size: "45x45cm",
            material: "Keten Blend",
            careInstructions: "Oda sıcaklığında yıkayınız"
          },
          createdAt: now,
          updatedAt: now
        }
      ];

      for (const prod of productsData) {
        await db.collection("products").doc(prod.id).set(prod);
      }

      // Create site settings
      await db.collection("settings").doc("site").set({
        id: "site",
        siteName: "ABKHomeDesign",
        siteDescription: "Türkiye'nin en iyi ev tekstil ürünleri",
        contactEmail: "info@abkhomedesign.com",
        contactPhone: "+90 212 123 45 67",
        address: "İstanbul, Türkiye",
        freeShippingThreshold: 500,
        standardShippingCost: 29.90,
        expressShippingCost: 49.90,
        estimatedDeliveryDays: 3,
        iyzicoEnabled: true,
        creditCardEnabled: true,
        bankTransferEnabled: false,
        cashOnDeliveryEnabled: false,
        updatedAt: now
      });

      // Create legal pages
      const legalPagesData = [
        {
          id: "kvkk",
          slug: "kvkk",
          title: "KVKK Politikası",
          content: "Kişisel Verilerin Korunması Kanunu kapsamında müşteri gizliliğini koruyoruz...",
          isActive: true,
          lastUpdated: now
        },
        {
          id: "privacy",
          slug: "gizlilik-politikasi",
          title: "Gizlilik Politikası",
          content: "Web sitemizde toplanan veriler güvenli şekilde korunmaktadır...",
          isActive: true,
          lastUpdated: now
        },
        {
          id: "terms",
          slug: "kullanim-kosullari",
          title: "Kullanım Koşulları",
          content: "Siteyi kullanarak bu koşulları kabul etmiş sayılırsınız...",
          isActive: true,
          lastUpdated: now
        }
      ];

      for (const page of legalPagesData) {
        await db.collection("legalPages").doc(page.id).set(page);
      }

      res.json({
        success: true,
        message: "Firebase Firestore başarıyla initialize edildi",
        stats: {
          categories: categoriesData.length,
          products: productsData.length,
          legalPages: legalPagesData.length
        }
      });
    } catch (error) {
      console.error("Firestore init error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Firestore initialize edilirken hata oluştu" 
      });
    }
  });
  
  app.post("/api/payment/initialize", async (req: Request, res: Response) => {
    try {
      const {
        cartItems,
        buyer,
        shippingAddress,
        billingAddress,
        totalPrice
      } = req.body;

      if (!cartItems || !buyer || !shippingAddress || !billingAddress || !totalPrice) {
        return res.status(400).json({ 
          success: false, 
          error: "Eksik bilgi. Lütfen tüm alanları doldurun." 
        });
      }

      const conversationId = generateConversationId();
      const basketId = `B${Date.now()}`;

      const basketItems = cartItems.map((item: any, index: number) => ({
        id: `BI${index}${Date.now()}`,
        name: item.name,
        category1: item.category || "Ev Tekstili",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toFixed(2)
      }));

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        price: totalPrice.toFixed(2),
        paidPrice: totalPrice.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        basketId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/callback`,
        enabledInstallments: [1, 2, 3, 6, 9, 12],
        buyer: {
          id: buyer.id || `BUY${Date.now()}`,
          name: buyer.firstName,
          surname: buyer.lastName,
          gsmNumber: buyer.phone,
          email: buyer.email,
          identityNumber: buyer.identityNumber || "11111111111",
          registrationAddress: billingAddress.address,
          ip: req.ip || "85.34.78.112",
          city: billingAddress.city,
          country: "Turkey",
          zipCode: billingAddress.zipCode || "34000"
        },
        shippingAddress: {
          contactName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          city: shippingAddress.city,
          country: "Turkey",
          address: shippingAddress.address,
          zipCode: shippingAddress.zipCode || "34000"
        },
        billingAddress: {
          contactName: `${billingAddress.firstName} ${billingAddress.lastName}`,
          city: billingAddress.city,
          country: "Turkey",
          address: billingAddress.address,
          zipCode: billingAddress.zipCode || "34000"
        },
        basketItems
      };

      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          console.error("iyzico error:", err);
          return res.status(500).json({ 
            success: false, 
            error: "Ödeme başlatılamadı. Lütfen tekrar deneyin." 
          });
        }

        if (result.status !== "success") {
          console.error("iyzico response error:", result);
          return res.status(400).json({ 
            success: false, 
            error: result.errorMessage || "Ödeme formu oluşturulamadı." 
          });
        }

        res.json({
          success: true,
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
          conversationId
        });
      });
    } catch (error) {
      console.error("Payment initialize error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sunucu hatası. Lütfen daha sonra tekrar deneyin." 
      });
    }
  });

  app.post("/api/payment/callback", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.redirect("/checkout?status=error&message=Token bulunamadı");
      }

      iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        token
      }, async (err: any, result: any) => {
        if (err) {
          console.error("iyzico retrieve error:", err);
          return res.redirect("/checkout?status=error&message=Ödeme doğrulanamadı");
        }

        if (result.status === "success" && result.paymentStatus === "SUCCESS") {
          const orderNumber = generateOrderNumber();
          const invoiceNumber = generateInvoiceNumber();
          
          res.redirect(`/checkout/success?orderNumber=${orderNumber}&invoiceNumber=${invoiceNumber}&paymentId=${result.paymentId}`);
        } else {
          const errorMessage = encodeURIComponent(result.errorMessage || "Ödeme başarısız");
          res.redirect(`/checkout?status=error&message=${errorMessage}`);
        }
      });
    } catch (error) {
      console.error("Payment callback error:", error);
      res.redirect("/checkout?status=error&message=Sunucu hatası");
    }
  });

  app.post("/api/payment/verify", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          success: false, 
          error: "Token gerekli" 
        });
      }

      iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        token
      }, (err: any, result: any) => {
        if (err) {
          console.error("iyzico verify error:", err);
          return res.status(500).json({ 
            success: false, 
            error: "Ödeme doğrulanamadı" 
          });
        }

        res.json({
          success: result.status === "success",
          paymentStatus: result.paymentStatus,
          paymentId: result.paymentId,
          paidPrice: result.paidPrice,
          currency: result.currency,
          installment: result.installment,
          cardType: result.cardType,
          cardAssociation: result.cardAssociation,
          errorMessage: result.errorMessage
        });
      });
    } catch (error) {
      console.error("Payment verify error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sunucu hatası" 
      });
    }
  });

  app.post("/api/payment/refund", async (req: Request, res: Response) => {
    try {
      const { paymentTransactionId, price } = req.body;

      if (!paymentTransactionId || !price) {
        return res.status(400).json({ 
          success: false, 
          error: "İşlem ID ve tutar gerekli" 
        });
      }

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: generateConversationId(),
        paymentTransactionId,
        price: price.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        ip: req.ip || "85.34.78.112"
      };

      iyzipay.refund.create(request, (err: any, result: any) => {
        if (err) {
          console.error("iyzico refund error:", err);
          return res.status(500).json({ 
            success: false, 
            error: "İade işlemi başarısız" 
          });
        }

        res.json({
          success: result.status === "success",
          refundId: result.paymentTransactionId,
          price: result.price,
          errorMessage: result.errorMessage
        });
      });
    } catch (error) {
      console.error("Payment refund error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sunucu hatası" 
      });
    }
  });

  app.get("/api/payment/installments", async (req: Request, res: Response) => {
    try {
      const { binNumber, price } = req.query;

      if (!binNumber || !price) {
        return res.status(400).json({ 
          success: false, 
          error: "Kart numarası ve tutar gerekli" 
        });
      }

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: generateConversationId(),
        binNumber: binNumber.toString().substring(0, 6),
        price: parseFloat(price.toString()).toFixed(2)
      };

      iyzipay.installmentInfo.retrieve(request, (err: any, result: any) => {
        if (err) {
          console.error("iyzico installment error:", err);
          return res.status(500).json({ 
            success: false, 
            error: "Taksit bilgisi alınamadı" 
          });
        }

        if (result.status !== "success") {
          return res.status(400).json({ 
            success: false, 
            error: result.errorMessage || "Taksit bilgisi alınamadı" 
          });
        }

        const installmentDetails = result.installmentDetails?.map((detail: any) => ({
          cardFamilyName: detail.cardFamilyName,
          force3ds: detail.force3ds,
          installmentPrices: detail.installmentPrices?.map((inst: any) => ({
            installmentNumber: inst.installmentNumber,
            price: inst.price,
            totalPrice: inst.totalPrice
          }))
        }));

        res.json({
          success: true,
          installmentDetails
        });
      });
    } catch (error) {
      console.error("Payment installment error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sunucu hatası" 
      });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = req.body;
      const orderNumber = generateOrderNumber();
      const invoiceNumber = generateInvoiceNumber();
      
      res.json({
        success: true,
        orderNumber,
        invoiceNumber,
        ...orderData
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sipariş oluşturulamadı" 
      });
    }
  });

  app.get("/api/orders/:orderNumber", async (req: Request, res: Response) => {
    try {
      const { orderNumber } = req.params;
      res.json({
        success: true,
        orderNumber,
        status: "pending"
      });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Sipariş bulunamadı" 
      });
    }
  });

  // Upload endpoint for ImgBB
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.IMGBB_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          success: false, 
          error: "ImgBB API anahtarı yapılandırılmamış - Lütfen admin'e iletişime geçin" 
        });
      }

      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ 
          success: false, 
          error: "Resim verisi gerekli" 
        });
      }

      const formData = new FormData();
      formData.append("image", image);
      formData.append("key", apiKey);

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ImgBB error response:", response.status, errorText);
        return res.status(500).json({ 
          success: false, 
          error: `ImgBB yükleme başarısız (${response.status}): ${errorText.substring(0, 100)}` 
        });
      }

      const data = await response.json();
      if (!data.success) {
        return res.status(500).json({ 
          success: false, 
          error: `ImgBB hatası: ${data.error?.message || "Bilinmeyen hata"}` 
        });
      }
      res.json({
        success: true,
        url: data.data.url
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        success: false, 
        error: `Yükleme hatası: ${error.message || "Bilinmeyen hata"}` 
      });
    }
  });

  // ==================== TRENDYOL INTEGRATION ====================
  
  // Initialize Trendyol on startup
  initTrendyol();

  // Get Trendyol products
  app.get("/api/trendyol/products", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 50;
      const barcode = req.query.barcode as string | undefined;
      
      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          error: "Trendyol API bilgileri yapılandırılmamış",
          message: "Admin panelinden Trendyol API ayarlarınızı kontrol edin"
        });
      }
      
      const products = await getTrendyolProducts({ page, size, barcode });
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Trendyol products error:", error);
      
      let statusCode = 500;
      let errorMessage = error.message || "Trendyol ürünleri alınamadı";
      
      if (error.message?.includes("whitelist") || error.message?.includes("IP adresi")) {
        statusCode = 403;
        errorMessage = "IP adresi Trendyol tarafından whitelist'e eklenmemiş. Trendyol ile iletişime geçin.";
      } else if (error.message?.includes("API anahtarları")) {
        statusCode = 401;
        errorMessage = "API anahtarları geçersiz. Admin panelinden ayarları kontrol edin.";
      } else if (error.response?.status === 556) {
        statusCode = 503;
        errorMessage = "Trendyol API geçici olarak erişilemez durumda. Lütfen daha sonra tekrar deneyin.";
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: error.response?.data || error.message
      });
    }
  });

  // Get product by barcode
  app.get("/api/trendyol/products/:barcode", async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      const product = await getProductByBarcode(barcode);
      res.json({ success: true, data: product });
    } catch (error: any) {
      console.error("Trendyol product error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Ürün bulunamadı" 
      });
    }
  });

  // Create product on Trendyol
  app.post("/api/trendyol/products", async (req: Request, res: Response) => {
    try {
      const productData = req.body;
      const result = await createTrendyolProduct(productData);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("Trendyol create product error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Ürün oluşturulamadı" 
      });
    }
  });

  // Update stock and price on Trendyol
  app.put("/api/trendyol/stock", async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      const result = await updateTrendyolStock(items);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("Trendyol stock update error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Stok güncellenemedi" 
      });
    }
  });

  // Get Trendyol orders
  app.get("/api/trendyol/orders", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 50;
      const status = req.query.status as string | undefined;
      
      const orders = await getTrendyolOrders({ page, size, status });
      res.json({ success: true, data: orders });
    } catch (error: any) {
      console.error("Trendyol orders error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Siparişler alınamadı" 
      });
    }
  });

  // Get Trendyol categories
  app.get("/api/trendyol/categories", async (req: Request, res: Response) => {
    try {
      const categories = await getTrendyolCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      console.error("Trendyol categories error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Kategoriler alınamadı" 
      });
    }
  });

  // Get category attributes
  app.get("/api/trendyol/categories/:categoryId/attributes", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const attributes = await getCategoryAttributes(categoryId);
      res.json({ success: true, data: attributes });
    } catch (error: any) {
      console.error("Trendyol attributes error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Özellikler alınamadı" 
      });
    }
  });

  // Get Trendyol brands
  app.get("/api/trendyol/brands", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 500;
      const brands = await getTrendyolBrands(page, size);
      res.json({ success: true, data: brands });
    } catch (error: any) {
      console.error("Trendyol brands error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Markalar alınamadı" 
      });
    }
  });

  // Get cargo companies
  app.get("/api/trendyol/cargo-companies", async (req: Request, res: Response) => {
    try {
      const companies = await getCargoCompanies();
      res.json({ success: true, data: companies });
    } catch (error: any) {
      console.error("Trendyol cargo companies error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Kargo firmaları alınamadı" 
      });
    }
  });

  // Sync product from website to Trendyol
  app.post("/api/trendyol/sync-product", async (req: Request, res: Response) => {
    try {
      const { 
        barcode, 
        title, 
        description, 
        brandId, 
        categoryId, 
        quantity, 
        listPrice, 
        salePrice, 
        images,
        attributes 
      } = req.body;
      
      const productData = {
        barcode,
        title,
        productMainId: barcode,
        brandId,
        categoryId,
        quantity,
        stockCode: barcode,
        dimensionalWeight: 1,
        description,
        currencyType: "TRY",
        listPrice,
        salePrice,
        vatRate: 18,
        cargoCompanyId: 10,
        images: images.map((url: string) => ({ url })),
        attributes: attributes || [],
      };
      
      const result = await createTrendyolProduct(productData);
      res.json({ success: true, data: result, message: "Ürün Trendyol'a gönderildi" });
    } catch (error: any) {
      console.error("Trendyol sync error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Ürün senkronizasyonu başarısız" 
      });
    }
  });

  // Admin Settings - Trendyol Configuration
  app.post("/api/admin/settings/trendyol", async (req: Request, res: Response) => {
    try {
      const { trendyolApiKey, trendyolApiSecret, trendyolSupplierId } = req.body;

      if (!trendyolApiKey || !trendyolApiSecret || !trendyolSupplierId) {
        return res.status(400).json({
          success: false,
          message: "Tüm alanlar gerekli: API Key, API Secret ve Supplier ID"
        });
      }

      // Update environment variables in process
      process.env.TRENDYOL_API_KEY = trendyolApiKey;
      process.env.TRENDYOL_API_SECRET = trendyolApiSecret;
      process.env.TRENDYOL_SUPPLIER_ID = trendyolSupplierId;

      // Save to Firebase if available
      if (db) {
        await db.collection("settings").doc("trendyol").set({
          apiKey: trendyolApiKey,
          apiSecret: trendyolApiSecret,
          supplierId: trendyolSupplierId,
          updatedAt: new Date().toISOString(),
        });
      }

      // Reinitialize Trendyol with new credentials
      initTrendyol();

      res.json({
        success: true,
        message: "Trendyol ayarları başarıyla güncellendi ve kaydedildi."
      });
    } catch (error: any) {
      console.error("Trendyol settings error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Trendyol ayarları kaydedilemedi"
      });
    }
  });

  // Get Trendyol Settings from Firebase
  app.get("/api/admin/settings/trendyol", async (req: Request, res: Response) => {
    try {
      if (db) {
        const doc = await db.collection("settings").doc("trendyol").get();
        if (doc.exists) {
          const data = doc.data();
          return res.json({
            success: true,
            data: {
              trendyolApiKey: data?.apiKey || "",
              trendyolApiSecret: data?.apiSecret || "",
              trendyolSupplierId: data?.supplierId || "",
            }
          });
        }
      }
      res.json({
        success: true,
        data: {
          trendyolApiKey: "",
          trendyolApiSecret: "",
          trendyolSupplierId: "",
        }
      });
    } catch (error: any) {
      console.error("Get Trendyol settings error:", error);
      res.status(500).json({
        success: false,
        message: "Trendyol ayarları alınamadı"
      });
    }
  });

  // Get Trendyol Products
  app.get("/api/trendyol/products", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const size = parseInt(req.query.size as string) || 50;
      
      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          message: "Trendyol API credentials not configured"
        });
      }

      const products = await getTrendyolProducts({ page, size });
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Trendyol products error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Ürünler alınamadı",
        error: error.message
      });
    }
  });

  // Get Trendyol Categories
  app.get("/api/trendyol/categories", async (req: Request, res: Response) => {
    try {
      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          message: "Trendyol API credentials not configured"
        });
      }

      const categories = await getTrendyolCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      console.error("Trendyol categories error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Kategoriler alınamadı",
        error: error.message
      });
    }
  });

  // Get Cargo Companies
  app.get("/api/trendyol/cargo-companies", async (req: Request, res: Response) => {
    try {
      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          message: "Trendyol API credentials not configured"
        });
      }

      const cargo = await getCargoCompanies();
      res.json({ success: true, data: cargo });
    } catch (error: any) {
      console.error("Cargo companies error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Kargo şirketleri alınamadı",
        error: error.message
      });
    }
  });

  // Get Trendyol Brands
  app.get("/api/trendyol/brands", async (req: Request, res: Response) => {
    try {
      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          message: "Trendyol API credentials not configured"
        });
      }

      const brands = await getTrendyolBrands();
      res.json({ success: true, data: brands });
    } catch (error: any) {
      console.error("Brands error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Markalar alınamadı",
        error: error.message
      });
    }
  });

  // Update Trendyol Product Stock
  app.put("/api/trendyol/products/:productId/stock", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!productId || quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: "Product ID ve miktar gerekli"
        });
      }

      if (!initTrendyol()) {
        return res.status(400).json({
          success: false,
          message: "Trendyol API credentials not configured"
        });
      }

      const result = await updateTrendyolStock([{ barcode: productId, quantity }]);
      res.json({
        success: true,
        data: result,
        message: "Stok güncellendi"
      });
    } catch (error: any) {
      console.error("Stock update error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Stok güncellenemedi",
        error: error.message
      });
    }
  });

  // ===== FIRESTORE API ENDPOINTS (All Collections) =====
  
  // Get all products
  app.get("/api/firestore/products", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();
      const products = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all categories
  app.get("/api/firestore/categories", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("categories").orderBy("sortOrder", "asc").get();
      const categories = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all users
  app.get("/api/firestore/users", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
      const users = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all orders
  app.get("/api/firestore/orders", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all invoices
  app.get("/api/firestore/invoices", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("invoices").orderBy("createdAt", "desc").get();
      const invoices = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all reviews
  app.get("/api/firestore/reviews", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("reviews").orderBy("createdAt", "desc").get();
      const reviews = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all support tickets
  app.get("/api/firestore/supportTickets", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("supportTickets").orderBy("createdAt", "desc").get();
      const tickets = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: tickets });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all favorites
  app.get("/api/firestore/favorites", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("favorites").orderBy("createdAt", "desc").get();
      const favorites = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: favorites });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all carts
  app.get("/api/firestore/carts", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("carts").orderBy("createdAt", "desc").get();
      const carts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: carts });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get all legal pages
  app.get("/api/firestore/legalPages", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("legalPages").orderBy("order", "asc").get();
      const pages = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: pages });
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get hero banners
  app.get("/api/firestore/banners", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const doc = await db.collection("settings").doc("banners").get();
      if (doc.exists) {
        const data = doc.data();
        const banners = (data?.items || []).sort((a: any, b: any) => a.order - b.order);
        res.json({ success: true, data: banners });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error: any) {
      res.json({ success: true, data: [] });
    }
  });

  // Get product by ID
  app.get("/api/firestore/products/:productId", async (req: Request, res: Response) => {
    try {
      if (!db) return res.status(404).json({ error: "Not found" });
      const doc = await db.collection("products").doc(req.params.productId).get();
      if (doc.exists) {
        res.json({ id: doc.id, ...doc.data() });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user by ID
  app.get("/api/firestore/users/:userId", async (req: Request, res: Response) => {
    try {
      if (!db) return res.status(404).json({ error: "Not found" });
      const doc = await db.collection("users").doc(req.params.userId).get();
      if (doc.exists) {
        res.json({ id: doc.id, ...doc.data() });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // Get all support tickets
  app.get("/api/firestore/supportTickets", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("supportTickets").orderBy("createdAt", "desc").get();
      const tickets = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: tickets });
    } catch (error: any) {
      console.error("Support tickets error:", error.message);
      res.json({ success: true, data: [] });
    }
  });

  // Get all favorites
  app.get("/api/firestore/favorites", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("favorites").orderBy("createdAt", "desc").get();
      const favorites = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: favorites });
    } catch (error: any) {
      console.error("Favorites error:", error.message);
      res.json({ success: true, data: [] });
    }
  });

  // Get all carts
  app.get("/api/firestore/carts", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("carts").orderBy("createdAt", "desc").get();
      const carts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: carts });
    } catch (error: any) {
      console.error("Carts error:", error.message);
      res.json({ success: true, data: [] });
    }
  });

  // Get all legal pages
  app.get("/api/firestore/legalPages", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const snapshot = await db.collection("legalPages").orderBy("order", "asc").get();
      const pages = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: pages });
    } catch (error: any) {
      console.error("Legal pages error:", error.message);
      res.json({ success: true, data: [] });
    }
  });

  // Get hero banners
  app.get("/api/firestore/banners", async (req: Request, res: Response) => {
    try {
      if (!db) return res.json({ success: true, data: [] });
      const doc = await db.collection("settings").doc("banners").get();
      if (doc.exists) {
        const data = doc.data();
        const banners = (data?.items || []).sort((a: any, b: any) => a.order - b.order);
        res.json({ success: true, data: banners });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error: any) {
      console.error("Banners error:", error.message);
      res.json({ success: true, data: [] });
    }
  });

  // Get product by ID
  app.get("/api/firestore/products/:productId", async (req: Request, res: Response) => {
    try {
      if (!db) return res.status(404).json({ error: "Not found" });
      const doc = await db.collection("products").doc(req.params.productId).get();
      if (doc.exists) {
        res.json({ id: doc.id, ...doc.data() });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user by ID
  app.get("/api/firestore/users/:userId", async (req: Request, res: Response) => {
    try {
      if (!db) return res.status(404).json({ error: "Not found" });
      const doc = await db.collection("users").doc(req.params.userId).get();
      if (doc.exists) {
        res.json({ id: doc.id, ...doc.data() });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
