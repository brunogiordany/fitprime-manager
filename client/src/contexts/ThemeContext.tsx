import React, { createContext, useContext, useEffect, useState } from "react";

// Tipos de tema disponíveis (inclui 'auto' para seguir preferência do sistema)
export type ThemePreference = "auto" | "white" | "dark" | "premium";
export type ResolvedTheme = "white" | "dark" | "premium";

// Labels amigáveis para exibição
export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: "Automático",
  white: "Claro",
  dark: "Escuro",
  premium: "Premium",
};

// Descrições dos temas
export const THEME_DESCRIPTIONS: Record<ThemePreference, string> = {
  auto: "Segue a preferência do sistema operacional",
  white: "Tema claro padrão",
  dark: "Tema escuro para ambientes com pouca luz",
  premium: "Tema premium com visual sofisticado",
};

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

// Função para detectar preferência do sistema
function getSystemPreference(): "white" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "white";
  }
  return "white";
}

// Função para resolver o tema baseado na preferência
function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "auto") {
    return getSystemPreference();
  }
  return preference;
}

export function ThemeProvider({
  children,
  defaultTheme = "auto",
  switchable = true,
}: ThemeProviderProps) {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    if (switchable) {
      const stored = localStorage.getItem("fitprime-theme");
      if (stored && ["auto", "white", "dark", "premium"].includes(stored)) {
        return stored as ThemePreference;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => 
    resolveTheme(themePreference)
  );

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    if (themePreference !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "white");
    };

    // Atualiza o tema resolvido quando a preferência do sistema muda
    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themePreference]);

  // Atualiza o tema resolvido quando a preferência muda
  useEffect(() => {
    setResolvedTheme(resolveTheme(themePreference));
  }, [themePreference]);

  // Aplica as classes CSS baseado no tema resolvido
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove("dark", "premium", "light");
    
    // Adiciona a classe do tema resolvido
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else if (resolvedTheme === "premium") {
      root.classList.add("premium");
      root.classList.add("dark"); // Premium também usa dark mode como base
    }
    // White não precisa de classe especial (é o padrão)

    if (switchable) {
      localStorage.setItem("fitprime-theme", themePreference);
    }
  }, [resolvedTheme, themePreference, switchable]);

  const setTheme = (newTheme: ThemePreference) => {
    if (switchable) {
      setThemePreference(newTheme);
    }
  };

  // toggleTheme agora cicla entre os 4 temas
  const toggleTheme = switchable
    ? () => {
        setThemePreference(prev => {
          if (prev === "auto") return "white";
          if (prev === "white") return "dark";
          if (prev === "dark") return "premium";
          return "auto";
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ 
      theme: themePreference, 
      resolvedTheme,
      setTheme, 
      toggleTheme, 
      switchable 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Alias para compatibilidade (Theme agora é ThemePreference)
export type Theme = ThemePreference;
