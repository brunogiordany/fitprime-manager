import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap } from "lucide-react";
import { PLANS } from "@/../../shared/plans";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const plansArray = Object.values(PLANS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Planos para Todos os Tamanhos
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Escolha o plano perfeito para sua academia ou consultório
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingPeriod === "monthly"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              billingPeriod === "annual"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Anual (20% off)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {plansArray.map((plan, index) => {
            const isPopular = index === 2; // Business é o mais popular
            const monthlyPrice = plan.price;
            const annualPrice = Math.floor(monthlyPrice * 12 * 0.8); // 20% desconto

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all hover:shadow-lg ${
                  isPopular ? "border-blue-500 border-2 lg:scale-105" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={isPopular ? "pt-8" : ""}>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  {/* Price */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        R$ {billingPeriod === "monthly" ? monthlyPrice : Math.floor(annualPrice / 12)}
                      </span>
                      <span className="text-slate-600">/mês</span>
                    </div>
                    {billingPeriod === "annual" && (
                      <p className="text-sm text-green-600 mt-2">
                        R$ {annualPrice}/ano (economize R$ {Math.floor(monthlyPrice * 12 * 0.2)})
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Student Limit */}
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600">Limite de alunos</p>
                    <p className="text-2xl font-bold text-blue-600">{plan.studentLimit}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Aluno extra: R$ {plan.extraStudentPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <a
                    href={plan.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      className={`w-full ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                      }`}
                    >
                      Começar Agora
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Posso mudar de plano a qualquer momento?
              </h3>
              <p className="text-slate-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As cobranças serão ajustadas proporcionalmente.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                O que acontece se eu exceder o limite de alunos?
              </h3>
              <p className="text-slate-600">
                Você será cobrado automaticamente pelo número de alunos extras. Por exemplo, no plano Starter (15 alunos), se tiver 20 alunos, será cobrado R$ 6,47 por cada aluno extra.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Há período de teste gratuito?
              </h3>
              <p className="text-slate-600">
                Sim! Todos os planos incluem 1 dia de teste gratuito. Você pode explorar todas as funcionalidades sem cobranças.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">
                Preciso de um plano customizado?
              </h3>
              <p className="text-slate-600">
                Para estúdios muito grandes ou necessidades especiais, entre em contato conosco. Podemos criar um plano Enterprise customizado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
