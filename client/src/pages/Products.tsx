import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Filter, X, ChevronDown, Grid3X3, LayoutList, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/products/ProductCard";
import { getProducts, getCategories } from "@/lib/firebase";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [tempMinPrice, setTempMinPrice] = useState<string | number>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string | number>("");
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: 0,
    maxPrice: 10000,
    fabricTypes: [] as string[],
    colors: [] as string[],
    sortBy: "newest",
  });

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
  };

  useEffect(() => {
    setSearchInput(filters.search);
  }, []);

  // Calculate max price from products
  const maxPriceInProducts = products.length > 0 
    ? Math.max(...products.map(p => p.discountPrice || p.price), 10000)
    : 10000;
  const dynamicMaxPrice = Math.ceil(maxPriceInProducts / 1000) * 1000;

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(productsData.filter(p => p.isActive));
        setCategories(categoriesData.filter(c => c.isActive));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate dynamic min/max from products
  const dbMinPrice = products.length > 0 ? Math.min(...products.map(p => p.discountPrice || p.price)) : 0;
  const dbMaxPrice = products.length > 0 ? Math.max(...products.map(p => p.discountPrice || p.price)) : 10000;
  const dynamicMaxPriceDb = Math.ceil(dbMaxPrice / 1000) * 1000;
  const dynamicMinPriceDb = Math.floor(dbMinPrice / 1000) * 1000;

  // Initialize temp prices and filter state on first load
  useEffect(() => {
    if (products.length > 0 && filters.maxPrice === 10000) {
      setTempMinPrice(dynamicMinPriceDb);
      setTempMaxPrice(dynamicMaxPriceDb);
      setFilters(prev => ({ 
        ...prev, 
        minPrice: dynamicMinPriceDb, 
        maxPrice: dynamicMaxPriceDb 
      }));
    }
  }, [products.length]);

  const applyPriceFilter = () => {
    let minVal = tempMinPrice === "" ? dynamicMinPriceDb : parseInt(String(tempMinPrice));
    let maxVal = tempMaxPrice === "" ? dynamicMaxPriceDb : parseInt(String(tempMaxPrice));
    
    minVal = isNaN(minVal) ? dynamicMinPriceDb : Math.max(dynamicMinPriceDb, minVal);
    maxVal = isNaN(maxVal) ? dynamicMaxPriceDb : Math.min(dynamicMaxPriceDb, maxVal);
    
    if (minVal > maxVal) {
      [minVal, maxVal] = [maxVal, minVal];
    }
    
    setFilters(prev => ({ ...prev, minPrice: minVal, maxPrice: maxVal }));
  };

  const allFabricTypes = Array.from(new Set(products.map(p => p.attributes?.fabricType).filter(Boolean)));
  const allColors = Array.from(new Set(products.map(p => p.attributes?.color).filter(Boolean)));

  const filteredProducts = products.filter(product => {
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && filters.category !== "all" && product.categoryId !== filters.category) {
      return false;
    }
    const price = product.discountPrice || product.price;
    if (price < filters.minPrice || price > filters.maxPrice) {
      return false;
    }
    if (filters.fabricTypes.length > 0 && !filters.fabricTypes.includes(product.attributes?.fabricType)) {
      return false;
    }
    if (filters.colors.length > 0 && !filters.colors.includes(product.attributes?.color)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case "price-asc":
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      case "price-desc":
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return b.rating - a.rating;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: dynamicMinPriceDb,
      maxPrice: dynamicMaxPriceDb,
      fabricTypes: [],
      colors: [],
      sortBy: "newest",
    });
    setTempMinPrice(dynamicMinPriceDb);
    setTempMaxPrice(dynamicMaxPriceDb);
  };

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.minPrice > 0,
    filters.maxPrice < 10000,
    filters.fabricTypes.length > 0,
    filters.colors.length > 0,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Arama</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Ürün ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
            data-testid="input-filter-search"
          />
          <Button 
            onClick={handleSearch}
            size="icon"
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium">Kategori</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters({ ...filters, category: value })}
        >
          <SelectTrigger className="mt-2" data-testid="select-category">
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

      <Separator />

      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <Label className="text-sm font-bold text-foreground mb-4 block">💰 Fiyat Aralığı</Label>
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-foreground block mb-1">Min</Label>
              <Input
                type="number"
                value={tempMinPrice}
                onChange={(e) => setTempMinPrice(e.target.value)}
                onBlur={applyPriceFilter}
                onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                placeholder={String(dynamicMinPriceDb)}
                className="font-semibold"
                data-testid="input-min-price"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs font-semibold text-foreground block mb-1">Max</Label>
              <Input
                type="number"
                value={tempMaxPrice}
                onChange={(e) => setTempMaxPrice(e.target.value)}
                onBlur={applyPriceFilter}
                onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                placeholder={String(dynamicMaxPriceDb)}
                className="font-semibold"
                data-testid="input-max-price"
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-foreground bg-card p-3 rounded border border-primary/30">
            <span>💵 Min: {dynamicMinPriceDb} TL</span>
            <span>Max: {dynamicMaxPriceDb} TL 💵</span>
          </div>
        </div>
      </div>

      <Separator />

      {allFabricTypes.length > 0 && (
        <>
          <div>
            <Label className="text-sm font-medium">Kumaş Türü</Label>
            <div className="mt-3 space-y-2">
              {allFabricTypes.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`fabric-${type}`}
                    checked={filters.fabricTypes.includes(type!)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({ ...filters, fabricTypes: [...filters.fabricTypes, type!] });
                      } else {
                        setFilters({ ...filters, fabricTypes: filters.fabricTypes.filter(t => t !== type) });
                      }
                    }}
                  />
                  <Label htmlFor={`fabric-${type}`} className="text-sm font-normal cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {allColors.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Renk</Label>
          <div className="mt-3 space-y-2">
            {allColors.map((color) => (
              <div key={color} className="flex items-center gap-2">
                <Checkbox
                  id={`color-${color}`}
                  checked={filters.colors.includes(color!)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters({ ...filters, colors: [...filters.colors, color!] });
                    } else {
                      setFilters({ ...filters, colors: filters.colors.filter(c => c !== color) });
                    }
                  }}
                />
                <Label htmlFor={`color-${color}`} className="text-sm font-normal cursor-pointer">
                  {color}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearFilters} className="w-full" data-testid="button-clear-filters">
            <X className="h-4 w-4 mr-2" />
            Filtreleri Temizle
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ürünler</h1>
          <p className="text-muted-foreground mt-1">
            {filteredProducts.length} ürün bulundu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni</SelectItem>
              <SelectItem value="price-asc">Fiyat: Düşükten Yükseğe</SelectItem>
              <SelectItem value="price-desc">Fiyat: Yüksekten Düşüğe</SelectItem>
              <SelectItem value="name">İsme Göre</SelectItem>
              <SelectItem value="rating">Puana Göre</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden relative" data-testid="button-mobile-filters">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtrele
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtreler</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Card className="p-4 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Filtreler</h2>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </div>
            <FilterContent />
          </Card>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/5]" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Ürün Bulunamadı</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arama kriterlerinize uygun ürün bulunamadı. Filtreleri değiştirmeyi deneyin.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
