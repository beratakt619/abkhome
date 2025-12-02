import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, Shield, RefreshCcw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getProductById, getProductBySku, getReviewsByProduct, getProductsByCategory, updateProduct } from "@/lib/firebase";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Review } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const params = useParams();
  const productSku = params.sku as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorVariant, setSelectedColorVariant] = useState<string | null>(null);

  const { addToCart, loading: cartLoading } = useCart();
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadProduct = async () => {
      setLoading(true);
      try {
        const productData = await getProductBySku(productSku);
        if (productData) {
          setProduct(productData);
          
          const [reviewsData, relatedData] = await Promise.all([
            getReviewsByProduct(productData.id),
            getProductsByCategory(productData.categoryId),
          ]);
          
          setReviews(reviewsData);
          setRelatedProducts(relatedData.filter(p => p.id !== productData.id).slice(0, 4));
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (productSku) {
      loadProduct();
    }
  }, [productSku]);

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColorVariant]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity, {
      fabricType: product.attributes.fabricType,
      color: product.attributes.color,
      size: product.attributes.size,
    }, selectedColorVariant || undefined);
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    await toggleFavorite(product.id);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Ürün Bulunamadı</h1>
        <p className="text-muted-foreground mb-8">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Button asChild>
          <Link href="/urunler">Ürünlere Dön</Link>
        </Button>
      </div>
    );
  }

  const favorite = isFavorite(product.id);
  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const getDisplayImages = () => {
    if (selectedColorVariant && product.colorVariants) {
      const variant = product.colorVariants.find(v => v.id === selectedColorVariant);
      if (variant?.image) {
        return [variant.image, ...product.images];
      }
    }
    return product.images?.length > 0 ? product.images : ["https://via.placeholder.com/600x750?text=No+Image"];
  };
  
  const images = getDisplayImages();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-4 bg-gradient-to-r from-primary/10 to-transparent border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground slide-up">
            <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/urunler" className="hover:text-foreground">Ürünler</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12 slide-up">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted card-3d glass">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x750?text=Image+Error";
                }}
              />
              
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-primary text-primary-foreground neon-glow">Yeni</Badge>
                )}
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="glow-box">%{discountPercentage} İndirim</Badge>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all glass hover:scale-110",
                      selectedImage === index ? "border-primary glow-box" : "border-transparent"
                    )}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img 
                      src={image} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x80?text=No+Image";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="slide-up">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground neon-glow mb-2">{product.name}</h1>
              
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-5 w-5",
                          star <= product.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    ({product.reviewCount} değerlendirme)
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-4 bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border border-primary/20">
                {product.discountPrice ? (
                  <>
                    <span className="text-5xl md:text-6xl font-black text-primary neon-glow price-discount">
                      {formatPrice(product.discountPrice)}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-lg text-muted-foreground line-through price-original">
                        {formatPrice(product.price)}
                      </span>
                      <Badge className="bg-red-500/90 text-white w-fit">
                        %{Math.round(((product.price - product.discountPrice) / product.price) * 100)} İndirim
                      </Badge>
                    </div>
                  </>
                ) : (
                  <span className="text-5xl md:text-6xl font-black text-foreground neon-glow price-display">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              {product.attributes?.fabricType && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kumaş Türü</span>
                  <span className="font-medium">{product.attributes.fabricType}</span>
                </div>
              )}
              {product.attributes?.color && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Renk</span>
                  <span className="font-medium">{product.attributes.color}</span>
                </div>
              )}
              {product.attributes?.size && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Boyut</span>
                  <span className="font-medium">{product.attributes.size}</span>
                </div>
              )}
              {product.attributes?.length && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Uzunluk</span>
                  <span className="font-medium">{product.attributes.length}</span>
                </div>
              )}
            </div>

            <Separator />

            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Renk Seçenekleri</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedColorVariant(null)}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all text-center flex-shrink-0",
                      selectedColorVariant === null
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    data-testid="button-color-main"
                    title="Ana Renk"
                  >
                    <div className="w-10 h-10 rounded mx-auto mb-1 border flex items-center justify-center bg-muted">
                      <X className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-xs text-foreground">Ana Renk</span>
                  </button>

                  {product.colorVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedColorVariant(variant.id)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all text-center flex-shrink-0",
                        selectedColorVariant === variant.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      data-testid={`button-color-variant-${variant.id}`}
                    >
                      <div
                        className="w-10 h-10 rounded mx-auto mb-1 border"
                        style={{ backgroundColor: variant.colorHex || "#ccc" }}
                      />
                      <span className="text-xs text-foreground">{variant.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Adet:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value > 0 && value <= product.stock) {
                        setQuantity(value);
                      }
                    }}
                    onFocus={(e) => {
                      e.target.select();
                      setTimeout(() => e.target.value = "", 0);
                    }}
                    className="w-20 text-center h-10"
                    data-testid="input-quantity"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  (Stok: {product.stock})
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 glow-box"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={cartLoading || product.stock === 0}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock === 0 ? "Stokta Yok" : "Sepete Ekle"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  className={cn(favorite && "text-red-500")}
                  data-testid="button-toggle-favorite"
                >
                  <Heart className={cn("h-5 w-5", favorite && "fill-current")} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="glass">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Truck className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Ücretsiz Kargo</span>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <Shield className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Güvenli Ödeme</span>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <RefreshCcw className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Kolay İade</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent glass">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Açıklama
            </TabsTrigger>
            <TabsTrigger
              value="specifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Özellikler
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Değerlendirmeler ({reviews.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6 slide-up">
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {product.description || "Bu ürün için açıklama bulunmamaktadır."}
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6 slide-up">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {product.attributes?.fabricType && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Kumaş Türü</span>
                    <span className="font-medium">{product.attributes.fabricType}</span>
                  </div>
                )}
                {product.attributes?.material && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Malzeme</span>
                    <span className="font-medium">{product.attributes.material}</span>
                  </div>
                )}
                {product.attributes?.color && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Renk</span>
                    <span className="font-medium">{product.attributes.color}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {product.attributes?.size && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Boyut</span>
                    <span className="font-medium">{product.attributes.size}</span>
                  </div>
                )}
                {product.attributes?.length && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Uzunluk</span>
                    <span className="font-medium">{product.attributes.length}</span>
                  </div>
                )}
                {product.attributes?.width && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Genişlik</span>
                    <span className="font-medium">{product.attributes.width}</span>
                  </div>
                )}
              </div>
            </div>
            {product.attributes?.careInstructions && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Bakım Talimatları</h4>
                <p className="text-muted-foreground">{product.attributes.careInstructions}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="mt-6 slide-up">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.userName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  )}
                                />
                              ))}
                            </div>
                            {review.isVerifiedPurchase && (
                              <Badge variant="secondary" className="text-xs">Doğrulanmış Alışveriş</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Henüz değerlendirme yapılmamış.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {relatedProducts.length > 0 && (
          <section className="py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 neon-glow slide-up">İlgili Ürünler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
