import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Heart, User, Menu, X, Search, Sun, Moon, Phone, Mail, ChevronDown, Home, Package, HelpCircle, LogOut, Settings, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTheme } from "@/contexts/ThemeContext";
import CartDrawer from "./CartDrawer";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/urunler?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/urunler", label: "Ürünler" },
    { href: "/destek", label: "Destek" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="hidden md:block bg-primary text-primary-foreground py-1">
          <div className="container mx-auto px-4 flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <a href="tel:+905551234567" className="flex items-center gap-1 hover:opacity-80">
                <Phone className="h-3 w-3" />
                <span>+90 555 123 45 67</span>
              </a>
              <a href="mailto:info@abkhomedesign.com" className="flex items-center gap-1 hover:opacity-80">
                <Mail className="h-3 w-3" />
                <span>info@abkhomedesign.com</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span>500 TL üzeri siparişlerde ücretsiz kargo!</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded font-bold text-lg">
                ABK
              </div>
              <span className="hidden sm:block font-semibold text-lg text-foreground">HomeDesign</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ürün ara..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </form>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Link href="/favorilerim">
                <Button variant="ghost" size="icon" className="relative" data-testid="button-favorites">
                  <Heart className="h-5 w-5" />
                  {favoriteIds.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {favoriteIds.length}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/hesabim")} data-testid="menu-account">
                      <User className="h-4 w-4 mr-2" />
                      Hesabım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/siparislerim")} data-testid="menu-orders">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Siparişlerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/favorilerim")} data-testid="menu-favorites">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorilerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/destek")} data-testid="menu-support">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Destek
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setLocation("/admin")} data-testid="menu-admin">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Paneli
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} data-testid="menu-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/giris">
                  <Button variant="default" size="sm" data-testid="button-login">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded font-bold">
                ABK
              </div>
              HomeDesign
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Separator />
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
            {user && (
              <>
                <Separator />
                <nav className="space-y-2">
                  <Link href="/hesabim" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Hesabım
                    </Button>
                  </Link>
                  <Link href="/siparislerim" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Siparişlerim
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Paneli
                      </Button>
                    </Link>
                  )}
                </nav>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-muted/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded font-bold">
                  ABK
                </div>
                <span className="font-semibold">HomeDesign</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Eviniz için en kaliteli ev tekstil ürünleri. Yatak örtüleri, perdeler, havlular ve daha fazlası.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Hızlı Linkler</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/urunler" className="text-muted-foreground hover:text-foreground">
                    Ürünler
                  </Link>
                </li>
                <li>
                  <Link href="/destek" className="text-muted-foreground hover:text-foreground">
                    Destek
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Yasal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/gizlilik-politikasi" className="text-muted-foreground hover:text-foreground">
                    Gizlilik Politikası
                  </Link>
                </li>
                <li>
                  <Link href="/kullanim-kosullari" className="text-muted-foreground hover:text-foreground">
                    Kullanım Koşulları
                  </Link>
                </li>
                <li>
                  <Link href="/kvkk" className="text-muted-foreground hover:text-foreground">
                    KVKK
                  </Link>
                </li>
                <li>
                  <Link href="/iade-politikasi" className="text-muted-foreground hover:text-foreground">
                    İade Politikası
                  </Link>
                </li>
                <li>
                  <Link href="/kargo-politikasi" className="text-muted-foreground hover:text-foreground">
                    Kargo Politikası
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +90 555 123 45 67
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@abkhomedesign.com
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ABKHomeDesign. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-4">
              <span>Güvenli Ödeme:</span>
              <div className="flex items-center gap-2">
                <div className="bg-background px-2 py-1 rounded border text-xs font-medium">iyzico</div>
                <div className="bg-background px-2 py-1 rounded border text-xs font-medium">VISA</div>
                <div className="bg-background px-2 py-1 rounded border text-xs font-medium">MasterCard</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
