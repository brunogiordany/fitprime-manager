import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Shield, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { FITPRIME_PLANS, getPlanById, type FitPrimePlan } from "../../../shared/caktoPlans";
import { pixelEvents } from "@/lib/tracking-pixels";

export default function CheckoutPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [plan, setPlan] = useState<FitPrimePlan | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(search);
    const urlPlan = params.get("plan");
    let selectedPlan: FitPrimePlan | null = null;
    
    if (urlPlan) {
      const foundPlan = getPlanById(urlPlan);
      if (foundPlan) {
        selectedPlan = foundPlan;
      } else {
        selectedPlan = FITPRIME_PLANS[1];
      }
    } else {
      selectedPlan = FITPRIME_PLANS[1];
    }
    
    setPlan(selectedPlan);
    
    // Meta Pixel - InitiateCheckout quando entra na página
    if (selectedPlan) {
      pixelEvents.initiateCheckout({
        contentIds: [selectedPlan.id],
        contentName: selectedPlan.name,
        contentType: 'product',
        value: selectedPlan.price,
        currency: 'BRL',
        numItems: 1,
      });
    }
  }, [search]);
  
  const handleCheckout = () => {
    if (!plan?.checkoutUrl) {
      alert("Link de checkout não disponível para este plano. Entre em contato conosco.");
      return;
    }
    
    // Meta Pixel - AddPaymentInfo quando clica em finalizar
    pixelEvents.addPaymentInfo({
      contentIds: [plan.id],
      contentCategory: 'subscription',
      value: plan.price,
      currency: 'BRL',
    });
    
    setIsRedirecting(true);
    // Redirecionar para o checkout da Cakto
    window.location.href = plan.checkoutUrl;
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/pricing")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para planos
        </Button>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <Badge className="w-fit mx-auto mb-4 bg-emerald-100 text-emerald-800">
              Plano Selecionado
            </Badge>
            <CardTitle className="text-3xl">{plan.name}</CardTitle>
            <CardDescription className="text-lg">{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Preço */}
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-emerald-600">
                  R$ {plan.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-gray-500 text-lg">/mês</span>
              </div>
              <p className="text-gray-500 mt-2">
                Até {plan.studentLimit} alunos inclusos
              </p>
              <p className="text-sm text-gray-400">
                Aluno extra: R$ {plan.extraStudentPrice.toFixed(2).replace(".", ",")}/mês
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3">
              <p className="font-semibold text-gray-800">O que está incluso:</p>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* CTA Button */}
            <Button
              onClick={handleCheckout}
              disabled={isRedirecting || !plan.checkoutUrl}
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirecionando...
                </>
              ) : !plan.checkoutUrl ? (
                "Em breve"
              ) : (
                <>
                  Assinar Agora
                  <ExternalLink className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            {/* Security Badges */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Pagamento seguro via Cakto</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão, Pix, Boleto</span>
                </div>
              </div>
              <p className="text-xs text-center text-gray-400">
                Cancele a qualquer momento. Sem multa ou fidelidade.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Trust Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Mais de 500 personal trainers confiam no FitPrime
          </p>
          <p className="text-xs text-gray-400">
            Suporte humanizado • Atualizações constantes • Comunidade ativa
          </p>
        </div>
      </div>
    </div>
  );
}
