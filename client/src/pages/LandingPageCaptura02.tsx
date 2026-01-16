import { MessageCircle } from "lucide-react";

export default function LandingPageCaptura02() {
  const whatsappLink = "https://chat.whatsapp.com/SEU_GRUPO_AQUI"; // Substituir pelo link real

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Main Content - Compacto para CTA above the fold */}
      <main className="flex-1 flex flex-col px-5 pt-8 pb-4 max-w-lg mx-auto">
        
        {/* Exclusivity Text */}
        <p className="text-gray-400 text-center text-sm mb-4 leading-relaxed">
          - Aula exclusiva apenas para quem já é <span className="text-white font-semibold">PERSONAL TRAINER</span>
          <br />
          <span className="text-gray-500 text-xs">(se você não é personal ou preparador físico, saia dessa página!)</span>
        </p>

        {/* Main Headline */}
        <h1 className="text-xl md:text-3xl font-bold text-center leading-tight mb-6">
          O Sistema de Gestão que usei para sair de{" "}
          <span className="text-green-400">R$3 mil para R$25mil/mês</span>
          <br />
          <span className="text-green-400">Treinando Presencial</span>
        </h1>

        {/* Bullet Points - Mais compactos */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl flex-shrink-0">✓</span>
            <p className="text-base leading-snug">
              O <span className="font-bold">Sistema de Gestão</span> que faz seus alunos ficarem COMPROMETIDOS e nunca mais cancelarem;
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl flex-shrink-0">✓</span>
            <p className="text-base leading-snug">
              Como criei um <span className="font-bold">Fluxo de Atendimento que me dá +60% de RETENÇÃO</span> através de automações inteligentes;
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-green-500 text-xl flex-shrink-0">✓</span>
            <p className="text-base leading-snug">
              A <span className="font-bold">Estrutura de Gestão para Personal</span> que você precisa ter para sair de 5 alunos para mais de <span className="font-bold">50 alunos/mês</span>.
            </p>
          </div>
        </div>

        {/* Red Banner - Inline */}
        <div className="bg-red-600 py-3 text-center rounded-lg mb-4">
          <p className="text-lg font-bold italic">
            QUINTA-FEIRA | 20h
          </p>
          <p className="text-sm">
            Limite de 100 vagas no Grupo VIP
          </p>
        </div>

        {/* CTA Button - Above the fold */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <button className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]">
            <MessageCircle className="w-6 h-6" />
            Entrar no Grupo VIP
          </button>
        </a>
      </main>
    </div>
  );
}
