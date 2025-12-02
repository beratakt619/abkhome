import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  Package, 
  RefreshCw, 
  Download, 
  Upload, 
  ShoppingCart, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Search,
  Loader2,
  Layers,
  Truck,
  FileText,
  MoreVertical,
  Eye,
  Printer
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createProduct, getProducts, getCategories } from "@/lib/firebase";
import type { Product, Category } from "@shared/schema";

interface TrendyolProduct {
  id?: string;
  barcode: string;
  title: string;
  productMainId: string;
  brandId: number;
  brandName?: string;
  categoryId: number;
  categoryName?: string;
  quantity: number;
  stockCode: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  images: { url: string }[];
  approved?: boolean;
  onSale?: boolean;
}

interface TrendyolOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  customerFirstName: string;
  customerLastName: string;
  orderDate: string;
  lines: any[];
}

interface TrendyolInvoice {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "cancelled";
  totalAmount: number;
  createdDate: string;
  invoiceDate?: string;
}

export default function AdminTrendyol() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [trendyolProducts, setTrendyolProducts] = useState<TrendyolProduct[]>([]);
  const [trendyolOrders, setTrendyolOrders] = useState<TrendyolOrder[]>([]);
  const [invoices, setInvoices] = useState<TrendyolInvoice[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TrendyolProduct | null>(null);
  const [importing, setImporting] = useState(false);
  const [managementData, setManagementData] = useState({ categories: [], brands: [], cargo: [] });
  const [autoInvoiceEnabled, setAutoInvoiceEnabled] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }

    loadLocalData();
    checkTrendyolConnection();
    loadAutoInvoiceStatus();
  }, [user, isAdmin, setLocation]);

  const loadAutoInvoiceStatus = async () => {
    try {
      const res = await fetch("/api/trendyol/invoice-settings");
      const data = await res.json();
      if (data.success && data.data) {
        setAutoInvoiceEnabled(data.data.autoInvoiceEnabled || false);
      }
    } catch (error) {
      console.warn("Auto invoice status load error:", error);
    }
  };

  const toggleAutoInvoice = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/trendyol/invoice-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoInvoiceEnabled: enabled }),
      });
      const result = await response.json();
      if (result.success) {
        setAutoInvoiceEnabled(enabled);
        toast({ 
          title: "Başarılı", 
          description: enabled ? "Otomatik fatura açık" : "Otomatik fatura kapalı"
        });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Ayar kaydedilemedi", variant: "destructive" });
    }
  };

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, cargoRes] = await Promise.all([
        fetch("/api/trendyol/categories").then(r => r.json()),
        fetch("/api/trendyol/brands").then(r => r.json()),
        fetch("/api/trendyol/cargo-companies").then(r => r.json()),
      ]);
      setManagementData({
        categories: catRes.success ? catRes.data?.categories || [] : [],
        brands: brandRes.success ? brandRes.data?.items || [] : [],
        cargo: cargoRes.success ? cargoRes.data || [] : [],
      });
      toast({ title: "Başarılı", description: "Veriler yüklendi" });
    } catch (error) {
      toast({ title: "Hata", description: "Veriler yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trendyol/invoices?size=50");
      const data = await response.json();
      if (data.success && data.data) {
        setInvoices(data.data.invoices || []);
        toast({ title: "Başarılı", description: "Faturalar yüklendi" });
      } else {
        toast({ title: "Hata", description: data.error || "Faturalar yüklenemedi", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Trendyol'a bağlanılamadı", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (orderId: string) => {
    try {
      const response = await fetch("/api/trendyol/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Başarılı", description: "Fatura oluşturuldu" });
        fetchInvoices();
      } else {
        toast({ title: "Hata", description: data.error || "Fatura oluşturulamadı", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "İşlem başarısız", variant: "destructive" });
    }
  };

  const loadLocalData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setLocalProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading local data:", error);
    }
  };

  const checkTrendyolConnection = async () => {
    setConnectionStatus("checking");
    try {
      const response = await fetch("/api/trendyol/products?size=1");
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
        setErrorMessage(data.error || "Bağlantı hatası");
      }
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage("Sunucu ile bağlantı kurulamadı");
    }
  };

  const fetchTrendyolProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trendyol/products?size=50");
      const data = await response.json();
      
      if (data.success && data.data?.content) {
        setTrendyolProducts(data.data.content);
        toast({
          title: "Ürünler Yüklendi",
          description: `${data.data.content.length} ürün Trendyol'dan çekildi`,
        });
      } else {
        toast({
          title: "Hata",
          description: data.error || "Ürünler yüklenemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Trendyol'a bağlanılamadı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendyolOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trendyol/orders?size=50");
      const data = await response.json();
      
      if (data.success && data.data?.content) {
        setTrendyolOrders(data.data.content);
        toast({
          title: "Siparişler Yüklendi",
          description: `${data.data.content.length} sipariş Trendyol'dan çekildi`,
        });
      } else {
        toast({
          title: "Hata",
          description: data.error || "Siparişler yüklenemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Trendyol'a bağlanılamadı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportProduct = async () => {
    if (!selectedProduct) return;
    
    setImporting(true);
    try {
      const defaultCategory = categories[0]?.id || "default";
      
      await createProduct({
        sku: selectedProduct.barcode || selectedProduct.stockCode,
        name: selectedProduct.title,
        description: `Trendyol'dan aktarıldı. Stok Kodu: ${selectedProduct.stockCode}`,
        price: selectedProduct.listPrice,
        discountPrice: selectedProduct.salePrice < selectedProduct.listPrice ? selectedProduct.salePrice : undefined,
        images: selectedProduct.images?.map(img => img.url) || [],
        categoryId: defaultCategory,
        attributes: {
          fabricType: "",
          color: "",
          size: "",
        },
        colorVariants: [],
        stock: selectedProduct.quantity,
        isActive: true,
        isNew: true,
      });

      toast({
        title: "Ürün Aktarıldı",
        description: `"${selectedProduct.title}" web sitenize eklendi`,
      });

      setImportDialogOpen(false);
      setSelectedProduct(null);
      loadLocalData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürün aktarılamadı",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const syncProductToTrendyol = async (product: Product) => {
    try {
      const response = await fetch("/api/trendyol/sync-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: product.sku,
          title: product.name,
          description: product.description,
          brandId: 0,
          categoryId: 0,
          quantity: product.stock,
          listPrice: product.price,
          salePrice: product.discountPrice || product.price,
          images: product.images,
          attributes: [],
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Ürün Gönderildi",
          description: `"${product.name}" Trendyol'a gönderildi`,
        });
      } else {
        toast({
          title: "Hata",
          description: data.error || "Ürün gönderilemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Trendyol'a bağlanılamadı",
        variant: "destructive",
      });
    }
  };

  const filteredTrendyolProducts = trendyolProducts.filter(product =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocalProducts = localProducts.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Trendyol Entegrasyonu</h1>
          <p className="text-muted-foreground">
            Trendyol ürünlerinizi yönetin ve web sitenizle senkronize edin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {connectionStatus === "checking" && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Kontrol ediliyor...
            </Badge>
          )}
          {connectionStatus === "connected" && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Bağlı
            </Badge>
          )}
          {connectionStatus === "error" && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Bağlantı Hatası
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={checkTrendyolConnection}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {connectionStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Trendyol Bağlantı Hatası</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <br />
            <span className="text-sm mt-2 block">
              Bu genellikle Cloudflare güvenlik engelinden kaynaklanır. 
              Trendyol destek ile iletişime geçerek IP adresinizi whitelist'e ekletmeniz gerekebilir.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trendyol Ürünleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendyolProducts.length}</div>
            <p className="text-xs text-muted-foreground">Trendyol'dan çekilen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Site Ürünleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localProducts.length}</div>
            <p className="text-xs text-muted-foreground">Web sitenizdeki</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trendyol Siparişleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendyolOrders.length}</div>
            <p className="text-xs text-muted-foreground">Bekleyen siparişler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Senkronize</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Her iki platformda</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="gap-1">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Yönetim</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Faturalar</span>
          </TabsTrigger>
          <TabsTrigger value="trendyol-products" className="gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Ürünler</span>
          </TabsTrigger>
          <TabsTrigger value="trendyol-orders" className="gap-1">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Siparişler</span>
          </TabsTrigger>
          <TabsTrigger value="sync-to-trendyol" className="gap-1">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Gönder</span>
          </TabsTrigger>
          <TabsTrigger value="auto-invoice" className="gap-1">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Oto Fatura</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Trendyol Yönetimi
                  </CardTitle>
                  <CardDescription>Kategoriler, Markalar ve Kargo Şirketleri</CardDescription>
                </div>
                <Button onClick={loadManagementData} disabled={loading} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium">Kategoriler</p>
                      <p className="text-2xl font-bold">{managementData.categories.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium">Markalar</p>
                      <p className="text-2xl font-bold">{managementData.brands.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium">Kargo Şirketleri</p>
                      <p className="text-2xl font-bold">{managementData.cargo.length}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Kategoriler ({managementData.categories.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {managementData.categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Kategori yüklenmedi</p>
                      ) : (
                        managementData.categories.map((cat: any, i) => (
                          <Badge key={i} variant="outline" className="block w-full text-left">
                            {cat.categoryName}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Markalar ({managementData.brands.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {managementData.brands.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Marka yüklenmedi</p>
                      ) : (
                        managementData.brands.map((brand: any, i) => (
                          <Badge key={i} variant="outline" className="block w-full text-left">
                            {brand.brandName || brand.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Kargo ({managementData.cargo.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {managementData.cargo.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Kargo yüklenmedi</p>
                      ) : (
                        managementData.cargo.map((c: any, i) => (
                          <Badge key={i} variant="outline" className="block w-full text-left">
                            {c.shipmentProviderName}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Faturalar
                  </CardTitle>
                  <CardDescription>Trendyol siparişlerine ait faturalar</CardDescription>
                </div>
                <Button onClick={fetchInvoices} disabled={loading || connectionStatus !== "connected"} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Yenile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz fatura yüklenmedi</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fatura No</TableHead>
                        <TableHead>Sipariş No</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.orderNumber}</TableCell>
                          <TableCell>{new Date(invoice.createdDate).toLocaleDateString("tr-TR")}</TableCell>
                          <TableCell className="font-medium">{invoice.totalAmount.toFixed(2)} TL</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Yazdır
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-invoice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Otomatik Fatura Kesme
              </CardTitle>
              <CardDescription>Siparişler otomatik olarak faturalansın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Otomatik Fatura Kesme</p>
                  <p className="text-sm text-muted-foreground">Trendyol siparişleri otomatik faturala</p>
                </div>
                <Button 
                  variant={autoInvoiceEnabled ? "default" : "outline"}
                  onClick={() => toggleAutoInvoice(!autoInvoiceEnabled)}
                >
                  {autoInvoiceEnabled ? "Aç" : "Kapat"}
                </Button>
              </div>
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Özellikler:</p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Sipariş onaylandığında otomatik fatura</li>
                  <li>✓ Email ile fatura gönderimi</li>
                  <li>✓ Fatura numaralandırması otomatik</li>
                  <li>✓ Düşük stok uyarıları</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trendyol-products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Trendyol'daki Ürünleriniz</CardTitle>
                  <CardDescription>
                    Trendyol mağazanızdaki ürünleri görüntüleyin ve web sitenize aktarın
                  </CardDescription>
                </div>
                <Button onClick={fetchTrendyolProducts} disabled={loading || connectionStatus !== "connected"}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Ürünleri Çek
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ürün ara (isim veya barkod)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : trendyolProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz Trendyol ürünü yüklenmedi</p>
                  <p className="text-sm">Yukarıdaki "Ürünleri Çek" butonuna tıklayın</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Görsel</TableHead>
                        <TableHead>Ürün Adı</TableHead>
                        <TableHead>Barkod</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrendyolProducts.map((product) => (
                        <TableRow key={product.barcode}>
                          <TableCell>
                            {product.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {product.title}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.barcode}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{product.salePrice?.toFixed(2)} TL</span>
                              {product.listPrice > product.salePrice && (
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  {product.listPrice?.toFixed(2)} TL
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                              {product.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.approved ? (
                              <Badge variant="default" className="bg-green-600">Onaylı</Badge>
                            ) : (
                              <Badge variant="secondary">Beklemede</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setImportDialogOpen(true);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Siteye Aktar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trendyol-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Trendyol Siparişleri</CardTitle>
                  <CardDescription>
                    Trendyol'dan gelen siparişleri takip edin
                  </CardDescription>
                </div>
                <Button onClick={fetchTrendyolOrders} disabled={loading || connectionStatus !== "connected"}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Siparişleri Çek
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : trendyolOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz Trendyol siparişi yüklenmedi</p>
                  <p className="text-sm">Yukarıdaki "Siparişleri Çek" butonuna tıklayın</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sipariş No</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trendyolOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            {order.customerFirstName} {order.customerLastName}
                          </TableCell>
                          <TableCell>
                            {new Date(order.orderDate).toLocaleDateString("tr-TR")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.totalPrice?.toFixed(2)} TL
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === "Created" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-to-trendyol" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Web Sitesi Ürünlerini Trendyol'a Gönder</CardTitle>
              <CardDescription>
                Web sitenizdeki ürünleri Trendyol mağazanıza gönderin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ürün ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {localProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Web sitenizde henüz ürün yok</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Görsel</TableHead>
                        <TableHead>Ürün Adı</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocalProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.sku}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{product.price?.toFixed(2)} TL</span>
                              {product.discountPrice && product.discountPrice < product.price && (
                                <span className="text-sm text-green-600 ml-2">
                                  {product.discountPrice?.toFixed(2)} TL
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncProductToTrendyol(product)}
                              disabled={connectionStatus !== "connected"}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Trendyol'a Gönder
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürünü Web Sitesine Aktar</DialogTitle>
            <DialogDescription>
              Bu ürün Trendyol'dan web sitenize aktarılacak
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                {selectedProduct.images?.[0]?.url && (
                  <img
                    src={selectedProduct.images[0].url}
                    alt={selectedProduct.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{selectedProduct.title}</h3>
                  <p className="text-sm text-muted-foreground">Barkod: {selectedProduct.barcode}</p>
                  <p className="text-sm text-muted-foreground">Stok: {selectedProduct.quantity}</p>
                  <p className="font-medium mt-2">{selectedProduct.salePrice?.toFixed(2)} TL</p>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ürün web sitenize eklenecek. Kategori ve diğer detayları daha sonra düzenleyebilirsiniz.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleImportProduct} disabled={importing}>
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ürünü Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
