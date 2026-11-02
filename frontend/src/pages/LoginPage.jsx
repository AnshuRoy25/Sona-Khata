import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import Icon from "../components/Icon.jsx";
import { sendLoginOtp, verifyLoginOtp, sendRegisterOtp, verifyRegisterOtp } from "../api/endpoints.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;

const LANGUAGES = [
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "हिन्दी" },
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ta", label: "தமிழ்" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [step, setStep] = useState("details"); // details | otp
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("karigar");
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  usePageTitle(mode === "login" ? t("auth.tab.login") : t("auth.tab.register"));

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function switchMode(next) {
    setMode(next);
    setStep("details");
    setError("");
    setOtp("");
  }

  async function requestCode() {
    if (mode === "login") {
      await sendLoginOtp(phone);
    } else {
      await sendRegisterOtp({
        phone: phone,
        name: name.trim(),
        role: role,
        language: language,
        shopName: role === "jeweller" ? shopName.trim() : undefined,
        city: city.trim() || undefined,
      });
    }
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    setError("");

    if (!PHONE_REGEX.test(phone)) {
      setError(t("auth.err.phone"));
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError(t("auth.err.name"));
      return;
    }
    if (mode === "register" && role === "jeweller" && !shopName.trim()) {
      setError(t("auth.err.shop"));
      return;
    }

    setBusy(true);
    try {
      await requestCode();
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError(t("auth.err.code"));
      return;
    }

    setBusy(true);
    try {
      let data;
      if (mode === "login") {
        data = await verifyLoginOtp(phone, otp);
      } else {
        data = await verifyRegisterOtp(phone, otp);
      }
      login(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const languageOptions = [];
  for (let i = 0; i < LANGUAGES.length; i++) {
    languageOptions.push(
      <option key={LANGUAGES[i].value} value={LANGUAGES[i].value}>
        {LANGUAGES[i].label}
      </option>
    );
  }

  return (
    <div className="auth">
      <section className="auth-story">
        <Link to="/" className="brand brand-light">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">GoldLedger</span>
        </Link>

        <div className="auth-story-body">
          <h1>{t("auth.story.title")}</h1>
          <p>{t("auth.story.text")}</p>
        </div>

        <div className="auth-receipt" aria-hidden="true">
          <div className="receipt-row">
            <span>{t("auth.receipt.issued")}</span>
            <span>100.000 g</span>
          </div>
          <div className="receipt-row">
            <span>{t("auth.receipt.returned")}</span>
            <span>97.000 g</span>
          </div>
          <div className="receipt-row">
            <span>{t("auth.receipt.wastage")}</span>
            <span>3.000 g</span>
          </div>
          <div className="receipt-row receipt-total">
            <span>{t("auth.receipt.diff")}</span>
            <span>0.000 g</span>
          </div>
          <div className="receipt-sign">
            <span>{t("auth.receipt.jConfirmed")}</span>
            <span>{t("auth.receipt.kConfirmed")}</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-top">
          <Link to="/" className="back-link">
            <Icon name="back" size={16} />
            {t("auth.backHome")}
          </Link>
          <LanguageSwitch />
        </div>
        <div className="auth-card">
          <div className="segmented" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "is-active" : ""}
              onClick={() => switchMode("login")}
            >
              {t("auth.tab.login")}
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "is-active" : ""}
              onClick={() => switchMode("register")}
            >
              {t("auth.tab.register")}
            </button>
          </div>

          {step === "details" && (
            <form className="form" onSubmit={handleSendOtp} noValidate>
              <h2>{mode === "login" ? t("auth.title.login") : t("auth.title.register")}</h2>

              <div className="field">
                <label htmlFor="phone">{t("auth.phone")}</label>
                <div className="input-unit input-unit-left">
                  <span>+91</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                  />
                </div>
              </div>

              {mode === "register" && (
                <>
                  <div className="field">
                    <span className="field-label">{t("auth.iam")}</span>
                    <div className="role-pick">
                      <button
                        type="button"
                        className={role === "karigar" ? "is-active" : ""}
                        onClick={() => setRole("karigar")}
                      >
                        <strong>{t("common.karigar")}</strong>
                        <small>{t("auth.role.karigarText")}</small>
                      </button>
                      <button
                        type="button"
                        className={role === "jeweller" ? "is-active" : ""}
                        onClick={() => setRole("jeweller")}
                      >
                        <strong>{t("common.jeweller")}</strong>
                        <small>{t("auth.role.jewellerText")}</small>
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="name">{t("auth.name")}</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  {role === "jeweller" && (
                    <div className="field">
                      <label htmlFor="shopName">{t("auth.shop")}</label>
                      <input
                        id="shopName"
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder={t("auth.shopPlaceholder")}
                      />
                    </div>
                  )}

                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="city">{t("auth.city")}</label>
                      <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="language">{t("auth.language")}</label>
                      <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {languageOptions}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {error && <p className="notice notice-red">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? t("auth.sending") : t("auth.sendCode")}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form className="form" onSubmit={handleVerify} noValidate>
              <h2>{t("auth.enterCode")}</h2>
              <p className="muted">
                {t("auth.sentTo", { phone: phone })}{" "}
                <button type="button" className="link-btn" onClick={() => setStep("details")}>
                  {t("auth.changeNumber")}
                </button>
              </p>

              <div className="field">
                <label htmlFor="otp">{t("auth.code")}</label>
                <input
                  id="otp"
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <span className="field-hint">{t("auth.demoCode")}</span>
              </div>

              {error && <p className="notice notice-red">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? t("auth.checking") : mode === "login" ? t("auth.tab.login") : t("auth.tab.register")}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}