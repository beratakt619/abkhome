import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Loader2, Upload, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { getHeroBanners, createHeroBanner, updateHeroBanner, deleteHeroBanner } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { useToast } from "@/hooks/use-toast";
import type { HeroBanner } from "@shared/schema";

const bannerSchema = z.object({
  images: z.array(z.string()).min(1, "En az 1 resim gerekli"),
  title: z.string().optional(),
  description: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  order: z.coerce.number().int().min(1, "Sıralama 1'den başlamalı").default(1),
  isActive: z.boolean().default(true),
});

type BannerForm = z.infer<typeof bannerSchema>;

export default function AdminHeroBanners() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      images: [],
      title: "",
      description: "",
      ctaText: "",
      ctaLink: "",
      order: 1,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }
    loadData();
  }, [user, isAdmin, setLocation]);

  const loadData = async () => {
    try {
      const bannersData = await getHeroBanners();
      setBanners(bannersData);
    } catch (error) {
      console.error("Error loading banners:", error);
      toast({ title: "Hata", description: "Bannerlar yüklenemedi.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToImgBB(file);
        uploadedUrls.push(url);
      }
      const currentImages = form.getValues("images") || [];
      form.setValue("images", [...currentImages, ...uploadedUrls]);
      toast({ title: "Başarılı", description: `${uploadedUrls.length} resim yüklendi.` });
    } catch (error) {
      toast({ title: "Hata", description: "Resim yükleme başarısız.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: BannerForm) => {
    setSaving(true);
    try {
      if (editingBanner) {
        await updateHeroBanner(editingBanner.id, data);
        toast({ title: "Başarılı", description: "Banner güncellendi." });
      } else {
        await createHeroBanner(data);
        toast({ title: "Başarılı", description: "Banner oluşturuldu." });
      }
      await loadData();
      setDialogOpen(false);
      setEditingBanner(null);
      form.reset();
    } catch (error) {
      toast({ title: "Hata", description: "Bir hata oluştu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    form.reset({
      images: banner.images,
      title: banner.title || "",
      description: banner.description || "",
      ctaText: banner.ctaText || "",
      ctaLink: banner.ctaLink || "",
      order: banner.order,
      isActive: banner.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (bannerId: string) => {
    try {
      await deleteHeroBanner(bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
      toast({ title: "Başarılı", description: "Banner silindi." });
    } catch (error) {
      toast({ title: "Hata", description: "Banner silinirken hata oluştu.", variant: "destructive" });
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hero Banner Yönetimi</h1>
          <p className="text-muted-foreground">{banners.length} banner</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingBanner(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-banner">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Banner Düzenle" : "Yeni Banner Ekle"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Resimler</h4>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      data-testid="input-banner-images"
                    />
                    <Button disabled={uploading} type="button" variant="outline" size="icon">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.getValues("images")?.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {form.getValues("images")?.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Banner ${index + 1}`} className="w-full h-20 object-cover rounded" />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              const images = form.getValues("images") || [];
                              form.setValue("images", images.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık (İsteğe bağlı)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Başlık" data-testid="input-banner-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama (İsteğe bağlı)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Açıklama" data-testid="textarea-banner-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ctaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buton Metni (İsteğe bağlı)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ürünleri Keşfet" data-testid="input-banner-cta-text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ctaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buton Linki (İsteğe bağlı)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/urunler" data-testid="input-banner-cta-link" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıralama</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} data-testid="input-banner-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={saving} data-testid="button-save-banner">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingBanner ? "Güncelle" : "Ekle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Sıra</TableHead>
                  <TableHead>Resimler</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id} data-testid={`row-banner-${banner.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span>{banner.order}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {banner.images.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="w-10 h-10 rounded overflow-hidden bg-muted">
                            <img src={img} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {banner.images.length > 3 && (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-medium">
                            +{banner.images.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{banner.title || "-"}</TableCell>
                    <TableCell>
                      {banner.isActive ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aktif</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">İnaktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                          data-testid={`button-edit-banner-${banner.id}`}
                        >
                          Düzenle
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-delete-banner-${banner.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Banneri Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu banner kalıcı olarak silinecektir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(banner.id)}>
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
