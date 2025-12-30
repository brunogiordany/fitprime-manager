import { useEffect } from "react";
import { useLocation } from "wouter";

// Este componente redireciona para o sistema de login de alunos
// O Portal do Aluno usa autenticação própria (email/senha), não o OAuth do Manus
export default function StudentDashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar se o aluno já está logado
    const studentToken = localStorage.getItem("studentToken");
    
    if (studentToken) {
      // Se já está logado, ir para o portal
      setLocation("/meu-portal");
    } else {
      // Se não está logado, ir para a página de login do aluno
      setLocation("/login-aluno");
    }
  }, [setLocation]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}
