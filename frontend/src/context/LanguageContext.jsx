import { createContext, useContext, useEffect, useState } from "react";
import { t, setCurrentLang } from "../lib/i18n.js";

const LANG_KEY = "goldledger_lang";
const LanguageContext = createContext(null);

function savedLang() {
  try {
    const value = localStorage.getItem(LANG_KEY);
    if (value === "hi" || value === "en") return value;
  } catch (err) {
    // storage blocked, use the default
  }
  return "en";
}

// first load: set the language before anything renders
setCurrentLang(savedLang());

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(savedLang());

  useEffect(
    function () {
      document.documentElement.lang = lang;
    },
    [lang]
  );

  function changeLang(next) {
    setCurrentLang(next);
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch (err) {
      // fine, it just won't be remembered
    }
  }

  function toggle() {
    changeLang(lang === "hi" ? "en" : "hi");
  }

  const value = { lang: lang, setLang: changeLang, toggle: toggle, t: t };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// every component that shows text calls this, so it re-renders when the language changes
export function useLang() {
  return useContext(LanguageContext);
}
