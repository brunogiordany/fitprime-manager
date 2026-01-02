import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Clock, X, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ExitIntentPopupProps {
  enabled?: boolean;
  delay?: number; // Delay em ms antes de ativar detecção
}

export default function ExitIntentPopup({ enabled = true, delay = 3000 }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTrialMutation = trpc.trial.createTrial.useMutation();

  // Detectar exit intent (mouse saindo da viewport)
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !hasShown && enabled) {
      setIsOpen(true);
      setHasShown(true);
      // Salvar no localStorage para não mostrar novamente na sessão
      localStorage.setItem("exitIntentShown", "true");
    }
  }, [hasShown, enabled]);

  // Detectar back button (popstate)
  const handlePopState = useCallback(() => {
    if (!hasShown && enabled) {
      // Prevenir navegação
      window.history.pushState(null, "", window.location.href);
      setIsOpen(true);
      setHasShown(true);
      localStorage.setItem("exitIntentShown", "true");
    }
  }, [hasShown, enabled]);

  useEffect(() => {
    // Verificar se já mostrou nesta sessão
    const alreadyShown = localStorage.getItem("exitIntentShown");
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    // Adicionar entrada no histórico para detectar back button
    window.history.pushState(null, "", window.location.href);

    // Delay antes de ativar detecção
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("popstate", handlePopState);
    }, delay);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [handleMouseLeave, handlePopState, delay]);

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  // Formatação de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  // Validação básica de CPF
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await createTrialMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        cpf: formData.cpf.replace(/\D/g, ""),
      });
      
      setIsSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = "/cadastro-trial";
      }, 2000);
    } catch (error: any) {
      if (error.message?.includes("CPF já cadastrado")) {
        setErrors({ cpf: "Este CPF já possui uma conta. Faça login." });
      } else {
        setErrors({ submit: "Erro ao criar conta. Tente novamente." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enabled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Conta Criada!</h3>
            <p className="text-gray-600 mb-4">
              Seu trial de 1 dia foi ativado. Redirecionando...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
          </div>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Gift className="w-7 h-7 text-amber-600" />
              </div>
              <DialogTitle className="text-2xl">Espera! 🎁</DialogTitle>
              <DialogDescription className="text-base">
                Antes de ir, que tal testar o FitPrime <strong>GRÁTIS por 1 dia</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Benefícios */}
              <div className="bg-emerald-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acesso completo a todas as funcionalidades</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cancela quando quiser</span>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    className={errors.cpf ? "border-red-500" : ""}
                  />
                  {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-500 text-center">{errors.submit}</p>
                )}
              </div>

              {/* CTA */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Quero Testar Grátis!
                  </>
                )}
              </Button>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Oferta expira em breve</span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
