import { useState } from "react";
import { Link } from "wouter";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Product } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, loading: cartLoading } = useCart();
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id, 1, {
      fabricType: product.attributes.fabricType,
      color: product.attributes.color,
      size: product.attributes.size,
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
  };

  const favorite = isFavorite(product.id);

  return (
    <Card className="group overflow-hidden hover-elevate card-3d transition-all duration-500" data-testid={`product-card-${product.id}`}>
      <Link href={`/urun/${product.sku}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-md bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-primary text-primary-foreground neon-glow">Yeni</Badge>
            )}
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="glow-box">%{discountPercentage}</Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 bg-background/80 backdrop-blur-md transition-all duration-300 hover:scale-110",
              favorite && "text-red-500"
            )}
            onClick={handleToggleFavorite}
            disabled={favLoading}
            data-testid={`button-favorite-${product.id}`}
          >
            <Heart className={cn("h-5 w-5 transition-all", favorite && "fill-current")} />
          </Button>

          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
            <Button
              className="w-full slide-up"
              size="sm"
              onClick={handleAddToCart}
              disabled={cartLoading || product.stock === 0}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock === 0 ? "Stokta Yok" : "Sepete Ekle"}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {product.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3 w-3 transition-all",
                      star <= product.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 group-hover:translate-y-1 transition-transform py-1">
            {product.discountPrice ? (
              <>
                <span className="font-extrabold text-lg text-primary neon-glow price-discount">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-xs text-muted-foreground line-through price-original">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="font-extrabold text-lg text-foreground neon-glow price-display">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {product.attributes?.color && (
            <p className="text-xs text-muted-foreground">
              {product.attributes.color}
            </p>
          )}
        </div>
      </Link>
    </Card>
  );
}
