import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Maximize, X, ExternalLink, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FITPRIME_PLANS } from "../../../shared/caktoPlans";

// Ordem dos slides conforme o slide_state.json
const SLIDES = [
  { id: "cover", title: "FitPrime Manager", image: "/presentation/cover_generated.webp" },
  { id: "problem", title: "As Dores do Personal Trainer", image: "/presentation/problem_generated.webp" },
  { id: "solution", title: "A Solução FitPrime", image: "/presentation/solution_generated.webp" },
  { id: "students", title: "1. Gestão de Alunos", image: "/presentation/students_generated.webp" },
  { id: "anamnesis", title: "2. Anamnese Inteligente", image: "/presentation/anamnesis_generated.webp" },
  { id: "ai_workouts", title: "3. Treinos com IA", image: "/presentation/ai_workouts_generated.webp" },
  { id: "workout_log", title: "4. Diário do Maromba", image: "/presentation/workout_log_generated.webp" },
  { id: "schedule", title: "5. Agenda Inteligente", image: "/presentation/schedule_generated.webp" },
  { id: "billing", title: "6. Cobranças e Planos", image: "/presentation/billing_generated.webp" },
  { id: "evolution", title: "7. Evolução e Medidas", image: "/presentation/evolution_generated.webp" },
  { id: "photos", title: "8. Fotos de Evolução", image: "/presentation/photos_generated.webp" },
  { id: "dashboard", title: "9. Relatórios e Dashboards", image: "/presentation/dashboard_generated.webp" },
  { id: "cardio", title: "10. Cardio", image: "/presentation/cardio_generated.webp" },
  { id: "chat", title: "11. Chat FitPrime", image: "/presentation/chat_generated.webp" },
  { id: "whatsapp", title: "12. WhatsApp Integrado", image: "/presentation/whatsapp_generated.webp" },
  { id: "automations", title: "13. Automações", image: "/presentation/automations_generated.webp" },
  { id: "gamification", title: "14. Gamificação", image: "/presentation/gamification_generated.webp" },
  { id: "calculators", title: "15. Calculadoras Fitness", image: "/presentation/calculators_generated.webp" },
  { id: "student_portal", title: "16. Portal do Aluno", image: "/presentation/student_portal_generated.webp" },
  { id: "ai_analysis", title: "17. Análise por IA", image: "/presentation/ai_analysis_generated.webp" },
  { id: "nutrition", title: "18. FitPrime Nutrition", image: "/presentation/nutrition_generated.webp" },
  { id: "pwa", title: "19. Modo Offline (PWA)", image: "/presentation/pwa_generated.webp" },
  { id: "security", title: "20. Segurança", image: "/presentation/security_generated.webp" },
  { id: "pricing", title: "Planos e Preços", image: "/presentation/pricing_generated.webp" },
  { id: "cta", title: "Comece Agora", image: "/presentation/cta_generated.webp" },
];

// Links de checkout
const CHECKOUT_LINKS = {
  trial: "/cadastro-trial",
  starter: FITPRIME_PLANS.find(p => p.id === "starter")?.checkoutUrl || "/checkout?plan=starter",
  beginner: FITPRIME_PLANS.find(p => p.id === "beginner")?.checkoutUrl || "/checkout?plan=beginner",
  pro: FITPRIME_PLANS.find(p => p.id === "pro")?.checkoutUrl || "/checkout?plan=pro",
};

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= SLIDES.length - 1) {
          setIsPlaying(false);
          setShowCTA(true);
          return prev;
        }
        return prev + 1;
      });
    }, 5000); // 5 segundos por slide

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  // Mostrar CTA no final
  useEffect(() => {
    if (currentSlide === SLIDES.length - 1) {
      setShowCTA(true);
    }
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTrialClick = () => {
    window.location.href = CHECKOUT_LINKS.trial;
  };

  const handleBuyClick = () => {
    window.location.href = CHECKOUT_LINKS.starter;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">FitPrime Manager</h1>
                <p className="text-slate-400 text-sm">Apresentação Comercial</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleTrialClick}
                variant="outline"
                className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Clock className="w-4 h-4 mr-2" />
                Teste Grátis 24h
              </Button>
              <Button
                onClick={handleBuyClick}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Assinar Agora
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={`${isFullscreen ? 'h-screen' : 'py-8'}`}>
        <div className={`${isFullscreen ? 'h-full' : 'max-w-7xl mx-auto px-6'}`}>
          {/* Slide Container */}
          <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-video'} bg-black rounded-xl overflow-hidden shadow-2xl`}>
            {/* Slide Image */}
            <img
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].title}
              className="w-full h-full object-contain"
            />

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentSlide === SLIDES.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <span className="text-white text-sm">
                    {currentSlide + 1} / {SLIDES.length}
                  </span>
                </div>

                <div className="flex-1 mx-8">
                  <div className="flex gap-1">
                    {SLIDES.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          index === currentSlide
                            ? 'bg-emerald-500'
                            : index < currentSlide
                            ? 'bg-white/50'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                >
                  {isFullscreen ? <X className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Slide Title */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">{SLIDES[currentSlide].title}</span>
            </div>
          </div>

          {/* Thumbnails */}
          {!isFullscreen && (
            <div className="mt-6 overflow-x-auto pb-4">
              <div className="flex gap-3 min-w-max">
                {SLIDES.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden transition-all ${
                      index === currentSlide
                        ? 'ring-2 ring-emerald-500 scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                      <span className="text-white text-[10px] font-medium truncate">{slide.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Modal */}
      {showCTA && !isFullscreen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowCTA(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Pronto para Transformar seu Negócio?
              </h2>
              <p className="text-slate-400 mb-8">
                Comece agora mesmo com um teste grátis de 24 horas. Sem cartão de crédito.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleTrialClick}
                  className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Começar Teste Grátis (24h)
                </Button>
                
                <Button
                  onClick={handleBuyClick}
                  variant="outline"
                  className="w-full h-14 text-lg border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Assinar Plano Starter - R$ 97/mês
                </Button>
              </div>

              <p className="text-slate-500 text-sm mt-6">
                Mais de 500 personal trainers já confiam no FitPrime
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA Bar */}
      {!isFullscreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 py-4 px-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-white">
              <p className="font-bold">Comece seu teste grátis de 24 horas</p>
              <p className="text-emerald-100 text-sm">Sem cartão de crédito • Cancele quando quiser</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleTrialClick}
                variant="secondary"
                className="bg-white text-emerald-600 hover:bg-emerald-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Teste Grátis
              </Button>
              <Button
                onClick={handleBuyClick}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Assinar Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
