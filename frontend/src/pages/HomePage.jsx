import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import Icon from "../components/Icon.jsx";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLang();
  usePageTitle("");

  // ---------- small pieces ----------

  function renderList(prefix, count) {
    const items = [];
    for (let i = 1; i <= count; i++) {
      items.push(
        <li key={i}>
          <Icon name="check" size={16} />
          <span>{t(prefix + i)}</span>
        </li>
      );
    }
    return <ul className="home-checklist">{items}</ul>;
  }

  function renderSteps() {
    const icons = ["mic", "speaker", "check", "scale"];
    const steps = [];
    for (let i = 1; i <= 4; i++) {
      steps.push(
        <li key={i} className="home-step">
          <span className="home-step-icon">
            <Icon name={icons[i - 1]} size={20} />
          </span>
          <span className="home-step-num">0{i}</span>
          <h3>{t("home.how.s" + i + ".title")}</h3>
          <p>{t("home.how.s" + i + ".text")}</p>
        </li>
      );
    }
    return <ol className="home-steps">{steps}</ol>;
  }

  function renderTrust() {
    const items = [];
    for (let i = 1; i <= 3; i++) {
      items.push(
        <div key={i} className="home-trust-item">
          <h3>{t("home.trust." + i + ".title")}</h3>
          <p>{t("home.trust." + i + ".text")}</p>
        </div>
      );
    }
    return <div className="home-trust-grid">{items}</div>;
  }

  const primaryCta = user ? (
    <Link to="/dashboard" className="btn btn-primary btn-lg">
      {t("home.openApp")}
    </Link>
  ) : (
    <Link to="/login?mode=register" className="btn btn-primary btn-lg">
      {t("home.hero.cta")}
    </Link>
  );

  // ---------- page ----------

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-wrap home-header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">GoldLedger</span>
          </Link>

          <nav className="home-links">
            <a href="#how">{t("home.nav.how")}</a>
            <a href="#for">{t("home.nav.for")}</a>
          </nav>

          <div className="home-header-actions">
            <LanguageSwitch />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                {t("home.openApp")}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost home-login">
                  {t("home.login")}
                </Link>
                <Link to="/login?mode=register" className="btn btn-primary">
                  {t("home.start")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="home-hero">
        <div className="home-wrap home-hero-grid">
          <div className="home-hero-text">
            <span className="home-eyebrow">{t("home.hero.eyebrow")}</span>
            <h1>{t("home.hero.title")}</h1>
            <p className="home-lead">{t("home.hero.text")}</p>
            <div className="home-hero-actions">
              {primaryCta}
              <a href="#how" className="btn btn-lg">
                {t("home.hero.secondary")}
              </a>
            </div>
            <p className="home-note">{t("home.hero.note")}</p>
          </div>

          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-entry">
              <div className="home-entry-head">
                <span className="home-entry-mic">
                  <Icon name="mic" size={18} />
                </span>
                <p className="devanagari">{t("home.card.said")}</p>
              </div>

              <div className="home-entry-body">
                <div className="home-entry-title">
                  <strong>{t("home.card.title")}</strong>
                  <span className="badge badge-amber">{t("status.open")}</span>
                </div>
                <div className="home-entry-row">
                  <span>{t("home.card.karigar")}</span>
                  <b>Rajesh Kumar</b>
                </div>
                <div className="home-entry-row">
                  <span>{t("home.card.gold")}</span>
                  <b className="num">100.000 g</b>
                </div>
                <div className="home-entry-row">
                  <span>{t("home.card.wastage")}</span>
                  <b className="num">3.000 g</b>
                </div>
                <div className="home-entry-row">
                  <span>{t("home.card.deadline")}</span>
                  <b>{t("home.card.deadlineValue")}</b>
                </div>
                <div className="home-entry-ticks">
                  <span>
                    <Icon name="check" size={14} />
                    {t("common.jeweller")}
                  </span>
                  <span>
                    <Icon name="check" size={14} />
                    {t("common.karigar")}
                  </span>
                </div>
              </div>

              <div className="home-entry-foot">
                <Icon name="check" size={14} />
                {t("home.card.both")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* problem */}
      <section className="home-section">
        <div className="home-wrap home-problem">
          <div className="home-diary" aria-hidden="true">
            <div className="home-diary-row">
              <span>12</span>
              <span>Rajesh</span>
              <span className="home-diary-num">
                <s>100 g</s> <em>115 g</em>
              </span>
            </div>
            <div className="home-diary-row">
              <span>14</span>
              <span>Suresh</span>
              <span>50 g</span>
            </div>
            <div className="home-diary-row">
              <span>18</span>
              <span>Rajesh</span>
              <span>97 g ?</span>
            </div>
            <div className="home-diary-row">
              <span>21</span>
              <span>Mahesh</span>
              <span>30 g</span>
            </div>
          </div>

          <div>
            <h2 className="home-h2">{t("home.problem.title")}</h2>
            <p className="home-body">{t("home.problem.text")}</p>
            <ul className="home-crosslist">
              <li>{t("home.problem.p1")}</li>
              <li>{t("home.problem.p2")}</li>
              <li>{t("home.problem.p3")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="home-section home-section-alt" id="how">
        <div className="home-wrap">
          <h2 className="home-h2 home-center">{t("home.how.title")}</h2>
          {renderSteps()}
        </div>
      </section>

      {/* voice */}
      <section className="home-section">
        <div className="home-wrap home-voice">
          <div>
            <h2 className="home-h2">{t("home.voice.title")}</h2>
            <p className="home-body">{t("home.voice.text")}</p>
          </div>
          <div className="home-chat" aria-hidden="true">
            <div className="home-bubble home-bubble-user devanagari">{t("home.voice.q1")}</div>
            <div className="home-bubble home-bubble-bot devanagari">{t("home.voice.a1")}</div>
            <div className="home-bubble home-bubble-user devanagari">{t("home.voice.q2")}</div>
            <div className="home-bubble home-bubble-bot devanagari">
              <span className="home-bubble-chip">
                <Icon name="check" size={12} />
                {t("agent.done.confirm_entry")}
              </span>
              {t("home.voice.a2")}
            </div>
          </div>
        </div>
      </section>

      {/* who it is for */}
      <section className="home-section home-section-alt" id="for">
        <div className="home-wrap">
          <h2 className="home-h2 home-center">{t("home.for.title")}</h2>
          <div className="home-roles">
            <div className="home-role">
              <span className="home-role-tag">{t("common.jeweller")}</span>
              <h3>{t("home.for.j.title")}</h3>
              {renderList("home.for.j.", 4)}
            </div>
            <div className="home-role">
              <span className="home-role-tag">{t("common.karigar")}</span>
              <h3>{t("home.for.k.title")}</h3>
              {renderList("home.for.k.", 4)}
            </div>
          </div>
        </div>
      </section>

      {/* trust */}
      <section className="home-section">
        <div className="home-wrap">
          <h2 className="home-h2 home-center">{t("home.trust.title")}</h2>
          {renderTrust()}
        </div>
      </section>

      {/* final call to action */}
      <section className="home-cta">
        <div className="home-wrap home-cta-inner">
          <div>
            <h2>{t("home.cta.title")}</h2>
            <p>{t("home.cta.text")}</p>
          </div>
          {user ? (
            <Link to="/dashboard" className="btn btn-gold btn-lg">
              {t("home.openApp")}
            </Link>
          ) : (
            <Link to="/login?mode=register" className="btn btn-gold btn-lg">
              {t("home.hero.cta")}
            </Link>
          )}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-wrap home-footer-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">GoldLedger</span>
          </span>
          <span className="muted">{t("home.footer.built")}</span>
          <span className="muted">© {new Date().getFullYear()} {t("home.footer.rights")}</span>
        </div>
      </footer>
    </div>
  );
}
