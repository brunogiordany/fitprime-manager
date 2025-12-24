import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, X } from "lucide-react";

interface Session {
  id: number;
  studentId: number;
  scheduledAt: string;
  duration: number | null;
  status: string;
  type: string | null;
  student?: {
    id: number;
    name: string;
    phone: string | null;
  } | null;
}

interface DaySessionsPopupProps {
  date: Date | null;
  sessions: Session[];
  isOpen: boolean;
  onClose: () => void;
  onSessionClick: (session: Session) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-500';
    case 'confirmed': return 'bg-emerald-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-gray-400';
    case 'no_show': return 'bg-red-500';
    case 'waiting': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'scheduled': return 'Agendada';
    case 'confirmed': return 'Confirmada';
    case 'completed': return 'Realizada';
    case 'cancelled': return 'Cancelada';
    case 'no_show': return 'Falta';
    case 'waiting': return 'Aguardando';
    default: return status;
  }
};

export default function DaySessionsPopup({ date, sessions, isOpen, onClose, onSessionClick }: DaySessionsPopupProps) {
  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma sessão neste dia
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity text-white ${getStatusColor(session.status)}`}
                  onClick={() => onSessionClick(session)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(session.scheduledAt), "HH:mm")}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                      {getStatusLabel(session.status)}
                    </Badge>
                  </div>
                  <p className="font-medium mt-1">{session.student?.name}</p>
                  {session.type && (
                    <p className="text-sm opacity-80 capitalize">{session.type}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
