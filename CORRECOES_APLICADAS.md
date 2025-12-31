# Correções Aplicadas - FitPrime Manager

## Data: 30/12/2025

### 1. Erro na página /evolucao - "Failed to construct 'URL': Invalid URL"

**Problema:** A página /evolucao estava dando erro de runtime porque o hook `useAuth` chamava `getLoginUrl()` como valor padrão do parâmetro `redirectPath`, e a função tentava criar uma URL com variáveis de ambiente não configuradas (`VITE_OAUTH_PORTAL_URL`).

**Arquivo afetado:** `/client/src/const.ts`

**Solução aplicada:** Adicionada verificação para tratar URLs inválidas ou variáveis de ambiente não configuradas, retornando `/login` como fallback.

```typescript
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Se não houver URL do OAuth configurada, retornar para página de login local
  if (!oauthPortalUrl || oauthPortalUrl === 'undefined' || oauthPortalUrl === '') {
    return '/login';
  }

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId || '');
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    // Se a URL for inválida, retornar para página de login local
    console.warn('OAuth URL inválida, usando login local:', error);
    return '/login';
  }
};
```

**Status:** ✅ CORRIGIDO - A página agora redireciona para login ao invés de dar erro.

---

### 2. Erro de inicialização do Stripe

**Problema:** O servidor não iniciava porque o Stripe tentava ser inicializado sem uma API key configurada.

**Arquivo afetado:** `/server/stripe/index.ts`

**Solução aplicada:** Modificada a inicialização do Stripe para ser lazy e verificar se a chave está configurada antes de criar a instância.

**Status:** ✅ CORRIGIDO

---

## Pendências Restantes (do documento de migração)

- [ ] 18. Planos de fábrica (6 planos mensais pré-definidos)
- [ ] 19. Comparativo entre métodos de BF (estimado vs bio vs adi)
- [ ] 20. Histórico de sessões por treino
- [ ] 21. Comparativo de evolução de carga
