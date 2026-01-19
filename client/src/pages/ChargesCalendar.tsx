import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Charge {
  id: number;
  studentId: number;
  description: string;
  amount: string;
  dueDate: Date | string;
  status: string;
  student?: {
    id: number;
    name: string;
    phone?: string | null;
  };
}

export default function ChargesCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  const { data: charges, isLoading } = trpc.charges.list.useQuery({});
  const { data: students } = trpc.students.list.useQuery({});

  const utils = trpc.useUtils();

  const updateMutation = trpc.charges.update.useMutation({
    onSuccess: () => {
      toast.success("Cobrança atualizada!");
      utils.charges.list.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Agrupar cobranças por data de vencimento
  const chargesByDate = useMemo(() => {
    if (!charges) return new Map<string, Charge[]>();
    
    const grouped = new Map<string, Charge[]>();
    charges.forEach((item) => {
      const dueDate = item.charge.dueDate instanceof Date ? item.charge.dueDate : new Date(item.charge.dueDate);
      const dateKey = format(dueDate, 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      existing.push({
        ...item.charge,
        student: item.student,
      } as unknown as Charge);
      grouped.set(dateKey, existing);
    });
    return grouped;
  }, [charges]);

  // Dias do mês atual
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    if (!charges) return { pending: 0, paid: 0, overdue: 0, total: 0 };
    
    const monthCharges = charges.filter((item) => {
      const dueDate = item.charge.dueDate instanceof Date ? item.charge.dueDate : new Date(item.charge.dueDate);
      return isSameMonth(dueDate, currentMonth);
    });

    return {
      pending: monthCharges.filter(c => c.charge.status === 'pending').reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0),
      paid: monthCharges.filter(c => c.charge.status === 'paid').reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0),
      overdue: monthCharges.filter(c => c.charge.status === 'overdue').reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0),
      total: monthCharges.reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0),
    };
  }, [charges, currentMonth]);

  // Cobranças do dia selecionado
  const selectedDateCharges = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return chargesByDate.get(dateKey) || [];
  }, [selectedDate, chargesByDate]);

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Atrasado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = (chargeId: number) => {
    updateMutation.mutate({
      id: chargeId,
      status: "paid",
    });
    setSelectedCharge(null);
  };

  const handleSendReminder = (charge: Charge) => {
    if (!charge.student?.phone) {
      toast.error("Aluno não tem telefone cadastrado");
      return;
    }
    
    const dueDate = charge.dueDate instanceof Date ? charge.dueDate : new Date(charge.dueDate);
    const message = `Olá ${charge.student.name}! 👋\n\nLembramos que sua mensalidade de ${formatCurrency(charge.amount)} vence em ${format(dueDate, "dd/MM/yyyy")}.\n\nQualquer dúvida, estamos à disposição! 💪`;
    
    const whatsappUrl = `https://wa.me/55${charge.student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("Abrindo WhatsApp...");
  };

  const getDayChargesInfo = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayCharges = chargesByDate.get(dateKey) || [];
    
    if (dayCharges.length === 0) return null;
    
    const total = dayCharges.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
    const hasOverdue = dayCharges.some(c => c.status === 'overdue');
    const hasPending = dayCharges.some(c => c.status === 'pending');
    const allPaid = dayCharges.every(c => c.status === 'paid');
    
    return {
      count: dayCharges.length,
      total,
      hasOverdue,
      hasPending,
      allPaid,
    };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda de Cobranças</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie cobranças no calendário
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Estatísticas do Mês */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthStats.total)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(monthStats.paid)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(monthStats.pending)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(monthStats.overdue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendário */}
        <Card>
          <CardContent className="p-4">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {/* Espaços vazios para alinhar o primeiro dia */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}
              
              {monthDays.map((day) => {
                const dayInfo = getDayChargesInfo(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      h-24 p-1 border rounded-lg cursor-pointer transition-all
                      ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border'}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                      hover:bg-muted/50
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      
                      {dayInfo && (
                        <div className="flex-1 flex flex-col justify-end gap-1">
                          <div className="flex items-center gap-1">
                            {dayInfo.hasOverdue && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            {dayInfo.hasPending && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                            {dayInfo.allPaid && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                          </div>
                          <div className="text-xs font-medium truncate">
                            {dayInfo.count} cobrança{dayInfo.count > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatCurrency(dayInfo.total)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de cobranças do dia selecionado */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cobranças de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {selectedDateCharges.length} cobrança{selectedDateCharges.length !== 1 ? 's' : ''} para este dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateCharges.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma cobrança para este dia
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateCharges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedCharge(charge)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(charge.status)}`} />
                        <div>
                          <p className="font-medium">{charge.student?.name || 'Aluno'}</p>
                          <p className="text-sm text-muted-foreground">{charge.description}</p>
                          
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(charge.amount)}</p>
                          {getStatusBadge(charge.status)}
                        </div>
                        <div className="flex gap-1">
                          {charge.status !== 'paid' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendReminder(charge);
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsPaid(charge.id);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Próximos vencimentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
            <CardDescription>
              Cobranças pendentes nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = new Date();
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              
              const upcomingCharges = charges
                ?.filter((item) => {
                  const dueDate = item.charge.dueDate instanceof Date ? item.charge.dueDate : new Date(item.charge.dueDate);
                  return item.charge.status === 'pending' && dueDate >= today && dueDate <= nextWeek;
                })
                .sort((a, b) => {
                  const dateA = a.charge.dueDate instanceof Date ? a.charge.dueDate : new Date(a.charge.dueDate);
                  const dateB = b.charge.dueDate instanceof Date ? b.charge.dueDate : new Date(b.charge.dueDate);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 10);

              if (!upcomingCharges || upcomingCharges.length === 0) {
                return (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma cobrança pendente nos próximos 7 dias
                  </p>
                );
              }

              return (
                <div className="space-y-2">
                  {upcomingCharges.map((item) => (
                    <div
                      key={item.charge.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <div>
                          <p className="font-medium">{item.student?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence em {format(item.charge.dueDate instanceof Date ? item.charge.dueDate : new Date(item.charge.dueDate), "dd/MM")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(item.charge.amount)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder({
                            ...item.charge,
                            student: item.student,
                          } as unknown as Charge)}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Dialog de detalhes da cobrança */}
        <Dialog open={!!selectedCharge} onOpenChange={() => setSelectedCharge(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Cobrança</DialogTitle>
              <DialogDescription>
                {selectedCharge?.student?.name} - {selectedCharge?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCharge && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedCharge.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{format(selectedCharge.dueDate instanceof Date ? selectedCharge.dueDate : new Date(selectedCharge.dueDate), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedCharge.status)}
                  </div>
                  
                </div>
                
                {selectedCharge.student?.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedCharge.student.phone}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              {selectedCharge?.status !== 'paid' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => selectedCharge && handleSendReminder(selectedCharge)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Lembrete
                  </Button>
                  <Button onClick={() => selectedCharge && handleMarkAsPaid(selectedCharge.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
