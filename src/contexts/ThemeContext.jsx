import { createContext, useContext, useState } from "react";

export const ThemeContext = createContext(); // ✅ Exportación correcta

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    colors: {
      background: "#FFF7ED",
      primary: "#F97316",
      primaryHover: "#EA580C",
      text: "#1F2937",
      navbarBg: "#FFFFFF",
      navbarText: "#1F2937",
    },
    logo: "/assets/logo.png",
    siteName: "Menú Digital",
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ✅ Si `ThemeContext` no está disponible, devuelve valores por defecto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.error("⚠ ThemeContext no está disponible. Verifica que <ThemeProvider> envuelve toda la app.");
    return { theme: { colors: {}, logo: "", siteName: "Menú Digital" } };
  }
  return context;
};



