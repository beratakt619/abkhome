import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Loader2, Upload, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, InsertProduct } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  discountPrice: z.coerce.number().optional(),
  categoryId: z.string().min(1, "Kategori seçin"),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stok 0'dan küçük olamaz"),
  images: z.array(z.string()).default([]),
  fabricType: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  length: z.string().optional(),
  width: z.string().optional(),
  material: z.string().optional(),
  careInstructions: z.string().optional(),
  isActive: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [colorVariants, setColorVariants] = useState<Array<{ id: string; name: string; colorHex?: string; image?: string }>>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantColor, setNewVariantColor] = useState("");
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      categoryId: "",
      sku: "",
      stock: 0,
      images: [],
      fabricType: "",
      color: "",
      size: "",
      length: "",
      width: "",
      material: "",
      careInstructions: "",
      isActive: true,
      isNew: false,
      isFeatured: false,
    },
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }

    loadData();
  }, [user, isAdmin, setLocation]);

  useEffect(() => {
    if (dialogOpen) {
      const loadCategories = async () => {
        try {
          const categoriesData = await getCategories();
          setCategories(categoriesData);
        } catch (error) {
          console.error("Error loading categories:", error);
        }
      };
      loadCategories();
    }
  }, [dialogOpen]);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToImgBB(file);
        uploadedUrls.push(url);
      }
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, ...uploadedUrls]);
      toast({
        title: "Başarılı",
        description: `${uploadedUrls.length} resim yüklendi.`,
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Resim yükleme başarısız oldu";
      toast({
        title: "Hata",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setColorVariants(product.colorVariants || []);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      categoryId: product.categoryId,
      sku: product.sku || "",
      stock: product.stock,
      images: product.images || [],
      fabricType: product.attributes?.fabricType || "",
      color: product.attributes?.color || "",
      size: product.attributes?.size || "",
      length: product.attributes?.length || "",
      width: product.attributes?.width || "",
      material: product.attributes?.material || "",
      careInstructions: product.attributes?.careInstructions || "",
      isActive: product.isActive,
      isNew: product.isNew,
    });
    setDialogOpen(true);
  };

  const handleAddColorVariant = () => {
    if (!newVariantName.trim()) return;
    const newVariant = {
      id: Date.now().toString(),
      name: newVariantName,
      colorHex: newVariantColor || undefined,
    };
    setColorVariants([...colorVariants, newVariant]);
    setNewVariantName("");
    setNewVariantColor("");
  };

  const handleDeleteVariant = (variantId: string) => {
    setColorVariants(colorVariants.filter(v => v.id !== variantId));
  };

  const handleUpdateVariant = (variantId: string, field: string, value: string) => {
    setColorVariants(colorVariants.map(v => 
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Başarılı",
        description: "Ürün silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setSaving(true);
    try {
      const productData: InsertProduct = {
        name: data.name,
        description: data.description || "",
        price: data.price,
        discountPrice: data.discountPrice,
        categoryId: data.categoryId,
        sku: data.sku || "",
        stock: data.stock,
        images: data.images || [],
        attributes: {
          fabricType: data.fabricType || "",
          color: data.color || "",
          size: data.size || "",
          length: data.length,
          width: data.width,
          material: data.material,
          careInstructions: data.careInstructions,
        },
        colorVariants: colorVariants.length > 0 ? colorVariants : undefined,
        isActive: data.isActive,
        isNew: data.isNew,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({ title: "Başarılı", description: "Ürün güncellendi." });
      } else {
        await createProduct(productData);
        toast({ title: "Başarılı", description: "Ürün oluşturuldu." });
      }

      await loadData();
      setDialogOpen(false);
      setEditingProduct(null);
      setColorVariants([]);
      form.reset();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || product.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "-";
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ürün Yönetimi</h1>
          <p className="text-muted-foreground">{products.length} ürün</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setColorVariants([]);
            setNewVariantName("");
            setNewVariantColor("");
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-add-product"
              onClick={() => {
                setEditingProduct(null);
                setColorVariants([]);
                setNewVariantName("");
                setNewVariantColor("");
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ürün Adı</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-product-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} data-testid="textarea-product-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiyat (TL)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                            onFocus={(e) => e.target.select()}
                            data-testid="input-product-price" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İndirimli Fiyat (TL)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                            onFocus={(e) => e.target.select()}
                            data-testid="input-product-discount-price" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                            onFocus={(e) => e.target.select()}
                            data-testid="input-product-stock" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-category">
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Ürün Resimleri</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        data-testid="input-product-images"
                      />
                      <Button disabled={uploading} type="button" variant="outline" size="icon">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                    {form.getValues("images")?.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {form.getValues("images")?.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Ürün ${index + 1}`} className="w-full h-20 object-cover rounded" />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const images = form.getValues("images") || [];
                                form.setValue(
                                  "images",
                                  images.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Ürün Özellikleri</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="fabricType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kumaş Türü</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renk</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boyut</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uzunluk</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genişlik</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Malzeme</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="careInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bakım Talimatları</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Renk Seçenekleri</h4>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Renk adı (Örn: Kırmızı, Mavi)"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddColorVariant()}
                        data-testid="input-variant-name"
                      />
                      <Input
                        type="color"
                        value={newVariantColor}
                        onChange={(e) => setNewVariantColor(e.target.value)}
                        className="w-12"
                        data-testid="input-variant-color"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddColorVariant}
                        data-testid="button-add-variant"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {colorVariants.length > 0 && (
                      <div className="space-y-2">
                        {colorVariants.map((variant) => (
                          <div key={variant.id} className="space-y-1 p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: variant.colorHex || "#ccc" }}
                              />
                              <Input
                                value={variant.name}
                                onChange={(e) => handleUpdateVariant(variant.id, "name", e.target.value)}
                                className="flex-1 h-8 text-sm"
                                placeholder="Renk adı"
                                data-testid={`input-variant-name-${variant.id}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteVariant(variant.id)}
                                className="h-8 w-8"
                                data-testid={`button-delete-variant-${variant.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Renk Resmi</label>
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const url = await uploadToImgBB(file);
                                        handleUpdateVariant(variant.id, "image", url);
                                        toast({ title: "Başarılı", description: "Renk resmi yüklendi." });
                                      } catch {
                                        toast({ title: "Hata", description: "Resim yükleme başarısız.", variant: "destructive" });
                                      }
                                    }
                                  }}
                                  className="h-8 text-xs flex-1"
                                  data-testid={`input-variant-image-upload-${variant.id}`}
                                />
                              </div>
                              {variant.image && (
                                <div className="relative w-12 h-12 mt-1">
                                  <img src={variant.image} alt={variant.name} className="w-full h-full object-cover rounded border" />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 w-5 h-5"
                                    onClick={() => handleUpdateVariant(variant.id, "image", "")}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Aktif</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Yeni Ürün</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">Öne Çıkan</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={saving} data-testid="button-save-product">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingProduct ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı veya SKU ile ara..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-products"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                Resim Yok
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell>
                        <div>
                          {product.discountPrice ? (
                            <>
                              <span className="font-medium">{formatPrice(product.discountPrice)}</span>
                              <span className="text-xs text-muted-foreground line-through ml-1">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {product.isActive ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pasif</Badge>
                          )}
                          {product.isNew && <Badge>Yeni</Badge>}
                          {product.isFeatured && <Badge variant="outline">Öne Çıkan</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-product-${product.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
