import { useState } from "react";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, loading, itemCount, subtotal, updateQuantity, removeFromCart } = useCart();
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: string }>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Sepetim ({itemCount} ürün)
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Sepetiniz boş</p>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Sepetinize ürün eklemek için alışverişe başlayın
            </p>
            <Link href="/urunler" onClick={() => onOpenChange(false)}>
              <Button data-testid="button-start-shopping">
                Alışverişe Başla
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 py-4">
              <div className="space-y-4">
                {items.map((item) => {
                  const price = item.product?.discountPrice || item.product?.price || 0;
                  const imageUrl = item.product?.images?.[0] || "";
                  
                  return (
                    <div key={item.productId} className="flex gap-4" data-testid={`cart-item-${item.productId}`}>
                      <div className="h-20 w-20 bg-muted rounded overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product?.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product?.name}</h4>
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(", ")}
                          </p>
                        )}
                        {item.selectedColorVariantId && item.product?.colorVariants && (
                          <div className="mt-1 flex items-center gap-1">
                            {(() => {
                              const variant = item.product.colorVariants.find(v => v.id === item.selectedColorVariantId);
                              return variant ? (
                                <>
                                  <div
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: variant.colorHex || "#ccc" }}
                                  />
                                  <span className="text-xs text-muted-foreground">{variant.name}</span>
                                </>
                              ) : null;
                            })()}
                          </div>
                        )}
                        <p className="text-sm font-medium text-primary mt-1">{formatPrice(price)}</p>
                        <div className="flex items-center gap-2 mt-2">
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
                            onFocus={(e) => {
                              e.target.select();
                              setTimeout(() => e.target.value = "", 0);
                            }}
                            className="w-12 h-7 text-center text-sm px-1"
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
                            data-testid={`button-increase-${item.productId}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive ml-auto"
                            onClick={() => removeFromCart(item.productId)}
                            data-testid={`button-remove-${item.productId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo</span>
                  <span className="text-green-600">{subtotal >= 500 ? "Ücretsiz" : formatPrice(29.90)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Toplam</span>
                  <span className="text-lg">{formatPrice(subtotal + (subtotal >= 500 ? 0 : 29.90))}</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Link href="/odeme" onClick={() => onOpenChange(false)}>
                  <Button className="w-full" data-testid="button-checkout">
                    Ödemeye Geç
                  </Button>
                </Link>
                <Link href="/urunler" onClick={() => onOpenChange(false)}>
                  <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                    Alışverişe Devam Et
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
