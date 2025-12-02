import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquare, Plus, Send, Loader2, Clock, CheckCircle, AlertCircle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getSupportTicketsByUser, createSupportTicket, addMessageToTicket, getOrdersByUser, subscribeToTicket, getSupportTicketById } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicket, Order } from "@shared/schema";
import { cn } from "@/lib/utils";

const ticketSchema = z.object({
  issueType: z.enum(["shipping", "return", "product", "payment", "other"]),
  orderId: z.string().optional(),
  subject: z.string().min(5, "Konu en az 5 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

type TicketForm = z.infer<typeof ticketSchema>;

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
  resolved: CheckCircle,
  closed: XCircle,
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function Support() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      issueType: "other",
      orderId: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation("/giris");
      return;
    }

    const loadData = async () => {
      try {
        const [ticketsData, ordersData] = await Promise.all([
          getSupportTicketsByUser(user.id),
          getOrdersByUser(user.id),
        ]);
        setTickets(ticketsData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, setLocation]);

  useEffect(() => {
    if (selectedTicket) {
      const unsubscribe = subscribeToTicket(selectedTicket.id, (ticket) => {
        if (ticket) {
          setSelectedTicket(ticket);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedTicket?.id]);

  const onSubmit = async (data: TicketForm) => {
    if (!user) return;

    setSending(true);
    try {
      const selectedOrder = data.orderId && data.orderId !== "none" ? orders.find(o => o.id === data.orderId) : null;
      
      const ticketData = {
        userId: user.id,
        userName: user.displayName || "User",
        userEmail: user.email || "",
        orderId: (data.orderId && data.orderId !== "none") ? data.orderId : undefined,
        orderNumber: selectedOrder?.orderNumber,
        issueType: data.issueType,
        subject: data.subject,
        status: "open" as const,
        priority: "medium" as const,
      };

      console.log("Creating ticket:", ticketData);
      await createSupportTicket(ticketData, data.message);
      
      const ticketsData = await getSupportTicketsByUser(user.id);
      setTickets(ticketsData);

      toast({
        title: "Destek Talebi Oluşturuldu",
        description: "En kısa sürede size dönüş yapılacaktır.",
      });

      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Support ticket error:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Talep oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await addMessageToTicket(selectedTicket.id, {
        senderId: user.id,
        senderName: user.displayName,
        senderRole: "customer",
        message: newMessage.trim(),
      });
      setNewMessage("");
      
      // Refresh ticket to show new message
      const updatedTicket = await getSupportTicketById(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        // Update tickets list
        const ticketsData = await getSupportTicketsByUser(user.id);
        setTickets(ticketsData);
      }
      
      toast({
        title: "Başarılı",
        description: "Mesajınız gönderildi.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Destek</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Destek</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-ticket">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Talep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Destek Talebi</DialogTitle>
              <DialogDescription>Lütfen destek talebi oluşturmak için aşağıdaki formu doldurun</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sorun Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-issue-type">
                            <SelectValue placeholder="Sorun türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="shipping">Kargo Sorunu</SelectItem>
                          <SelectItem value="return">İade Talebi</SelectItem>
                          <SelectItem value="product">Ürün Sorunu</SelectItem>
                          <SelectItem value="payment">Ödeme Sorunu</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {orders.length > 0 && (
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlgili Sipariş (Opsiyonel)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-order">
                              <SelectValue placeholder="Sipariş seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sipariş Seçilmedi</SelectItem>
                            {orders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                #{order.orderNumber} - {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konu</FormLabel>
                      <FormControl>
                        <Input placeholder="Konu başlığı" {...field} data-testid="input-ticket-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesaj</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-ticket-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={sending} data-testid="button-submit-ticket">
                    {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Gönder
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {tickets.length > 0 ? (
            tickets.map((ticket) => {
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
                      <span>{issueTypeLabels[ticket.issueType]}</span>
                      <span>{formatDate(ticket.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz destek talebiniz yok.</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      #{selectedTicket.ticketNumber} - {issueTypeLabels[selectedTicket.issueType]}
                    </p>
                    {selectedTicket.orderNumber && (
                      <p className="text-sm text-muted-foreground">
                        Sipariş: #{selectedTicket.orderNumber}
                      </p>
                    )}
                  </div>
                  <Badge className={statusColors[selectedTicket.status]}>
                    {statusLabels[selectedTicket.status]}
                  </Badge>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.senderRole === "customer" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          msg.senderRole === "customer"
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
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      data-testid="input-message"
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} data-testid="button-send-message">
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
            <Card className="h-[600px] flex items-center justify-center">
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
