import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, FileText, Shield, Truck, CreditCard, Package, Settings as SettingsIcon, Receipt } from "lucide-react";
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver as useZodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { getSettings, updateSettings, getLegalPages, updateLegalPage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings, LegalPage } from "@shared/schema";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site adı gerekli"),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email("Geçerli bir e-posta adresi girin"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().min(0),
  standardShippingCost: z.coerce.number().min(0),
  expressShippingCost: z.coerce.number().min(0),
  estimatedDeliveryDays: z.coerce.number().int().min(1),
});

const paymentSettingsSchema = z.object({
  iyzicoEnabled: z.boolean(),
  iyzicoApiKey: z.string().optional(),
  iyzicoSecretKey: z.string().optional(),
  creditCardEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  cashOnDeliveryEnabled: z.boolean(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;
type ShippingSettingsForm = z.infer<typeof shippingSettingsSchema>;
type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;

const trendyolConfigSchema = z.object({
  trendyolApiKey: z.string().min(1, "API Key gerekli"),
  trendyolApiSecret: z.string().min(1, "API Secret gerekli"),
  trendyolSupplierId: z.string().min(1, "Supplier ID gerekli"),
});

type TrendyolConfigForm = z.infer<typeof trendyolConfigSchema>;

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [pageContent, setPageContent] = useState("");

  const generalForm = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "",
      siteDescription: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  const shippingForm = useForm<ShippingSettingsForm>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      freeShippingThreshold: 500,
      standardShippingCost: 29.90,
      expressShippingCost: 49.90,
      estimatedDeliveryDays: 3,
    },
  });

  const paymentForm = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      iyzicoEnabled: true,
      iyzicoApiKey: "",
      iyzicoSecretKey: "",
      creditCardEnabled: true,
      bankTransferEnabled: false,
      cashOnDeliveryEnabled: false,
    },
  });

  const trendyolConfigForm = useHookForm<TrendyolConfigForm>({
    resolver: useZodResolver(trendyolConfigSchema),
    defaultValues: {
      trendyolApiKey: "",
      trendyolApiSecret: "",
      trendyolSupplierId: "",
    },
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }

    loadData();
    loadTrendyolConfig();
  }, [user, isAdmin, setLocation]);

  const loadTrendyolConfig = async () => {
    try {
      const res = await fetch("/api/admin/settings/trendyol");
      const data = await res.json();
      if (data.success && data.data) {
        trendyolConfigForm.reset(data.data);
      }
    } catch (error) {
      console.warn("Trendyol config load error:", error);
    }
  };

  const onTrendyolConfigSubmit = async (data: TrendyolConfigForm) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/trendyol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Başarılı", description: "Trendyol ayarları kaydedildi" });
      } else {
        toast({ title: "Hata", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Hata", description: "Ayarlar kaydedilemedi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    try {
      const [settingsData, pagesData] = await Promise.all([
        getSettings().catch(err => {
          console.warn("Settings load error:", err);
          return null;
        }),
        getLegalPages().catch(err => {
          console.warn("Legal pages load error:", err);
          return [];
        }),
      ]);
      
      if (settingsData) {
        setSettings(settingsData);
        generalForm.reset({
          siteName: settingsData.siteName || "ABKHomeDesign",
          siteDescription: settingsData.siteDescription || "",
          contactEmail: settingsData.contactEmail || "",
          contactPhone: settingsData.contactPhone || "",
          address: settingsData.address || "",
        });
        shippingForm.reset({
          freeShippingThreshold: settingsData.freeShippingThreshold || 500,
          standardShippingCost: settingsData.standardShippingCost || 29.90,
          expressShippingCost: settingsData.expressShippingCost || 49.90,
          estimatedDeliveryDays: settingsData.estimatedDeliveryDays || 3,
        });
        paymentForm.reset({
          iyzicoEnabled: settingsData.iyzicoEnabled ?? true,
          creditCardEnabled: settingsData.creditCardEnabled ?? true,
          bankTransferEnabled: settingsData.bankTransferEnabled ?? false,
          cashOnDeliveryEnabled: settingsData.cashOnDeliveryEnabled ?? false,
        });
      }
      
      setLegalPages(pagesData);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const onGeneralSubmit = async (data: GeneralSettingsForm) => {
    setSaving(true);
    try {
      await updateSettings(data);
      toast({ title: "Başarılı", description: "Genel ayarlar güncellendi." });
    } catch (error) {
      toast({ title: "Hata", description: "Ayarlar güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onShippingSubmit = async (data: ShippingSettingsForm) => {
    setSaving(true);
    try {
      await updateSettings(data);
      toast({ title: "Başarılı", description: "Kargo ayarları güncellendi." });
    } catch (error) {
      toast({ title: "Hata", description: "Ayarlar güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onPaymentSubmit = async (data: PaymentSettingsForm) => {
    setSaving(true);
    try {
      await updateSettings(data);
      toast({ title: "Başarılı", description: "Ödeme ayarları güncellendi." });
    } catch (error) {
      toast({ title: "Hata", description: "Ayarlar güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditPage = (page: LegalPage) => {
    setEditingPage(page);
    setPageContent(page.content);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    
    setSaving(true);
    try {
      await updateLegalPage(editingPage.id, { content: pageContent });
      setLegalPages(legalPages.map(p => p.id === editingPage.id ? { ...p, content: pageContent } : p));
      setEditingPage(null);
      toast({ title: "Başarılı", description: "Sayfa içeriği güncellendi." });
    } catch (error) {
      toast({ title: "Hata", description: "Sayfa güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };


  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Ayarları</h1>
        <p className="text-muted-foreground">Genel site ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="shipping">Kargo</TabsTrigger>
          <TabsTrigger value="payment">Ödeme</TabsTrigger>
          <TabsTrigger value="trendyol">Trendyol Yapılandırma</TabsTrigger>
          <TabsTrigger value="legal">Yasal Sayfalar</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Site adı ve iletişim bilgileri</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4 max-w-xl">
                  <FormField
                    control={generalForm.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Adı</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-site-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Açıklaması</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="textarea-site-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İletişim E-postası</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İletişim Telefonu</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="textarea-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving} data-testid="button-save-general">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Kargo Ayarları
              </CardTitle>
              <CardDescription>Kargo ücretleri ve teslimat süreleri</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...shippingForm}>
                <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-4 max-w-xl">
                  <FormField
                    control={shippingForm.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ücretsiz Kargo Limiti (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-free-shipping" />
                        </FormControl>
                        <FormDescription>
                          Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shippingForm.control}
                    name="standardShippingCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standart Kargo Ücreti (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-standard-shipping" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shippingForm.control}
                    name="expressShippingCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hızlı Kargo Ücreti (TL)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-express-shipping" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={shippingForm.control}
                    name="estimatedDeliveryDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahmini Teslimat Süresi (Gün)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-delivery-days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving} data-testid="button-save-shipping">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ödeme Ayarları
              </CardTitle>
              <CardDescription>Ödeme yöntemlerini yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4 max-w-xl">
                  <FormField
                    control={paymentForm.control}
                    name="iyzicoEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">iyzico Ödeme</FormLabel>
                          <FormDescription>iyzico ile güvenli ödeme</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {paymentForm.watch("iyzicoEnabled") && (
                    <>
                      <FormField
                        control={paymentForm.control}
                        name="iyzicoApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>iyzico API Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="API Key girin" {...field} data-testid="input-iyzico-api-key" />
                            </FormControl>
                            <FormDescription>
                              iyzico Merchant Dashboard'dan alın
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="iyzicoSecretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>iyzico Secret Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Secret Key girin" {...field} data-testid="input-iyzico-secret-key" />
                            </FormControl>
                            <FormDescription>
                              iyzico Merchant Dashboard'dan alın
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={paymentForm.control}
                    name="creditCardEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">Kredi Kartı</FormLabel>
                          <FormDescription>Doğrudan kredi kartı ile ödeme</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="bankTransferEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">Banka Havalesi</FormLabel>
                          <FormDescription>Havale/EFT ile ödeme</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="cashOnDeliveryEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 p-4 border rounded-lg">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">Kapıda Ödeme</FormLabel>
                          <FormDescription>Teslimat sırasında ödeme</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving} data-testid="button-save-payment">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trendyol">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Trendyol API Yapılandırması
              </CardTitle>
              <CardDescription>Trendyol API bilgilerinizi girin</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...trendyolConfigForm}>
                <form onSubmit={trendyolConfigForm.handleSubmit(onTrendyolConfigSubmit)} className="space-y-4 max-w-xl">
                  <FormField
                    control={trendyolConfigForm.control}
                    name="trendyolApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Trendyol API Key girin" {...field} />
                        </FormControl>
                        <FormDescription>Trendyol Satıcı Paneli'nden alın</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={trendyolConfigForm.control}
                    name="trendyolApiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Trendyol API Secret girin" {...field} />
                        </FormControl>
                        <FormDescription>Trendyol Satıcı Paneli'nden alın</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={trendyolConfigForm.control}
                    name="trendyolSupplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Trendyol Supplier ID girin" {...field} />
                        </FormControl>
                        <FormDescription>Trendyol Satıcı Paneli'nden alın</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Yasal Sayfalar
              </CardTitle>
              <CardDescription>KVKK, Gizlilik Politikası ve diğer yasal metinler</CardDescription>
            </CardHeader>
            <CardContent>
              {editingPage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{editingPage.title}</h3>
                    <Button variant="outline" onClick={() => setEditingPage(null)}>
                      İptal
                    </Button>
                  </div>
                  <Textarea
                    value={pageContent}
                    onChange={(e) => setPageContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    data-testid="textarea-legal-content"
                  />
                  <Button onClick={handleSavePage} disabled={saving} data-testid="button-save-legal">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {[
                    { slug: "gizlilik-politikasi", title: "Gizlilik Politikası", icon: Shield },
                    { slug: "kullanim-kosullari", title: "Kullanım Koşulları", icon: FileText },
                    { slug: "kvkk", title: "KVKK Aydınlatma Metni", icon: Shield },
                    { slug: "iade-politikasi", title: "İade Politikası", icon: FileText },
                    { slug: "kargo-politikasi", title: "Kargo ve Teslimat", icon: Truck },
                  ].map((page) => {
                    const existingPage = legalPages.find(p => p.slug === page.slug);
                    const PageIcon = page.icon;
                    return (
                      <Card key={page.slug} className="hover-elevate cursor-pointer" onClick={() => {
                        if (existingPage) {
                          handleEditPage(existingPage);
                        } else {
                          handleEditPage({
                            id: page.slug,
                            slug: page.slug,
                            title: page.title,
                            content: "",
                            lastUpdated: new Date().toISOString(),
                          });
                        }
                      }}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <PageIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{page.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {existingPage?.lastUpdated
                                ? `Son güncelleme: ${new Date(existingPage.lastUpdated).toLocaleDateString("tr-TR")}`
                                : "Henüz düzenlenmedi"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
