import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp, addDoc } from "firebase/firestore";
import type { User, Product, Category, Cart, Favorites, Order, Invoice, SupportTicket, Review, LegalPage, SiteSettings, Address, CartItem, SupportMessage, HeroBanner, InsertHeroBanner } from "@shared/schema";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? "✓ Set" : "✗ Missing",
  projectId: firebaseConfig.projectId ? "✓ Set" : "✗ Missing",
  appId: firebaseConfig.appId ? "✓ Set" : "✗ Missing",
});

let app: any, auth: any, db: any;
let isFirebaseInitialized = false;

// Mock implementations for when Firebase isn't available
const mockDb = {
  mock: true,
  async query() { return []; },
  async getDoc() { return null; },
  async getDocs() { return { docs: [] }; },
};

const mockAuth = { 
  currentUser: null,
  onAuthStateChanged: (callback: any) => callback(null),
  signOut: () => Promise.resolve(),
  mock: true,
};

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebase config incomplete - check .env.local file");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log("✅ Firebase initialized successfully");
} catch (error: any) {
  console.error("❌ Firebase initialization error:", error.message);
  console.warn("⚠️ Using mock Firebase for development");
  auth = mockAuth;
  db = mockDb;
}

const googleProvider = new GoogleAuthProvider();

// ==================== AUTH FUNCTIONS ====================
export const signInWithGoogle = async () => {
  if (!auth || auth.mock) {
    console.warn("Firebase not available - using mock auth");
    return { uid: "mock-user", email: "demo@example.com" };
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Helper to remove undefined values from objects
function cleanData(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// ==================== USER FUNCTIONS ====================
export const createUserProfile = async (userId: string, data: Partial<User>) => {
  const userRef = doc(db, "users", userId);
  const now = new Date().toISOString();
  const profileData = cleanData({
    id: userId,
    email: data.email || "",
    displayName: data.displayName || "User",
    photoURL: data.photoURL || "",
    phone: data.phone,
    role: data.role || "customer",
    addresses: data.addresses || [],
    createdAt: now,
    updatedAt: now,
  });
  
  await setDoc(userRef, profileData);
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  const userRef = doc(db, "users", userId);
  const updateData = cleanData({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(userRef, updateData);
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => doc.data() as User);
};

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
};

// ==================== PRODUCT FUNCTIONS ====================
export const getProducts = async (): Promise<Product[]> => {
  try {
    if (!isFirebaseInitialized || db.mock) {
      // Use backend API instead
      const response = await fetch("/api/firestore/products");
      const data = await response.json();
      return data.data || [];
    }
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.warn("Fallback to API for products:", error);
    try {
      const response = await fetch("/api/firestore/products");
      const data = await response.json();
      return data.data || [];
    } catch (apiError) {
      console.error("Products API error:", apiError);
      return [];
    }
  }
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    return { id: productSnap.id, ...productSnap.data() } as Product;
  }
  return null;
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("sku", "==", sku));
  const snapshot = await getDocs(q);
  if (snapshot.docs.length > 0) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  }
  return null;
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("categoryId", "==", categoryId), where("isActive", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const createProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount">) => {
  const productsRef = collection(db, "products");
  const now = new Date().toISOString();
  const docRef = await addDoc(productsRef, {
    ...product,
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateProduct = async (productId: string, data: Partial<Product>) => {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, cleanData({
    ...data,
    updatedAt: new Date().toISOString(),
  }));
};

export const deleteProduct = async (productId: string) => {
  const productRef = doc(db, "products", productId);
  await deleteDoc(productRef);
};

// ==================== CATEGORY FUNCTIONS ====================
export const getCategories = async (): Promise<Category[]> => {
  try {
    if (!isFirebaseInitialized || db.mock) {
      // Use backend API instead
      const response = await fetch("/api/firestore/categories");
      const data = await response.json();
      return data.data || [];
    }
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.warn("Fallback to API for categories:", error);
    try {
      const response = await fetch("/api/firestore/categories");
      const data = await response.json();
      return data.data || [];
    } catch (apiError) {
      console.error("Categories API error:", apiError);
      return [];
    }
  }
};

export const getCategoryById = async (categoryId: string): Promise<Category | null> => {
  const categoryRef = doc(db, "categories", categoryId);
  const categorySnap = await getDoc(categoryRef);
  if (categorySnap.exists()) {
    return { id: categorySnap.id, ...categorySnap.data() } as Category;
  }
  return null;
};

export const createCategory = async (category: Omit<Category, "id" | "createdAt">) => {
  const categoriesRef = collection(db, "categories");
  const now = new Date().toISOString();
  const docRef = await addDoc(categoriesRef, {
    ...category,
    createdAt: now,
  });
  return docRef.id;
};

export const updateCategory = async (categoryId: string, data: Partial<Category>) => {
  const categoryRef = doc(db, "categories", categoryId);
  await updateDoc(categoryRef, cleanData(data));
};

export const deleteCategory = async (categoryId: string) => {
  const categoryRef = doc(db, "categories", categoryId);
  await deleteDoc(categoryRef);
};

// ==================== CART FUNCTIONS ====================
export const getCart = async (userId: string): Promise<Cart | null> => {
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  if (cartSnap.exists()) {
    return cartSnap.data() as Cart;
  }
  return null;
};

export const updateCart = async (userId: string, items: CartItem[]) => {
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    id: userId,
    userId,
    items,
    updatedAt: new Date().toISOString(),
  });
};

export const clearCart = async (userId: string) => {
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    id: userId,
    userId,
    items: [],
    updatedAt: new Date().toISOString(),
  });
};

