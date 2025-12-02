import { z } from "zod";

// ==================== PRODUCTS ====================
export const colorVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorHex: z.string().optional(),
  image: z.string().optional(),
});

export const productAttributesSchema = z.object({
  fabricType: z.string(),
  color: z.string(),
  size: z.string(),
  length: z.string().optional(),
  width: z.string().optional(),
  weight: z.string().optional(),
  material: z.string().optional(),
  careInstructions: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  discountPrice: z.number().optional(),
  images: z.array(z.string()),
  categoryId: z.string(),
  attributes: productAttributesSchema,
  colorVariants: z.array(colorVariantSchema).optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertProductSchema = productSchema.omit({ id: true, createdAt: true, updatedAt: true, rating: true, reviewCount: true, isFeatured: true });

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductAttributes = z.infer<typeof productAttributesSchema>;

// ==================== CATEGORIES ====================
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export const insertCategorySchema = categorySchema.omit({ id: true, createdAt: true });

export type Category = z.infer<typeof categorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// ==================== USERS ====================
export const addressSchema = z.object({
  id: z.string(),
  title: z.string(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  district: z.string(),
  postalCode: z.string(),
  isDefault: z.boolean().default(false),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
  role: z.enum(["customer", "admin"]).default("customer"),
  addresses: z.array(addressSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Address = z.infer<typeof addressSchema>;

// ==================== CART ====================
export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  attributes: productAttributesSchema.partial(),
  selectedColorVariantId: z.string().optional(),
});

export const cartSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(cartItemSchema),
  updatedAt: z.string(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;

// ==================== FAVORITES ====================
export const favoritesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productIds: z.array(z.string()),
  updatedAt: z.string(),
});

export type Favorites = z.infer<typeof favoritesSchema>;

// ==================== ORDERS ====================
export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productImage: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  attributes: productAttributesSchema.partial(),
  selectedColorVariantId: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  userId: z.string(),
  items: z.array(orderItemSchema),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  subtotal: z.number().positive(),
  shippingCost: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "returned"]).default("pending"),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertOrderSchema = orderSchema.omit({ id: true, orderNumber: true, createdAt: true, updatedAt: true });

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;

// ==================== INVOICES ====================
export const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  userId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  billingAddress: addressSchema,
  items: z.array(orderItemSchema),
  subtotal: z.number().positive(),
  tax: z.number().min(0),
  shippingCost: z.number().min(0),
  total: z.number().positive(),
  status: z.enum(["draft", "sent", "paid", "cancelled"]).default("draft"),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertInvoiceSchema = invoiceSchema.omit({ id: true, invoiceNumber: true, createdAt: true, updatedAt: true });

export type Invoice = z.infer<typeof invoiceSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ==================== SUPPORT TICKETS ====================
export const supportMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderRole: z.enum(["customer", "admin"]),
  message: z.string(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const supportTicketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  issueType: z.enum(["shipping", "return", "product", "payment", "other"]),
  subject: z.string(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  messages: z.array(supportMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertSupportTicketSchema = supportTicketSchema.omit({ 
  id: true, 
  ticketNumber: true, 
  createdAt: true, 
  updatedAt: true,
  messages: true 
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportMessage = z.infer<typeof supportMessageSchema>;

// ==================== REVIEWS ====================
export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string(),
  comment: z.string(),
  images: z.array(z.string()).optional(),
  isVerifiedPurchase: z.boolean().default(false),
  isApproved: z.boolean().default(false),
  helpfulCount: z.number().int().min(0).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertReviewSchema = reviewSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  isApproved: true,
  helpfulCount: true 
});

export type Review = z.infer<typeof reviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// ==================== LEGAL PAGES ====================
export const legalPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  lastUpdated: z.string(),
  updatedBy: z.string().optional(),
});

export const insertLegalPageSchema = legalPageSchema.omit({ id: true });

export type LegalPage = z.infer<typeof legalPageSchema>;
export type InsertLegalPage = z.infer<typeof insertLegalPageSchema>;

// ==================== SITE SETTINGS ====================
export const siteSettingsSchema = z.object({
  id: z.string(),
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  freeShippingThreshold: z.number().optional(),
  standardShippingCost: z.number().optional(),
  expressShippingCost: z.number().optional(),
  estimatedDeliveryDays: z.number().optional(),
  iyzicoEnabled: z.boolean().optional(),
  creditCardEnabled: z.boolean().optional(),
  bankTransferEnabled: z.boolean().optional(),
  cashOnDeliveryEnabled: z.boolean().optional(),
  taxRate: z.number().default(18),
  updatedAt: z.string(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

// ==================== HERO BANNERS ====================
export const heroBannerSchema = z.object({
  id: z.string(),
  images: z.array(z.string()),
  title: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertHeroBannerSchema = heroBannerSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type HeroBanner = z.infer<typeof heroBannerSchema>;
export type InsertHeroBanner = z.infer<typeof insertHeroBannerSchema>;
