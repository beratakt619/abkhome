import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Package, Eye, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { getOrdersByUser, getInvoicesByUser } from "@/lib/firebase";
import type { Order, Invoice } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
  returned: "İade Edildi",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  returned: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      setLocation("/giris");
      return;
    }

    const loadOrders = async () => {
      try {
        const [ordersData, invoicesData] = await Promise.all([
          getOrdersByUser(user.id),
          getInvoicesByUser(user.id),
        ]);
        setOrders(ordersData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user, setLocation]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInvoiceForOrder = (orderId: string) => {
    return invoices.find(inv => inv.orderId === orderId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Siparişlerim</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Siparişlerim</h1>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover-elevate" data-testid={`order-card-${order.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Sipariş #{order.orderNumber}</h3>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} ürün
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        data-testid={`button-view-order-${order.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detaylar
                      </Button>
                      {getInvoiceForOrder(order.id) && (
                        <Button variant="outline" size="sm" data-testid={`button-invoice-${order.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Fatura
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-4 overflow-x-auto pb-2">
                  {order.items.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">+{order.items.length - 4}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Henüz Siparişiniz Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Alışveriş yapmaya başlayarak ilk siparişinizi oluşturun.
            </p>
            <Button asChild>
              <Link href="/urunler">Alışverişe Başla</Link>
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayları</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Sipariş #{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <Badge className={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Ürünler</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        {item.selectedColorVariantId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Seçili Renk: {item.selectedColorVariantId}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} adet x {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.quantity * item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Teslimat Adresi</h4>
                  <p className="text-sm">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.district}/{selectedOrder.shippingAddress.city}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Fatura Adresi</h4>
                  <p className="text-sm">{selectedOrder.billingAddress.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.billingAddress.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.billingAddress.address}, {selectedOrder.billingAddress.district}/{selectedOrder.billingAddress.city}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo</span>
                  <span>{formatPrice(selectedOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KDV</span>
                  <span>{formatPrice(selectedOrder.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Toplam</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
