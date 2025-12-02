import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Package, Layers, Truck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function TrendyolDashboard() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cargoCompanies, setCargoCompanies] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes, cargoRes, brandsRes] = await Promise.all([
        fetch("/api/trendyol/products?size=100").then(r => r.json()),
        fetch("/api/trendyol/categories").then(r => r.json()),
        fetch("/api/trendyol/cargo-companies").then(r => r.json()),
        fetch("/api/trendyol/brands?page=0&size=100").then(r => r.json()),
      ]);

      if (productsRes.success) setProducts(productsRes.data?.items || []);
      if (categoriesRes.success) setCategories(categoriesRes.data?.categories || []);
      if (cargoRes.success) setCargoCompanies(cargoRes.data || []);
      if (brandsRes.success) setBrands(brandsRes.data?.items || []);

      toast({
        title: "Başarılı",
        description: "Trendyol verileri yüklendi"
      });
    } catch (err: any) {
      const errorMsg = err.message || "Veriler yüklenemedi";
      setError(errorMsg);
      toast({
        title: "Hata",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Bağlantı Hatası</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                💡 İpucu: Trendyol'a bağlanmak için lokal ortamda çalıştırın veya Trendyol support'a IP whitelist için başvurun.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trendyol Yönetimi</h2>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Ürünler ({products.length})</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Kategoriler ({categories.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cargo" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Kargo ({cargoCompanies.length})</span>
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Markalar ({brands.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Ürünleriniz</CardTitle>
              <CardDescription>Trendyol'daki tüm ürünleriniz</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {products.map((product: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{product.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">ID: {product.productId}</Badge>
                          <Badge className="bg-green-100 text-green-800">Stok: {product.quantity}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">{product.currencyType}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.salePrice} TL</p>
                        <p className="text-xs text-muted-foreground">{product.barcode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Ürün bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Kategoriler</CardTitle>
              <CardDescription>Mevcut ürün kategorileri</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length > 0 ? (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto">
                  {categories.map((cat: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{cat.categoryName}</p>
                        <p className="text-xs text-muted-foreground">ID: {cat.categoryId}</p>
                      </div>
                      <Badge variant="outline">{cat.categoryStatus || "Aktif"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Kategori bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargo">
          <Card>
            <CardHeader>
              <CardTitle>Kargo Şirketleri</CardTitle>
              <CardDescription>Müsait kargo şirketleri</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : cargoCompanies.length > 0 ? (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto">
                  {cargoCompanies.map((cargo: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{cargo.shipmentProviderName}</p>
                        <p className="text-xs text-muted-foreground">ID: {cargo.shipmentProviderId}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">Aktif</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Kargo şirketi bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle>Markalar</CardTitle>
              <CardDescription>Sistemdeki marka listesi</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : brands.length > 0 ? (
                <div className="grid gap-3 max-h-[600px] overflow-y-auto">
                  {brands.map((brand: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{brand.brandName || brand.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {brand.brandId || brand.id}</p>
                      </div>
                      <Badge variant="outline">Katalog</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Marka bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
