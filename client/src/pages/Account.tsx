import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, MapPin, Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Address } from "@shared/schema";

const profileSchema = z.object({
  displayName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  title: z.string().min(1, "Adres başlığı gerekli"),
  fullName: z.string().min(2, "Ad Soyad gerekli"),
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  address: z.string().min(10, "Adres detayı gerekli"),
  city: z.string().min(2, "Şehir gerekli"),
  district: z.string().min(2, "İlçe gerekli"),
  postalCode: z.string().min(5, "Posta kodu gerekli"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function Account() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      phone: user?.phone || "",
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      fullName: "",
      phone: "",
      address: "",
      city: "",
      district: "",
      postalCode: "",
    },
  });

  if (!user) {
    setLocation("/giris");
    return null;
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await updateUserProfile(user.id, data);
      await refreshUser();
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAddressSubmit = async (data: AddressForm) => {
    setIsLoading(true);
    try {
      const addresses = [...(user.addresses || [])];
      
      if (editingAddress) {
        const index = addresses.findIndex(a => a.id === editingAddress.id);
        if (index > -1) {
          addresses[index] = { ...data, id: editingAddress.id, isDefault: editingAddress.isDefault };
        }
      } else {
        const newAddress: Address = {
          ...data,
          id: Math.random().toString(36).substring(2),
          isDefault: addresses.length === 0,
        };
        addresses.push(newAddress);
      }

      await updateUserProfile(user.id, { addresses });
      await refreshUser();
      
      toast({
        title: "Başarılı",
        description: editingAddress ? "Adres güncellendi." : "Yeni adres eklendi.",
      });
      
      setAddressDialogOpen(false);
      setEditingAddress(null);
      addressForm.reset();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Adres kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      title: address.title,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
    });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    setIsLoading(true);
    try {
      const addresses = user.addresses?.filter(a => a.id !== addressId) || [];
      await updateUserProfile(user.id, { addresses });
      await refreshUser();
      toast({
        title: "Başarılı",
        description: "Adres silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Adres silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setIsLoading(true);
    try {
      const addresses = user.addresses?.map(a => ({
        ...a,
        isDefault: a.id === addressId,
      })) || [];
      await updateUserProfile(user.id, { addresses });
      await refreshUser();
      toast({
        title: "Başarılı",
        description: "Varsayılan adres güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-6 bg-gradient-to-r from-primary/10 to-transparent border-b slide-up">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground neon-glow">Hesabım</h1>
          <p className="text-muted-foreground mt-1">Profil ve adres bilgilerinizi yönetin</p>
        </div>
      </div>
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6 slide-up">
          <TabsList className="glass">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="addresses">Adreslerim</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="neon-glow">Profil Bilgileri</CardTitle>
                <CardDescription>Hesap bilgilerinizi güncelleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback className="text-2xl">
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{user.displayName}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} data-testid="input-profile-name" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>E-posta</FormLabel>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" value={user.email} disabled />
                      </div>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                className="pl-10" 
                                placeholder="05XX XXX XX XX" 
                                {...field} 
                                data-testid="input-profile-phone" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isLoading} data-testid="button-save-profile">
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Kaydet
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Adreslerim</CardTitle>
                  <CardDescription>Kayıtlı teslimat adresleriniz</CardDescription>
                </div>
                <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingAddress(null); addressForm.reset(); }} data-testid="button-add-address">
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Adres
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}</DialogTitle>
                      <DialogDescription>Teslimat adresinizi girin</DialogDescription>
                    </DialogHeader>
                    <Form {...addressForm}>
                      <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                        <FormField
                          control={addressForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adres Başlığı</FormLabel>
                              <FormControl>
                                <Input placeholder="Ev, İş vb." {...field} data-testid="input-address-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addressForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ad Soyad</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-address-fullname" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input placeholder="05XX XXX XX XX" {...field} data-testid="input-address-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={addressForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adres</FormLabel>
                              <FormControl>
                                <Input placeholder="Mahalle, Sokak, Bina No, Daire" {...field} data-testid="input-address-detail" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={addressForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İl</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-address-city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="district"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İlçe</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-address-district" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Posta Kodu</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-address-postal" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
                            İptal
                          </Button>
                          <Button type="submit" disabled={isLoading} data-testid="button-save-address">
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {user.addresses && user.addresses.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {user.addresses.map((address) => (
                      <Card key={address.id} className={`glass ${address.isDefault ? "border-primary" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-medium">{address.title}</span>
                              {address.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Varsayılan</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditAddress(address)}
                                data-testid={`button-edit-address-${address.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteAddress(address.id)}
                                data-testid={`button-delete-address-${address.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium">{address.fullName}</p>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.address}, {address.district}/{address.city} {address.postalCode}
                          </p>
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              className="px-0 h-auto text-xs mt-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              data-testid={`button-set-default-${address.id}`}
                            >
                              Varsayılan Yap
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Henüz adres eklemediniz.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
