import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Truck, Shield, HeadphonesIcon, RefreshCcw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/products/ProductCard";
import { getProducts, getCategories, getHeroBanners } from "@/lib/firebase";
import type { Product, Category, HeroBanner } from "@shared/schema";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [autoPlayTimer, setAutoPlayTimer] = useState<NodeJS.Timeout | null>(null);
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        const [productsData, categoriesData, bannersData] = await Promise.all([
          getProducts(),
          getCategories(),
          getHeroBanners(),
        ]);
        setProducts(productsData.filter(p => p.isActive).slice(0, 8));
        setCategories(categoriesData.filter(c => c.isActive).slice(0, 6));
        setBanners(bannersData.filter(b => b.isActive).sort((a, b) => a.order - b.order));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const startAutoPlay = () => {
      const timer = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      setAutoPlayTimer(timer);
    };

    startAutoPlay();
    return () => {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    };
  }, [banners]);

  const nextBanner = () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleImageLoad = (imageId: string) => {
    setImageStates((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  const features = [
    {
      icon: Truck,
      title: "Ücretsiz Kargo",
      description: "500 TL üzeri siparişlerde",
    },
    {
      icon: Shield,
      title: "Güvenli Ödeme",
      description: "256-bit SSL şifreleme",
    },
    {
      icon: RefreshCcw,
      title: "Kolay İade",
      description: "14 gün içinde ücretsiz iade",
    },
    {
      icon: HeadphonesIcon,
      title: "7/24 Destek",
      description: "Her zaman yanınızdayız",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Modern Design */}
      {banners.length > 0 ? (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="relative h-full w-full">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentBannerIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={banner.images[0]}
                  alt={banner.title || `Banner ${index + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-500"
                  onLoad={() => handleImageLoad(`banner-${banner.id}`)}
                  style={{ opacity: imageStates[`banner-${banner.id}`] ? 1 : 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                {(banner.title || banner.description || banner.ctaText) && (
                  <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                    <div className="max-w-xl text-white slide-up">
                      {banner.title && (
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight neon-glow">
                          {banner.title}
                        </h1>
                      )}
                      {banner.description && (
                        <p className="text-lg md:text-xl mb-8 text-white/90">
                          {banner.description}
                        </p>
                      )}
                      {banner.ctaText && banner.ctaLink && (
                        <Button size="lg" asChild className="group glow-box" data-testid={`button-banner-cta-${index}`}>
                          <Link href={banner.ctaLink}>
                            {banner.ctaText}
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {banners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-110"
                onClick={prevBanner}
                data-testid="button-banner-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-110"
                onClick={nextBanner}
                data-testid="button-banner-next"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/70"
                    }`}
                    onClick={() => setCurrentBannerIndex(index)}
                    data-testid={`button-banner-dot-${index}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Features Section */}
      <section className="py-8 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={feature.title} className="flex items-center gap-3 slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 glow-box transition-all hover:scale-110">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="slide-up">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground neon-glow">Kategoriler</h2>
              <p className="text-muted-foreground mt-1">İhtiyacınıza uygun kategoriyi seçin</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/kategoriler" data-testid="link-all-categories">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden card-3d">
                  <Skeleton className="aspect-square" />
                </Card>
              ))
            ) : categories.length > 0 ? (
              categories.map((category, idx) => (
                <Link key={category.id} href={`/urunler?category=${category.id}`} className="slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <Card className="group overflow-hidden hover-elevate card-3d transition-all duration-500 slide-up" style={{ animationDelay: `${idx * 50}ms` }} data-testid={`category-card-${category.id}`}>
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-120 group-hover:rotate-3"
                      onLoad={() => handleImageLoad(`category-${category.id}`)}
                      style={{ opacity: imageStates[`category-${category.id}`] ? 1 : 0 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 glass opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <h3 className="font-medium text-white text-sm text-center group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Kategori bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="slide-up">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground neon-glow">Öne Çıkan Ürünler</h2>
              <p className="text-muted-foreground mt-1">En çok tercih edilen ürünlerimiz</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/urunler" data-testid="link-all-products-home">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden card-3d">
                  <Skeleton className="aspect-[4/5]" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, idx) => (
                <div key={product.id} style={{ animation: `slide-up 0.6s ease-out ${idx * 50}ms both` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Henüz ürün eklenmemiş.</p>
              <Button asChild>
                <Link href="/urunler">Ürünlere Göz At</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground glass glow-box slide-up">
            <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-primary-foreground/80">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Yeni Sezon</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 neon-glow">
                  Yeni Sezon Ürünleri
                </h2>
                <p className="text-primary-foreground/90 max-w-md">
                  En yeni koleksiyonumuzu keşfedin. Evinizi yenileyin, tarzınızı yansıtın.
                </p>
              </div>
              <Button size="lg" variant="secondary" asChild className="group">
                <Link href="/urunler?filter=new" data-testid="button-new-products">
                  Yeni Ürünleri Gör
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
