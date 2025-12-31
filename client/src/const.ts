export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
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