// ==================== FAVORITES FUNCTIONS ====================
export const getFavorites = async (userId: string): Promise<Favorites | null> => {
  const favRef = doc(db, "favorites", userId);
  const favSnap = await getDoc(favRef);
  if (favSnap.exists()) {
    return favSnap.data() as Favorites;
  }
  return null;
};

export const updateFavorites = async (userId: string, productIds: string[]) => {
  const favRef = doc(db, "favorites", userId);
  await setDoc(favRef, {
    id: userId,
    userId,
    productIds,
    updatedAt: new Date().toISOString(),
  });
};

export const toggleFavorite = async (userId: string, productId: string) => {
  const favorites = await getFavorites(userId);
  const productIds = favorites?.productIds || [];
  const index = productIds.indexOf(productId);
  if (index > -1) {
    productIds.splice(index, 1);
  } else {
    productIds.push(productId);
  }
  await updateFavorites(userId, productIds);
  return productIds;
};

// ==================== ORDER FUNCTIONS ====================
const generateOrderNumber = () => {
  const prefix = "ABK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const createOrder = async (orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">) => {
  const ordersRef = collection(db, "orders");
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();
  const docRef = await addDoc(ordersRef, {
    ...orderData,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, orderNumber };
};

export const getOrders = async (): Promise<Order[]> => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    return { id: orderSnap.id, ...orderSnap.data() } as Order;
  }
  return null;
};

export const updateOrder = async (orderId: string, data: Partial<Order>) => {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteOrder = async (orderId: string) => {
  const orderRef = doc(db, "orders", orderId);
  await deleteDoc(orderRef);
};

// ==================== INVOICE FUNCTIONS ====================
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `FTR${year}${timestamp}`;
};

