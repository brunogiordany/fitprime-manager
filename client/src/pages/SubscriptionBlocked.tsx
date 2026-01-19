import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Clock, ExternalLink } from "lucide-react";

interface SubscriptionBlockedProps {
  status: 'overdue' | 'cancelled' | 'expired' | 'trial_expired';
  daysOverdue: number;
  expiresAt?: Date | null;
  message: string;
}

// URL de checkout da Cakto para o FitPrime Manager - Redireciona para página de planos
const PLANS_URL = "/planos-fitprime";

// Número oficial do WhatsApp FitPrime
const FITPRIME_WHATSAPP = "5545999480236";

export default function SubscriptionBlocked({ status, daysOverdue, message }: SubscriptionBlockedProps) {
  const handleRenew = () => {
    // Redireciona para página de planos ao invés de checkout direto
    window.location.href = PLANS_URL;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-red-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">
            {status === 'cancelled' ? 'Assinatura Cancelada' : 
             status === 'expired' ? 'Assinatura Expirada' : 
             status === 'trial_expired' ? 'Período de Teste Encerrado' :
             'Pagamento em Atraso'}
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700">
                  {status === 'overdue' && daysOverdue > 0 
                    ? `${daysOverdue} dia(s) em atraso`
                    : status === 'cancelled' 
                    ? 'Assinatura foi cancelada'
                    : status === 'trial_expired'
                    ? 'Seu período de teste de 1 dia terminou'
                    : 'Assinatura expirou'}
                </p>
                <p className="text-sm text-red-600">
                  Seu acesso ao FitPrime Manager está temporariamente suspenso
                </p>
              </div>
            </div>
          </div>

          {/* What's blocked */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">O que está bloqueado:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Gerenciamento de alunos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Criação de treinos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Agendamento de sessões
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Automações e relatórios
              </li>
            </ul>
          </div>

          {/* Renew CTA */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleRenew}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Renovar Assinatura
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-center text-xs text-gray-500">
              Após o pagamento, seu acesso será restaurado automaticamente em até 5 minutos.
            </p>
          </div>

          {/* Support */}
          <div className="border-t pt-4">
            <p className="text-center text-sm text-gray-500">
              Precisa de ajuda?{" "}
              <a 
                href={`https://wa.me/${FITPRIME_WHATSAPP}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                Fale conosco no WhatsApp
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
