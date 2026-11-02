import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
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
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  function switchMode(next) {
    setMode(next);
    setStep("details");
    setError("");
    setOtp("");
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    setError("");

    if (!PHONE_REGEX.test(phone)) {
      setError("Enter a valid 10 digit mobile number.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (mode === "register" && role === "jeweller" && !shopName.trim()) {
      setError("Enter your shop name. Karigars will see it on every order.");
      return;
    }

    setBusy(true);
    try {
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
      setError("The code has 6 digits.");
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
      navigate("/", { replace: true });
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
        <div className="brand brand-light">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">GoldLedger</span>
        </div>

        <div className="auth-story-body">
          <h1>Jo sona karigar ke haath mein jaata hai, uska hisaab dono ke paas hota hai.</h1>
          <p>
            Every gram given and returned is spoken once, read back, and confirmed by both the jeweller and the
            karigar. Nothing enters the ledger on one person's word.
          </p>
        </div>

        <div className="auth-receipt" aria-hidden="true">
          <div className="receipt-row">
            <span>Gold issued</span>
            <span>100.000 g</span>
          </div>
          <div className="receipt-row">
            <span>Gold returned</span>
            <span>97.000 g</span>
          </div>
          <div className="receipt-row">
            <span>Agreed wastage</span>
            <span>3.000 g</span>
          </div>
          <div className="receipt-row receipt-total">
            <span>Difference</span>
            <span>0.000 g</span>
          </div>
          <div className="receipt-sign">
            <span>Jeweller confirmed</span>
            <span>Karigar confirmed</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="segmented" role="tablist">
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "is-active" : ""}
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "is-active" : ""}
              onClick={() => switchMode("register")}
            >
              Create account
            </button>
          </div>

          {step === "details" && (
            <form className="form" onSubmit={handleSendOtp} noValidate>
              <h2>{mode === "login" ? "Log in with your phone" : "Create your account"}</h2>

              <div className="field">
                <label htmlFor="phone">Mobile number</label>
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
                    <span className="field-label">I am a</span>
                    <div className="role-pick">
                      <button
                        type="button"
                        className={role === "karigar" ? "is-active" : ""}
                        onClick={() => setRole("karigar")}
                      >
                        <strong>Karigar</strong>
                        <small>I receive gold and make the piece</small>
                      </button>
                      <button
                        type="button"
                        className={role === "jeweller" ? "is-active" : ""}
                        onClick={() => setRole("jeweller")}
                      >
                        <strong>Jeweller</strong>
                        <small>I give gold to karigars</small>
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="name">Your name</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  {role === "jeweller" && (
                    <div className="field">
                      <label htmlFor="shopName">Shop name</label>
                      <input
                        id="shopName"
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Ramesh Jewellers"
                      />
                    </div>
                  )}

                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="city">City</label>
                      <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="language">Language</label>
                      <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {languageOptions}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {error && <p className="notice notice-red">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Sending code..." : "Send code"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form className="form" onSubmit={handleVerify} noValidate>
              <h2>Enter the code</h2>
              <p className="muted">
                We sent a 6 digit code to +91 {phone}.{" "}
                <button type="button" className="link-btn" onClick={() => setStep("details")}>
                  Change number
                </button>
              </p>

              <div className="field">
                <label htmlFor="otp">Code</label>
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
                <span className="field-hint">In development the code is printed in the backend terminal.</span>
              </div>

              {error && <p className="notice notice-red">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Checking..." : mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
