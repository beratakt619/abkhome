import { useState } from "react";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CartSidebarProps {
  onClose: () => void;
}

export default function CartSidebar({ onClose }: CartSidebarProps) {
  const { items, loading, itemCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: string }>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Sepetim</h2>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-20 h-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Sepetim</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Sepetiniz Boş</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Henüz sepetinize ürün eklemediniz.
          </p>
          <Button onClick={onClose} asChild>
            <Link href="/urunler" data-testid="link-browse-products">
              Ürünlere Göz At
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sepetim</h2>
          <span className="text-sm text-muted-foreground">{itemCount} ürün</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3" data-testid={`cart-item-${item.productId}`}>
              <div className="w-20 h-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
                {item.product?.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {item.product?.name || "Ürün"}
                </h4>
                {item.attributes?.color && (
                  <p className="text-xs text-muted-foreground">
                    Renk: {item.attributes.color}
                  </p>
                )}
                {item.attributes?.size && (
                  <p className="text-xs text-muted-foreground">
                    Beden: {item.attributes.size}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const currentQty = editingQuantity[item.productId] ? parseInt(editingQuantity[item.productId]) : item.quantity;
                        if (currentQty > 1) {
                          updateQuantity(item.productId, currentQty - 1);
                          setEditingQuantity({ ...editingQuantity, [item.productId]: "" });
                        }
                      }}
                      disabled={loading}
                      data-testid={`button-decrease-${item.productId}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.product?.stock || 999}
                      value={editingQuantity[item.productId] ?? item.quantity}
                      onChange={(e) => setEditingQuantity({ ...editingQuantity, [item.productId]: e.target.value })}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value) || item.quantity;
                        if (value > 0 && value <= (item.product?.stock || 999)) {
                          updateQuantity(item.productId, value);
                        }
                        setEditingQuantity({ ...editingQuantity, [item.productId]: "" });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const value = parseInt(e.currentTarget.value) || item.quantity;
                          if (value > 0 && value <= (item.product?.stock || 999)) {
                            updateQuantity(item.productId, value);
                          }
                          setEditingQuantity({ ...editingQuantity, [item.productId]: "" });
                        }
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        setTimeout(() => e.target.value = "", 0);
                      }}
                      className="w-16 h-8 text-center text-sm px-2"
                      data-testid={`input-quantity-${item.productId}`}
                      disabled={loading}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const currentQty = editingQuantity[item.productId] ? parseInt(editingQuantity[item.productId]) : item.quantity;
                        if (currentQty < (item.product?.stock || 999)) {
                          updateQuantity(item.productId, currentQty + 1);
                          setEditingQuantity({ ...editingQuantity, [item.productId]: "" });
                        }
                      }}
                      disabled={loading}
                      data-testid={`button-increase-${item.productId}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                    disabled={loading}
                    data-testid={`button-remove-${item.productId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold text-sm mt-1">
                  {formatPrice((item.product?.discountPrice || item.product?.price || 0) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kargo</span>
            <span className="text-muted-foreground">Ödeme adımında hesaplanacak</span>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Toplam</span>
          <span className="font-bold text-lg">{formatPrice(subtotal)}</span>
        </div>
        <div className="grid gap-2">
          <Button asChild className="w-full" onClick={onClose} data-testid="button-checkout">
            <Link href="/odeme">
              Ödemeye Geç
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={onClose} asChild data-testid="button-continue-shopping">
            <Link href="/urunler">
              Alışverişe Devam Et
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
