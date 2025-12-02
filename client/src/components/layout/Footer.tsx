import { Link } from "wouter";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-card to-background border-t border-border/50 glass">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4 slide-up">
            <Link href="/">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded font-bold">ABK</div>
                <span className="text-xl font-bold text-foreground tracking-tight">
                  Home<span className="text-primary">Design</span>
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Eviniz için kaliteli ev tekstil ürünleri. Nevresim takımları, yastıklar, battaniyeler ve daha fazlası.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" asChild data-testid="link-facebook">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" asChild data-testid="link-instagram">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" asChild data-testid="link-twitter">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform" asChild data-testid="link-youtube">
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          <div className="space-y-4 slide-up" style={{ animationDelay: "50ms" }}>
            <h3 className="font-semibold text-foreground">Kategoriler</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/kategori/nevresim-takimlari" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-nevresim">
                Nevresim Takımları
              </Link>
              <Link href="/kategori/yastik-kirlent" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-yastik">
                Yastık & Kırlent
              </Link>
              <Link href="/kategori/battaniye-pike" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-battaniye">
                Battaniye & Pike
              </Link>
              <Link href="/kategori/havlu" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-havlu">
                Havlu
              </Link>
              <Link href="/kategori/perde" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-perde">
                Perde
              </Link>
            </nav>
          </div>

          <div className="space-y-4 slide-up" style={{ animationDelay: "100ms" }}>
            <h3 className="font-semibold text-foreground">Kurumsal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/hakkimizda" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-about">
                Hakkımızda
              </Link>
              <Link href="/iletisim" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-contact">
                İletişim
              </Link>
              <Link href="/gizlilik-politikasi" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-privacy">
                Gizlilik Politikası
              </Link>
              <Link href="/kullanim-kosullari" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-terms">
                Kullanım Koşulları
              </Link>
              <Link href="/kvkk" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-kvkk">
                KVKK
              </Link>
              <Link href="/iade-politikasi" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1" data-testid="footer-link-return">
                İade Politikası
              </Link>
            </nav>
          </div>

          <div className="space-y-4 slide-up" style={{ animationDelay: "150ms" }}>
            <h3 className="font-semibold text-foreground">İletişim</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 hover:translate-x-1 transition-transform">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  İstanbul, Türkiye
                </p>
              </div>
              <div className="flex items-center gap-3 hover:translate-x-1 transition-transform">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+902121234567" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  +90 212 123 45 67
                </a>
              </div>
              <div className="flex items-center gap-3 hover:translate-x-1 transition-transform">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@abkhomedesign.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  info@abkhomedesign.com
                </a>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Bültenimize abone olun
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="h-9 glass"
                  data-testid="input-newsletter-email"
                />
                <Button size="sm" className="glow-box" data-testid="button-newsletter-subscribe">
                  Abone Ol
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 opacity-50" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ABKHomeDesign. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">Güvenli Ödeme:</div>
            <div className="flex gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-5" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-5" />
              <span className="text-xs">iyzico</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