export const createInvoice = async (invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">) => {
  const invoicesRef = collection(db, "invoices");
  const now = new Date().toISOString();
  const invoiceNumber = generateInvoiceNumber();
  const docRef = await addDoc(invoicesRef, {
    ...invoiceData,
    invoiceNumber,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, invoiceNumber };
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const invoicesRef = collection(db, "invoices");
  const q = query(invoicesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
};

export const getInvoicesByUser = async (userId: string): Promise<Invoice[]> => {
  const invoicesRef = collection(db, "invoices");
  const q = query(invoicesRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
};

export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  const invoiceRef = doc(db, "invoices", invoiceId);
  const invoiceSnap = await getDoc(invoiceRef);
  if (invoiceSnap.exists()) {
    return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
  }
  return null;
};

export const updateInvoice = async (invoiceId: string, data: Partial<Invoice>) => {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await updateDoc(invoiceRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteInvoice = async (invoiceId: string) => {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await deleteDoc(invoiceRef);
};

// ==================== SUPPORT TICKET FUNCTIONS ====================
const generateTicketNumber = () => {
  const prefix = "TKT";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}${timestamp}`;
};

export const createSupportTicket = async (ticketData: Omit<SupportTicket, "id" | "ticketNumber" | "createdAt" | "updatedAt" | "messages">, initialMessage: string) => {
  const ticketsRef = collection(db, "supportTickets");
  const now = new Date().toISOString();
  const ticketNumber = generateTicketNumber();
  const messageId = Math.random().toString(36).substring(2);
  
  const docRef = await addDoc(ticketsRef, cleanData({
    ...ticketData,
    ticketNumber,
    messages: [{
      id: messageId,
      senderId: ticketData.userId,
      senderName: ticketData.userName,
      senderRole: "customer",
      message: initialMessage,
      createdAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  }));
  return { id: docRef.id, ticketNumber };
};

export const getSupportTickets = async (): Promise<SupportTicket[]> => {
  const ticketsRef = collection(db, "supportTickets");
  const q = query(ticketsRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
};

export const getSupportTicketsByUser = async (userId: string): Promise<SupportTicket[]> => {
  const ticketsRef = collection(db, "supportTickets");
  const q = query(ticketsRef, where("userId", "==", userId), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
};

export const getSupportTicketById = async (ticketId: string): Promise<SupportTicket | null> => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  const ticketSnap = await getDoc(ticketRef);
  if (ticketSnap.exists()) {
    return { id: ticketSnap.id, ...ticketSnap.data() } as SupportTicket;
  }
  return null;
};

export const addMessageToTicket = async (ticketId: string, message: Omit<SupportMessage, "id" | "createdAt">) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  const ticketSnap = await getDoc(ticketRef);
  if (ticketSnap.exists()) {
    const ticket = ticketSnap.data() as SupportTicket;
    const messageId = Math.random().toString(36).substring(2);
    const now = new Date().toISOString();
    const newMessage: SupportMessage = {
      ...message,
      id: messageId,
      createdAt: now,
    };
    await updateDoc(ticketRef, {
      messages: [...ticket.messages, newMessage],
      updatedAt: now,
    });
    return newMessage;
  }
  return null;
};

export const updateSupportTicket = async (ticketId: string, data: Partial<SupportTicket>) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  await updateDoc(ticketRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteSupportTicket = async (ticketId: string) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  await deleteDoc(ticketRef);
};

export const subscribeToTicket = (ticketId: string, callback: (ticket: SupportTicket | null) => void) => {
  const ticketRef = doc(db, "supportTickets", ticketId);
  return onSnapshot(ticketRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as SupportTicket);
    } else {
      callback(null);
    }
  });
};

// ==================== REVIEW FUNCTIONS ====================
export const getReviewsByProduct = async (productId: string): Promise<Review[]> => {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("productId", "==", productId), where("isApproved", "==", true), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const getAllReviews = async (): Promise<Review[]> => {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const createReview = async (reviewData: Omit<Review, "id" | "createdAt" | "updatedAt" | "isApproved" | "helpfulCount">) => {
  const reviewsRef = collection(db, "reviews");
  const now = new Date().toISOString();
  const docRef = await addDoc(reviewsRef, {
    ...reviewData,
    isApproved: false,
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateReview = async (reviewId: string, data: Partial<Review>) => {
  const reviewRef = doc(db, "reviews", reviewId);
  await updateDoc(reviewRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteReview = async (reviewId: string) => {
  const reviewRef = doc(db, "reviews", reviewId);
  await deleteDoc(reviewRef);
};

export const approveReview = async (reviewId: string, approved: boolean) => {
  const reviewRef = doc(db, "reviews", reviewId);
  await updateDoc(reviewRef, {
    isApproved: approved,
    updatedAt: new Date().toISOString(),
  });
};

// ==================== LEGAL PAGES FUNCTIONS ====================
export const getLegalPage = async (slug: string): Promise<LegalPage | null> => {
  const legalRef = collection(db, "legalPages");
  const q = query(legalRef, where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as LegalPage;
  }
  return null;
};

export const getAllLegalPages = async (): Promise<LegalPage[]> => {
  const legalRef = collection(db, "legalPages");
  const snapshot = await getDocs(legalRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalPage));
};

export const updateLegalPage = async (pageId: string, data: Partial<LegalPage>) => {
  const legalRef = doc(db, "legalPages", pageId);
  await updateDoc(legalRef, {
    ...data,
    lastUpdated: new Date().toISOString(),
  });
};

export const createLegalPage = async (pageData: Omit<LegalPage, "id">) => {
  const legalRef = collection(db, "legalPages");
  const docRef = await addDoc(legalRef, {
    ...pageData,
    lastUpdated: new Date().toISOString(),
  });
  return docRef.id;
};

// ==================== SITE SETTINGS FUNCTIONS ====================
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const settingsRef = doc(db, "settings", "site");
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as SiteSettings;
    }
  } catch (error) {
    console.warn("Error getting settings:", error);
  }
  return null;
};

export const updateSiteSettings = async (data: Partial<SiteSettings>) => {
  const settingsRef = doc(db, "settings", "site");
  await setDoc(settingsRef, {
    ...data,
    id: "site",
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

// ==================== ADMIN ROLE CHECK ====================
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const user = await getUserProfile(userId);
  return user?.role === "admin";
};

export const setUserAsAdmin = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    role: "admin",
    updatedAt: new Date().toISOString(),
  });
};

// Alias functions for compatibility
export const getAllTickets = getSupportTickets;
export const updateTicket = updateSupportTicket;
export const deleteTicket = deleteSupportTicket;
export const getLegalPages = getAllLegalPages;
export const getSettings = getSiteSettings;
export const updateSettings = updateSiteSettings;
export const getAllOrders = getOrders;
export const getAllInvoices = getInvoices;

// Settings type alias
export type Settings = SiteSettings;

// ==================== ADMIN DASHBOARD FUNCTIONS ====================
export const getAdminStats = async () => {
  const [products, orders, users, tickets] = await Promise.all([
    getProducts(),
    getOrders(),
    getAllUsers(),
    getSupportTickets(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;

  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalCustomers: users.filter(u => u.role === "customer").length,
    totalRevenue,
    todayOrders: todayOrders.length,
    todayRevenue,
    pendingOrders,
    openTickets,
  };
};

export const getRecentOrders = async (count = 5): Promise<Order[]> => {
  const orders = await getOrders();
  return orders.slice(0, count);
};

export const getPendingTickets = async (count = 5): Promise<SupportTicket[]> => {
  const tickets = await getSupportTickets();
  return tickets.filter(t => t.status === "open" || t.status === "in_progress").slice(0, count);
};

// ==================== HERO BANNERS ====================
export const getHeroBanners = async (): Promise<HeroBanner[]> => {
  try {
    if (!isFirebaseInitialized || db.mock) {
      console.warn("Firebase not initialized - returning empty banners");
      return [];
    }
    const bannersRef = doc(db, "settings", "banners");
    const bannersSnap = await getDoc(bannersRef);
    if (bannersSnap.exists()) {
      const data = bannersSnap.data();
      return (data.items || []).sort((a: any, b: any) => a.order - b.order);
    }
    return [];
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
};

export const createHeroBanner = async (data: InsertHeroBanner): Promise<string> => {
  const now = new Date().toISOString();
  const bannerId = `banner_${Date.now()}`;
  const bannerData = cleanData({
    id: bannerId,
    images: data.images,
    title: data.title,
    description: data.description,
    ctaText: data.ctaText,
    ctaLink: data.ctaLink,
    order: data.order || 0,
    isActive: data.isActive !== false,
    createdAt: now,
    updatedAt: now,
  });
  
  const bannersRef = doc(db, "settings", "banners");
  const bannersSnap = await getDoc(bannersRef);
  const currentBanners = bannersSnap.exists() ? (bannersSnap.data().items || []) : [];
  
  await setDoc(bannersRef, {
    items: [...currentBanners, bannerData],
    updatedAt: now,
  });
  
  return bannerId;
};

export const updateHeroBanner = async (bannerId: string, data: Partial<InsertHeroBanner>) => {
  const bannersRef = doc(db, "settings", "banners");
  const bannersSnap = await getDoc(bannersRef);
  const currentBanners = bannersSnap.exists() ? (bannersSnap.data().items || []) : [];
  
  const updatedBanners = currentBanners.map((banner: any) =>
    banner.id === bannerId
      ? { ...banner, ...cleanData(data), updatedAt: new Date().toISOString() }
      : banner
  );
  
  await setDoc(bannersRef, {
    items: updatedBanners,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteHeroBanner = async (bannerId: string) => {
  const bannersRef = doc(db, "settings", "banners");
  const bannersSnap = await getDoc(bannersRef);
  const currentBanners = bannersSnap.exists() ? (bannersSnap.data().items || []) : [];
  
  const updatedBanners = currentBanners.filter((banner: any) => banner.id !== bannerId);
  
  await setDoc(bannersRef, {
    items: updatedBanners,
    updatedAt: new Date().toISOString(),
  });
};
