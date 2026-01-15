import { MessageCircle } from "lucide-react";

export default function LandingPageCaptura01() {
  const whatsappLink = "https://chat.whatsapp.com/SEU_GRUPO_AQUI"; // Substituir pelo link real

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 max-w-2xl mx-auto">
        
        {/* Exclusivity Text */}
        <p className="text-gray-400 text-center text-sm md:text-base mb-8 leading-relaxed">
          - Aula exclusiva apenas para quem já é <span className="text-white font-semibold">PERSONAL TRAINER</span>
          <br />
          <span className="text-gray-500">(se você não é personal ou preparador físico, saia dessa página!)</span>
        </p>

        {/* Main Headline */}
        <h1 className="text-2xl md:text-4xl font-bold text-center leading-tight mb-10">
          O Sistema que usei para sair de{" "}
          <span className="text-green-400">5 alunos para 47 alunos</span>
          <br />
          <span className="text-green-400">em 90 dias</span> Trabalhando Menos
        </h1>

        {/* Bullet Points */}
        <div className="space-y-6 mb-12">
          <div className="flex items-start gap-4">
            <span className="text-green-500 text-2xl mt-1">✓</span>
            <p className="text-lg md:text-xl leading-relaxed">
              O <span className="font-bold">Sistema de Gestão</span> que me fez parar de perder alunos por desorganização e falta de acompanhamento;
            </p>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-green-500 text-2xl mt-1">✓</span>
            <p className="text-lg md:text-xl leading-relaxed">
              Como criei um <span className="font-bold">Fluxo de Atendimento que me permite ter +40% de RETENÇÃO</span> através de automações inteligentes;
            </p>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-green-500 text-2xl mt-1">✓</span>
            <p className="text-lg md:text-xl leading-relaxed">
              A <span className="font-bold">Estrutura de Gestão para Personal</span> que você precisa ter para sair de 5 alunos para mais de <span className="font-bold">50 alunos/mês</span>.
            </p>
          </div>
        </div>
      </main>

      {/* Red Banner */}
      <div className="bg-red-600 py-4 text-center">
        <p className="text-xl md:text-2xl font-bold italic">
          QUINTA-FEIRA | 20h
        </p>
        <p className="text-lg md:text-xl">
          Limite de 100 vagas no Grupo VIP
        </p>
      </div>

      {/* CTA Button */}
      <div className="bg-black py-8 px-6">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full max-w-md mx-auto"
        >
          <button className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-bold text-xl py-5 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]">
            <MessageCircle className="w-7 h-7" />
            Entrar no Grupo VIP
          </button>
        </a>
      </div>
    </div>
  );
}
