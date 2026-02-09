import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";
type ThemeMode = "system" | "light" | "dark";

// Professional Typography System
interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// Professional Spacing System
interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
}

// Professional Color Palette
interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  
  // Surface colors
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  
  // Card colors
  card: string;
  cardHover: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderFocus: string;
  
  // Brand colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryText: string;
  
  // Semantic colors
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Special
  overlay: string;
  shadow: string;
}

// Light Theme - Premium & Professional
const lightTheme: ThemeColors = {
  background: "#FAFAFA",
  foreground: "#F5F5F5",
  
  surface: "#FFFFFF",
  surfaceHover: "#F8F9FA",
  surfaceActive: "#F1F3F5",
  
  card: "#FFFFFF",
  cardHover: "#FAFAFA",
  
  text: "#09090B",
  textSecondary: "#3F3F46",
  textTertiary: "#71717A",
  textMuted: "#A1A1AA",
  
  border: "#E4E4E7",
  borderLight: "#F4F4F5",
  borderFocus: "#6366F1",
  
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  primaryActive: "#4338CA",
  primaryText: "#FFFFFF",
  
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",
  
  accent: "#8B5CF6",
  accentLight: "#EDE9FE",
  
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.08)",
};

// Dark Theme - Premium & Professional
const darkTheme: ThemeColors = {
  background: "#09090B",
  foreground: "#18181B",
  
  surface: "#18181B",
  surfaceHover: "#27272A",
  surfaceActive: "#3F3F46",
  
  card: "#18181B",
  cardHover: "#27272A",
  
  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textMuted: "#52525B",
  
  border: "#27272A",
  borderLight: "#18181B",
  borderFocus: "#818CF8",
  
  primary: "#818CF8",
  primaryHover: "#6366F1",
  primaryActive: "#4F46E5",
  primaryText: "#FFFFFF",
  
  success: "#34D399",
  successLight: "#064E3B",
  error: "#F87171",
  errorLight: "#7F1D1D",
  warning: "#FBBF24",
  warningLight: "#78350F",
  info: "#60A5FA",
  infoLight: "#1E3A8A",
  
  accent: "#A78BFA",
  accentLight: "#4C1D95",
  
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

// Typography - Using system fonts for best performance
const typography: Typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing System
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  async function loadThemePreference() {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
    } finally {
      setIsLoaded(true);
    }
  }

  async function setThemeMode(mode: ThemeMode) {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  }

  // Determine actual theme based on mode
  const theme: Theme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const colors = theme === "dark" ? darkTheme : lightTheme;

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ 
        theme, 
        themeMode, 
        colors, 
        typography,
        spacing,
        isDark: theme === "dark", 
        setThemeMode 
      }}
    >
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

// Utility function for conditional styling
export function tw(isDark: boolean, lightClass: string, darkClass: string) {
  return isDark ? darkClass : lightClass;
}
