import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Dumbbell, 
  Users, 
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
type UserType = "select" | "student" | "personal";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [userType, setUserType] = useState<UserType>("select");

  const handlePersonalLogin = () => {
    // Redirecionar para a página de login própria do personal
    setLocation("/login-personal");
  };

  const handleStudentLogin = () => {
    // Redirecionar para a página de login do aluno
    setLocation("/login-aluno");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FitPrime</span>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-gray-800/50 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-white">
              {userType === "select" ? "Bem-vindo ao FitPrime" : ""}
              {userType === "student" ? "Portal do Aluno" : ""}
              {userType === "personal" ? "Área do Personal" : ""}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {userType === "select" ? "Escolha como deseja acessar" : ""}
              {userType === "student" ? "Acesse seus treinos e evolução" : ""}
              {userType === "personal" ? "Gerencie seus alunos e negócio" : ""}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {userType === "select" && (
              <>
                {/* Opção Sou Aluno */}
                <button
                  onClick={handleStudentLogin}
                  className="w-full p-6 rounded-xl border-2 border-gray-700 hover:border-emerald-500 bg-gray-800/50 hover:bg-emerald-500/10 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        Sou Aluno
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-gray-400">
                        Acesse seus treinos, acompanhe sua evolução e veja sua agenda
                      </p>
                    </div>
                  </div>
                </button>

                {/* Opção Sou Personal */}
                <button
                  onClick={handlePersonalLogin}
                  className="w-full p-6 rounded-xl border-2 border-gray-700 hover:border-purple-500 bg-gray-800/50 hover:bg-purple-500/10 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        Sou Personal
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-gray-400">
                        Gerencie alunos, crie treinos com IA e automatize cobranças
                      </p>
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-sm text-gray-500 bg-gray-800/50">ou</span>
                  </div>
                </div>

                {/* CTA para quem não tem conta */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-400">
                    Ainda não é cliente FitPrime?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => setLocation("/quiz")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Descobrir meu plano ideal
                  </Button>
                </div>
              </>
            )}

            {/* Botão Voltar */}
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o início
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} FitPrime. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
