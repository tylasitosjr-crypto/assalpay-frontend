import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("assalpay_lang") || "fr"; // Default to French as requested!
  });

  const setLang = (newLang) => {
    localStorage.setItem("assalpay_lang", newLang);
    setLangState(newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
