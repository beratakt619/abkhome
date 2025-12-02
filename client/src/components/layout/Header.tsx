import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Settings, Package, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import CartSidebar from "@/components/cart/CartSidebar";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/urunler?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const categories = [
    { name: "Nevresim Takımları", href: "/kategori/nevresim-takimlari" },
    { name: "Yastık & Kırlent", href: "/kategori/yastik-kirlent" },
    { name: "Battaniye & Pike", href: "/kategori/battaniye-pike" },
    { name: "Havlu", href: "/kategori/havlu" },
    { name: "Perde", href: "/kategori/perde" },
    { name: "Halı & Kilim", href: "/kategori/hali-kilim" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href="/" data-testid="link-home">
              <span className="text-xl font-bold text-foreground tracking-tight">
                ABK<span className="text-primary">Home</span>Design
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 w-full"
                data-testid="input-search"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link href="/favoriler">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-favorites">
                <Heart className="h-5 w-5" />
                {favoriteIds.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {favoriteIds.length}
                  </Badge>
                )}
              </Button>
            </Link>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0">
                <CartSidebar onClose={() => setCartOpen(false)} />
              </SheetContent>
            </Sheet>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                      <AvatarFallback className="text-xs">
                        {user.displayName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/hesabim" className="flex items-center gap-2 cursor-pointer" data-testid="link-account">
                      <User className="h-4 w-4" />
                      Hesabım
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/siparislerim" className="flex items-center gap-2 cursor-pointer" data-testid="link-orders">
                      <Package className="h-4 w-4" />
                      Siparişlerim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/destek" className="flex items-center gap-2 cursor-pointer" data-testid="link-support">
                      <HelpCircle className="h-4 w-4" />
                      Destek
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="link-admin">
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer" data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/giris">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button size="sm" data-testid="button-register">
                    Kayıt Ol
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 py-2 border-t border-border/50">
          {categories.map((category) => (
            <Link key={category.href} href={category.href}>
              <Button variant="ghost" size="sm" className="text-sm" data-testid={`link-category-${category.name}`}>
                {category.name}
              </Button>
            </Link>
          ))}
          <Link href="/urunler">
            <Button variant="ghost" size="sm" className="text-sm" data-testid="link-all-products">
              Tüm Ürünler
            </Button>
          </Link>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 w-full"
                data-testid="input-search-mobile"
              />
            </div>
          </form>
          <nav className="flex flex-col pb-4">
            {categories.map((category) => (
              <Link key={category.href} href={category.href} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm rounded-none h-12">
                  {category.name}
                </Button>
              </Link>
            ))}
            <Link href="/urunler" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm rounded-none h-12">
                Tüm Ürünler
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
