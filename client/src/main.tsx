import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";

import { OfflineProvider } from "./contexts/OfflineContext";
import { ProtectionLayer } from "./components/ProtectionLayer";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações para melhor suporte offline
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos (antigo cacheTime)
      retry: (failureCount, error) => {
        // Não tentar novamente se estiver offline
        if (!navigator.onLine) return false;
        // Máximo 3 tentativas
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // NÃO redirecionar para OAuth se estiver no portal do aluno
  // O portal do aluno tem seu próprio sistema de autenticação
  const currentPath = window.location.pathname;
  const isStudentPortal = currentPath.startsWith('/meu-portal') || 
                          currentPath.startsWith('/portal-aluno') || 
                          currentPath.startsWith('/portal') ||
                          currentPath.startsWith('/login-aluno') ||
                          currentPath.startsWith('/convite');
  
  if (isStudentPortal) {
    // Para o portal do aluno, não redirecionar para OAuth
    // O StudentPortalPage já tem sua própria lógica de autenticação
    console.log('[Auth] Ignorando redirecionamento OAuth no portal do aluno');
    return;
  }

  // Redirecionar para a página de login própria do FitPrime
  window.location.href = '/login';
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Enviar token do aluno se existir (para autenticação do portal do aluno)
        const studentToken = typeof window !== 'undefined' ? localStorage.getItem('studentToken') : null;
        if (studentToken) {
          return {
            'x-student-token': studentToken,
          };
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <ProtectionLayer />
        <App />
      </OfflineProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
