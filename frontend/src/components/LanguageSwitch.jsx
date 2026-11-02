import { useLang } from "../context/LanguageContext.jsx";

// small EN | हिं switch
export default function LanguageSwitch({ dark }) {
  const { lang, setLang, t } = useLang();

  return (
    <div className={"lang-switch" + (dark ? " lang-switch-dark" : "")} role="group" aria-label={t("lang.label")}>
      <button type="button" className={lang === "en" ? "is-active" : ""} onClick={() => setLang("en")}>
        EN
      </button>
      <button type="button" className={lang === "hi" ? "is-active" : ""} onClick={() => setLang("hi")}>
        हिं
      </button>
    </div>
  );
}
