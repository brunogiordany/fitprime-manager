import React, { createContext, useContext, useEffect, useState } from "react";

// Tipos de tema disponíveis
export type Theme = "white" | "dark" | "premium";

// Labels amigáveis para exibição
export const THEME_LABELS: Record<Theme, string> = {
  white: "Claro",
  dark: "Escuro",
  premium: "Premium",
};

// Descrições dos temas
export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  white: "Tema claro padrão",
  dark: "Tema escuro para ambientes com pouca luz",
  premium: "Tema premium com visual sofisticado",
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "white",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("fitprime-theme");
      if (stored && ["white", "dark", "premium"].includes(stored)) {
        return stored as Theme;
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove("dark", "premium", "light");
    
    // Adiciona a classe do tema atual
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "premium") {
      root.classList.add("premium");
      root.classList.add("dark"); // Premium também usa dark mode como base
    }
    // White não precisa de classe especial (é o padrão)

    if (switchable) {
      localStorage.setItem("fitprime-theme", theme);
    }
  }, [theme, switchable]);

  const setTheme = (newTheme: Theme) => {
    if (switchable) {
      setThemeState(newTheme);
    }
  };

  // toggleTheme agora cicla entre os 3 temas
  const toggleTheme = switchable
    ? () => {
        setThemeState(prev => {
          if (prev === "white") return "dark";
          if (prev === "dark") return "premium";
          return "white";
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, switchable }}>
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
