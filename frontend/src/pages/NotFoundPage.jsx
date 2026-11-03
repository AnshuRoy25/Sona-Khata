import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

export default function NotFoundPage() {
  const { t } = useLang();
  usePageTitle(t("notFound.text"));

  return (
    <div className="not-found">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">SonaKhata</span>
      </Link>
      <p>{t("notFound.text")}</p>
      <Link to="/" className="btn btn-primary">
        {t("notFound.back")}
      </Link>
    </div>
  );
}
