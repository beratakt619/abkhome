import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Search, MessageSquare, Send, Loader2, Check, Clock, AlertCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTickets, updateTicket, addMessageToTicket, deleteTicket, subscribeToTicket } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicket } from "@shared/schema";
import { cn } from "@/lib/utils";

const issueTypeLabels: Record<string, string> = {
  shipping: "Kargo Sorunu",
  return: "İade Talebi",
  product: "Ürün Sorunu",
  payment: "Ödeme Sorunu",
  other: "Diğer",
};

const statusLabels: Record<string, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
};

const statusIcons: Record<string, typeof Clock> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: Check,
  closed: XCircle,
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const priorityLabels: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminSupport() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const ticketIdFromUrl = params.id as string | undefined;
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!user || !isAdmin) {
      setLocation("/");
      return;
    }

    loadTickets();
  }, [user, isAdmin, setLocation]);

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === ticketIdFromUrl);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  useEffect(() => {
    if (selectedTicket) {
      const unsubscribe = subscribeToTicket(selectedTicket.id, (ticket) => {
        if (ticket) {
          setSelectedTicket(ticket);
          setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
        }
      });
      return () => unsubscribe();
    }
  }, [selectedTicket?.id]);

  const loadTickets = async () => {
    try {
      const ticketsData = await getAllTickets();
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    
    setUpdating(true);
    try {
      await updateTicket(selectedTicket.id, { status: newStatus as SupportTicket["status"] });
      setSelectedTicket({ ...selectedTicket, status: newStatus as SupportTicket["status"] });
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus as SupportTicket["status"] } : t));
      toast({
        title: "Başarılı",
        description: "Talep durumu güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicket) return;
    
    setUpdating(true);
    try {
      await updateTicket(selectedTicket.id, { priority: newPriority as SupportTicket["priority"] });
      setSelectedTicket({ ...selectedTicket, priority: newPriority as SupportTicket["priority"] });
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, priority: newPriority as SupportTicket["priority"] } : t));
      toast({
        title: "Başarılı",
        description: "Öncelik güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Öncelik güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await addMessageToTicket(selectedTicket.id, {
        senderId: user.id,
        senderName: user.displayName,
        senderRole: "admin",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (ticketId: string) => {
    try {
      await deleteTicket(ticketId);
      setTickets(tickets.filter(t => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      toast({
        title: "Başarılı",
        description: "Destek talebi silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Talep silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Destek Talepleri</h1>
        <p className="text-muted-foreground">{tickets.length} talep</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Talep no, konu veya müşteri adı ile ara..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-tickets"
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => {
              const StatusIcon = statusIcons[ticket.status];
              return (
                <Card
                  key={ticket.id}
                  className={cn(
                    "cursor-pointer hover-elevate",
                    selectedTicket?.id === ticket.id && "border-primary"
                  )}
                  onClick={() => setSelectedTicket(ticket)}
                  data-testid={`ticket-card-${ticket.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">#{ticket.ticketNumber}</p>
                      </div>
                      <Badge className={statusColors[ticket.status]} variant="secondary">
                        {statusLabels[ticket.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ticket.userName}</span>
                      <span>{formatDate(ticket.updatedAt)}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">{issueTypeLabels[ticket.issueType]}</Badge>
                      <Badge className={cn(priorityColors[ticket.priority], "text-xs")} variant="secondary">
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Talep bulunamadı</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      #{selectedTicket.ticketNumber} - {selectedTicket.userName} ({selectedTicket.userEmail})
                    </p>
                    {selectedTicket.orderNumber && (
                      <p className="text-sm text-muted-foreground">
                        Sipariş: #{selectedTicket.orderNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Talebi Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(selectedTicket.id)}>
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[140px]" data-testid="select-ticket-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={handlePriorityChange}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[120px]" data-testid="select-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.senderRole === "admin" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          msg.senderRole === "admin"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{msg.senderName}</span>
                          <span className="text-xs opacity-70">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedTicket.status !== "closed" && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Yanıtınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      data-testid="input-admin-message"
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} data-testid="button-send-admin-message">
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Görüntülemek için bir destek talebi seçin</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
