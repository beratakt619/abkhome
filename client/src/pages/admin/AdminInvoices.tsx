import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search, FileText, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getAllInvoices, deleteInvoice } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function AdminInvoices() {
  const [, setLocation] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }

    loadInvoices();
  }, [user, isAdmin, setLocation]);

  const loadInvoices = async () => {
    try {
      const invoicesData = await getAllInvoices();
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExportExcel = async (invoice: Invoice) => {
    setExporting(invoice.id);
    try {
      const invoiceData = [
        ["FATURA", ""],
        ["", ""],
        ["Fatura No:", invoice.invoiceNumber],
        ["Tarih:", formatDate(invoice.createdAt)],
        ["Sipariş No:", invoice.orderNumber],
        ["", ""],
        ["MÜŞTERİ BİLGİLERİ", ""],
        ["Ad Soyad:", invoice.customerName],
        ["E-posta:", invoice.customerEmail],
        ["Telefon:", invoice.customerPhone],
        ["Adres:", `${invoice.billingAddress.address}, ${invoice.billingAddress.district}/${invoice.billingAddress.city}`],
        ["", ""],
        ["ÜRÜNLER", "", "", ""],
        ["Ürün Adı", "Adet", "Birim Fiyat", "Toplam"],
        ...invoice.items.map(item => [
          item.productName,
          item.quantity.toString(),
          formatPrice(item.price),
          formatPrice(item.quantity * item.price)
        ]),
        ["", ""],
        ["", "", "Ara Toplam:", formatPrice(invoice.subtotal)],
        ["", "", "KDV:", formatPrice(invoice.tax)],
        ["", "", "Kargo:", formatPrice(invoice.shippingCost)],
        ["", "", "TOPLAM:", formatPrice(invoice.total)],
      ];

      const csvContent = invoiceData.map(row => row.join("\t")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fatura-${invoice.invoiceNumber}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Başarılı",
        description: "Fatura indirildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fatura indirilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId);
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      toast({
        title: "Başarılı",
        description: "Fatura silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fatura silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    setExporting("all");
    try {
      const allData = [
        ["Fatura No", "Sipariş No", "Müşteri", "E-posta", "Toplam", "Durum", "Tarih"],
        ...invoices.map(inv => [
          inv.invoiceNumber,
          inv.orderNumber,
          inv.customerName,
          inv.customerEmail,
          formatPrice(inv.total),
          statusLabels[inv.status],
          formatDate(inv.createdAt)
        ])
      ];

      const csvContent = allData.map(row => row.join("\t")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tum-faturalar-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Başarılı",
        description: "Tüm faturalar indirildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Faturalar indirilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fatura Yönetimi</h1>
          <p className="text-muted-foreground">{invoices.length} fatura</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportAll}
          disabled={exporting === "all"}
          data-testid="button-export-all"
        >
          {exporting === "all" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Tümünü İndir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Fatura no, sipariş no veya müşteri adı ile ara..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.invoiceNumber}
                        </div>
                      </TableCell>
                      <TableCell>#{invoice.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p>{invoice.customerName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell className="font-medium">{formatPrice(invoice.total)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExportExcel(invoice)}
                            disabled={exporting === invoice.id}
                            data-testid={`button-download-invoice-${invoice.id}`}
                          >
                            {exporting === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-invoice-${invoice.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Faturayı Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(invoice.id)}>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
