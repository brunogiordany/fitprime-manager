import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CrefPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CrefPopup({ open, onOpenChange, onSuccess }: CrefPopupProps) {
  const [cref, setCref] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const utils = trpc.useUtils();
  
  const updateProfileMutation = trpc.personal.update.useMutation({
    onSuccess: () => {
      toast.success("CREF cadastrado com sucesso!");
      utils.auth.me.invalidate();
      onOpenChange(false);
      setCref("");
      // Chamar callback de sucesso para continuar a ação
      setTimeout(() => {
        onSuccess();
      }, 100);
    },
    onError: (error) => {
      toast.error("Erro ao salvar CREF: " + error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!cref.trim()) {
      toast.error("Digite seu CREF");
      return;
    }
    
    // Validação básica do formato CREF (ex: 123456-G/SP)
    const crefRegex = /^\d{4,6}-[A-Z]\/[A-Z]{2}$/i;
    if (!crefRegex.test(cref.trim())) {
      toast.error("Formato inválido. Use: 123456-G/SP");
      return;
    }
    
    setIsSubmitting(true);
    updateProfileMutation.mutate({ cref: cref.trim().toUpperCase() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Cadastre seu CREF
          </DialogTitle>
          <DialogDescription>
            Para usar recursos de IA, precisamos do seu registro profissional.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">Por que precisamos do CREF?</p>
                <p className="text-xs text-purple-700 mt-1">
                  Os recursos de IA geram treinos e análises profissionais. 
                  O CREF garante que apenas profissionais habilitados utilizem essas funcionalidades.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cref">Número do CREF</Label>
            <Input
              id="cref"
              placeholder="Ex: 123456-G/SP"
              value={cref}
              onChange={(e) => setCref(e.target.value.toUpperCase())}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Formato: número-categoria/estado (ex: 123456-G/SP)
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !cref.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar e Continuar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
