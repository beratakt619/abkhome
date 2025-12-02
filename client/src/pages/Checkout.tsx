import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, CreditCard, Truck, MapPin, ShoppingBag, Loader2, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrder, createInvoice, updateUserProfile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Address, OrderItem } from "@shared/schema";
import { cn } from "@/lib/utils";

const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı gerekli"),
  fullName: z.string().min(2, "Ad Soyad gerekli"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  address: z.string().min(10, "Adres detayı gerekli"),
  city: z.string().min(2, "Şehir gerekli"),
  district: z.string().min(2, "İlçe gerekli"),
  postalCode: z.string().min(5, "Posta kodu gerekli"),
});

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  sameAsShipping: z.boolean(),
  acceptTerms: z.boolean().refine(val => val === true, "Koşulları kabul etmelisiniz"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const shippingCost = subtotal >= 500 ? 0 : 29.90;
  const taxRate = 0.18;
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: defaultAddress || {
        title: "",
        fullName: user?.displayName || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
      },
      billingAddress: defaultAddress || {
        title: "",
        fullName: user?.displayName || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
      },
      sameAsShipping: true,
      acceptTerms: false,
    },
  });

  const sameAsShipping = form.watch("sameAsShipping");

  useEffect(() => {
    if (sameAsShipping) {
      const shippingAddress = form.getValues("shippingAddress");
      form.setValue("billingAddress", shippingAddress);
    }
  }, [sameAsShipping, form]);

  if (!user) {
    setLocation("/giris");
    return null;
  }

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Sepetiniz Boş</h1>
          <p className="text-muted-foreground mb-6">
            Ödeme yapabilmek için sepetinize ürün eklemeniz gerekiyor.
          </p>
          <Button asChild>
            <Link href="/urunler">Alışverişe Başla</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const onSubmit = async (data: CheckoutForm) => {
    setIsLoading(true);
    try {
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || "Ürün",
        productImage: item.product?.images?.[0] || "",
        quantity: item.quantity,
        price: item.product?.discountPrice || item.product?.price || 0,
        attributes: item.attributes || {},
        selectedColorVariantId: item.selectedColorVariantId,
      }));

      const shippingAddr: Address = {
        ...data.shippingAddress,
        id: Math.random().toString(36).substring(2),
        isDefault: false,
      };

      const billingAddr: Address = data.sameAsShipping
        ? shippingAddr
        : {
            ...data.billingAddress,
            id: Math.random().toString(36).substring(2),
            isDefault: false,
          };

      const orderData = {
        userId: user.id,
        items: orderItems,
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        subtotal,
        shippingCost,
        tax,
        total,
        status: "pending" as const,
        paymentStatus: "paid" as const,
        paymentMethod: "iyzico",
      };

      const { id: orderId, orderNumber } = await createOrder(orderData);

      const invoiceData = {
        orderId,
        orderNumber,
        userId: user.id,
        customerName: billingAddr.fullName,
        customerEmail: user.email,
        customerPhone: billingAddr.phone,
        billingAddress: billingAddr,
        items: orderItems,
        subtotal,
        tax,
        shippingCost,
        total,
        status: "paid" as const,
      };

      await createInvoice(invoiceData);

      const existingAddresses = user.addresses || [];
      const addressExists = existingAddresses.some(
        a => a.address === shippingAddr.address && a.city === shippingAddr.city
      );

      if (!addressExists) {
        const newAddresses = [...existingAddresses, { ...shippingAddr, isDefault: existingAddresses.length === 0 }];
        await updateUserProfile(user.id, { addresses: newAddresses });
        await refreshUser();
      }

      await clearCart();

      setOrderNumber(orderNumber);
      setOrderComplete(true);

      toast({
        title: "Sipariş Tamamlandı!",
        description: `Sipariş numaranız: ${orderNumber}`,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-4 py-16 text-center flex items-center justify-center">
          <div className="max-w-md mx-auto slide-up">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6 glow-box">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground neon-glow mb-4">Siparişiniz Alındı!</h1>
          <p className="text-muted-foreground mb-2">
            Siparişiniz başarıyla oluşturuldu.
          </p>
          <p className="font-semibold text-lg mb-8">
            Sipariş Numarası: <span className="text-primary">{orderNumber}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/siparislerim">Siparişlerimi Gör</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/urunler">Alışverişe Devam Et</Link>
            </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Adres", icon: MapPin },
    { id: 2, name: "Ödeme", icon: CreditCard },
    { id: 3, name: "Onay", icon: Check },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-6 bg-gradient-to-r from-primary/10 to-transparent border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground neon-glow">Sipariş Tamamla</h1>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/urunler">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Alışverişe Dön
          </Link>
        </Button>

        <div className="flex items-center justify-center mb-8 slide-up">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all glow-box",
                step >= s.id
                  ? "bg-primary text-primary-foreground neon-glow"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "ml-2 text-sm font-medium",
              step >= s.id ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.name}
            </span>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-4",
                step > s.id ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && (
                <Card className="glass slide-up">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 neon-glow">
                      <Truck className="h-5 w-5" />
                      Teslimat Adresi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adres Başlığı</FormLabel>
                          <FormControl>
                            <Input placeholder="Ev, İş vb." {...field} data-testid="input-shipping-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shippingAddress.fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-shipping-fullname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shippingAddress.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="05XX XXX XX XX" {...field} data-testid="input-shipping-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="shippingAddress.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adres</FormLabel>
                          <FormControl>
                            <Input placeholder="Mahalle, Sokak, Bina No, Daire" {...field} data-testid="input-shipping-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="shippingAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İl</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-shipping-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shippingAddress.district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İlçe</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-shipping-district" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shippingAddress.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Posta Kodu</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-shipping-postal" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <FormField
                      control={form.control}
                      name="sameAsShipping"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-same-address"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Fatura adresi teslimat adresi ile aynı
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {!sameAsShipping && (
                      <div className="space-y-4 pt-4">
                        <h3 className="font-medium">Fatura Adresi</h3>
                        
                        <FormField
                          control={form.control}
                          name="billingAddress.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adres Başlığı</FormLabel>
                              <FormControl>
                                <Input placeholder="Ev, İş vb." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billingAddress.fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ad Soyad</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingAddress.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input placeholder="05XX XXX XX XX" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="billingAddress.address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adres</FormLabel>
                              <FormControl>
                                <Input placeholder="Mahalle, Sokak, Bina No, Daire" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="billingAddress.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İl</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingAddress.district"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İlçe</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="billingAddress.postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Posta Kodu</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button type="button" onClick={() => setStep(2)} data-testid="button-next-step">
                        Devam Et
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Ödeme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                      <Lock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Güvenli Ödeme</p>
                        <p className="text-sm text-muted-foreground">iyzico ile 256-bit SSL şifreleme</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Bu demo sürümünde ödeme simüle edilmektedir. Gerçek ödeme alınmayacaktır.
                      </p>
                      
                      <div className="border rounded-lg p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Kart Numarası</label>
                            <Input placeholder="4242 4242 4242 4242" className="mt-1.5" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Kart Üzerindeki İsim</label>
                            <Input placeholder="AD SOYAD" className="mt-1.5" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Son Kullanma</label>
                            <Input placeholder="MM/YY" className="mt-1.5" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">CVV</label>
                            <Input placeholder="123" type="password" className="mt-1.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Geri
                      </Button>
                      <Button type="button" onClick={() => setStep(3)} data-testid="button-next-payment">
                        Devam Et
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Sipariş Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Teslimat Adresi</h4>
                      <p className="text-sm">{form.getValues("shippingAddress.fullName")}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("shippingAddress.address")}, {form.getValues("shippingAddress.district")}/{form.getValues("shippingAddress.city")}
                      </p>
                    </div>

                    <Separator />

                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-accept-terms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              <Link href="/kullanim-kosullari" className="text-primary hover:underline" target="_blank">
                                Kullanım Koşulları
                              </Link>
                              {", "}
                              <Link href="/gizlilik-politikasi" className="text-primary hover:underline" target="_blank">
                                Gizlilik Politikası
                              </Link>
                              {" ve "}
                              <Link href="/iade-politikasi" className="text-primary hover:underline" target="_blank">
                                İade Politikası
                              </Link>
                              'nı okudum ve kabul ediyorum.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        Geri
                      </Button>
                      <Button type="submit" disabled={isLoading} data-testid="button-complete-order">
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Siparişi Tamamla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Sepet Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-3 bg-card/50 rounded-lg border border-border/30 hover:border-primary/50 transition-all">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground">{item.product?.name}</p>
                      {item.selectedColorVariantId && item.product?.colorVariants && (
                        <div className="flex items-center gap-1 mt-1">
                          {(() => {
                            const variant = item.product.colorVariants.find(v => v.id === item.selectedColorVariantId);
                            return variant ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div
                                  className="w-3 h-3 rounded-full border border-muted-foreground"
                                  style={{ backgroundColor: variant.colorHex || '#000' }}
                                />
                                <span>{variant.name}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{item.quantity}x</p>
                      <p className="font-extrabold text-primary neon-glow mt-1">
                        {formatPrice((item.product?.discountPrice || item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm bg-muted/30 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Kargo</span>
                  <span className="font-semibold text-green-600">{shippingCost === 0 ? "Ücretsiz ✓" : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">KDV (%18)</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg border border-primary/30">
                <span className="text-lg font-bold">Toplam</span>
                <span className="text-3xl font-black text-primary neon-glow">{formatPrice(total)}</span>
              </div>

              {subtotal < 500 && (
                <p className="text-xs text-muted-foreground text-center">
                  {formatPrice(500 - subtotal)} daha ekleyin, ücretsiz kargo kazanın!
                </p>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
