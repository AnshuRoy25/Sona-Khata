import { useEffect, useRef, useState } from "react";
import Icon from "../Icon.jsx";
import SpeakButton from "../SpeakButton.jsx";
import { startRecording } from "../../lib/wavRecorder.js";
import { speak, stopSpeaking, unlockAudio } from "../../lib/speech.js";
import { agentChat, agentVoice } from "../../api/endpoints.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLang } from "../../context/LanguageContext.jsx";
import { notifyLedgerChanged } from "../../hooks/useLedger.js";
import { MAX_RECORDING_SECONDS } from "../../config.js";

// things to try, per language and role
const SUGGESTIONS = {
  en: {
    jeweller: [
      "What can you do?",
      "Rajesh ko sau gram diya, rani haar, teen gram wastage, bees din",
      "Kaun kaun late hai?",
      "How much gold is with my karigars?",
    ],
    karigar: ["Is anything pending for me?", "Mera kitna paisa baaki hai?", "Which of my orders are late?"],
  },
  hi: {
    jeweller: [
      "तुम क्या क्या कर सकते हो?",
      "राजेश को सौ ग्राम दिया, रानी हार, तीन ग्राम वेस्टेज, बीस दिन",
      "कौन कौन लेट है?",
      "कारीगरों के पास कितना सोना है?",
    ],
    karigar: ["क्या कुछ पेंडिंग है?", "मेरा कितना पैसा बाकी है?", "मेरे कौनसे ऑर्डर लेट हैं?"],
  },
};

// tools that change the ledger; each shows a small "done" chip in the chat
const ACTION_TOOLS = ["create_order", "issue_extra_gold", "record_return", "confirm_entry", "reject_entry"];

const SILENCE_LEVEL = 0.05; // below this counts as quiet
const SILENCE_MS = 1500; // stop after this much quiet, once speech has started
const BAR_COUNT = 18;

// messages: [{ role, content, fromVoice, actions }]
export default function AgentPanel({ messages, setMessages, onClose }) {
  const { user } = useAuth();
  const { lang, t } = useLang();

  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | recording | thinking
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const heardRef = useRef(false);
  const lastLoudRef = useRef(0);
  const listRef = useRef(null);

  // keep the newest message in view
  useEffect(
    function () {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    },
    [messages, phase]
  );

  // clean up if the panel closes mid-way
  useEffect(function () {
    return function () {
      clearInterval(timerRef.current);
      if (recorderRef.current) recorderRef.current.cancel();
      stopSpeaking();
    };
  }, []);

  // plain history for the backend
  function toHistory(list) {
    const history = [];
    for (let i = 0; i < list.length; i++) {
      history.push({ role: list[i].role, content: list[i].content });
    }
    return history;
  }

  // which ledger changes happened in this reply
  function readActions(toolsUsed) {
    const actions = [];
    if (!toolsUsed) return actions;
    for (let i = 0; i < toolsUsed.length; i++) {
      const used = toolsUsed[i];
      if (ACTION_TOOLS.indexOf(used.name) !== -1 && used.ok !== false) {
        actions.push(used.name);
      }
    }
    return actions;
  }

  function addReply(list, data, fromVoice) {
    const actions = readActions(data.toolsUsed);
    const next = list.slice();
    next.push({ role: "assistant", content: data.reply || "", actions: actions });
    setMessages(next);

    if (actions.length > 0) notifyLedgerChanged();

    if (fromVoice && data.reply) {
      speak(data.reply).catch(function () {
        // autoplay can be blocked, the play button is still there
      });
    }
  }

  // ---------- typing ----------

  async function sendText(text) {
    const clean = text.trim();
    if (!clean || phase !== "idle") return;

    setError("");
    setInput("");
    stopSpeaking();
    unlockAudio(); // lets the reply play on phones

    const list = messages.slice();
    list.push({ role: "user", content: clean });
    setMessages(list);
    setPhase("thinking");

    try {
      const data = await agentChat(toHistory(list));
      addReply(list, data, false);
    } catch (err) {
      setError(err.message);
    }
    setPhase("idle");
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendText(input);
  }

  // ---------- speaking ----------

  function onLevel(level) {
    setLevels(function (old) {
      const next = old.slice(-(BAR_COUNT - 1));
      next.push(level);
      return next;
    });

    const now = Date.now();
    if (level > SILENCE_LEVEL) {
      heardRef.current = true;
      lastLoudRef.current = now;
    }
  }

  async function startMic() {
    setError("");
    setLevels([]);
    stopSpeaking();
    unlockAudio(); // lets the reply play on phones
    heardRef.current = false;
    lastLoudRef.current = Date.now();

    try {
      recorderRef.current = await startRecording(onLevel);
    } catch (err) {
      setError(err.message);
      return;
    }

    setPhase("recording");
    const startedAt = Date.now();

    timerRef.current = setInterval(function () {
      const now = Date.now();
      const tooLong = now - startedAt >= MAX_RECORDING_SECONDS * 1000;
      const wentQuiet = heardRef.current && now - lastLoudRef.current >= SILENCE_MS;
      if (tooLong || wentQuiet) stopMic();
    }, 200);
  }

  async function stopMic() {
    clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;

    const audio = recorder.stop();

    // 16 kHz × 2 bytes ≈ 32 KB per second, under half a second is too short
    if (audio.size < 16000 || !heardRef.current) {
      setPhase("idle");
      setError(t("agent.didntCatch"));
      return;
    }

    setPhase("thinking");
    try {
      const data = await agentVoice(audio, toHistory(messages));
      const list = messages.slice();
      list.push({ role: "user", content: data.transcript, fromVoice: true });
      addReply(list, data, true);
    } catch (err) {
      setError(err.message);
    }
    setPhase("idle");
  }

  function cancelMic() {
    clearInterval(timerRef.current);
    if (recorderRef.current) recorderRef.current.cancel();
    recorderRef.current = null;
    setPhase("idle");
  }

  function newChat() {
    stopSpeaking();
    setMessages([]);
    setError("");
  }

  // ---------- pieces ----------

  function renderEmpty() {
    const list = SUGGESTIONS[lang][user.role] || [];
    const chips = [];
    for (let i = 0; i < list.length; i++) {
      chips.push(
        <button key={i} className="agent-suggestion" onClick={() => sendText(list[i])}>
          {list[i]}
        </button>
      );
    }
    return (
      <div className="agent-empty">
        <span className="agent-empty-icon">
          <Icon name="mic" size={26} />
        </span>
        <h3>{t("agent.hello", { name: user.name.split(" ")[0] })}</h3>
        <p>{t("agent.intro")}</p>
        <div className="agent-suggestions">{chips}</div>
      </div>
    );
  }

  function renderMessages() {
    const rows = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];

      if (m.role === "user") {
        rows.push(
          <div key={i} className="agent-msg agent-msg-user">
            <div className="agent-bubble">
              {m.fromVoice && (
                <span className="agent-voice-tag">
                  <Icon name="mic" size={12} /> {t("agent.spoken")}
                </span>
              )}
              <p className="devanagari">{m.content}</p>
            </div>
          </div>
        );
        continue;
      }

      const actions = [];
      if (m.actions) {
        for (let j = 0; j < m.actions.length; j++) {
          actions.push(
            <span key={j} className="agent-action">
              <Icon name="check" size={13} /> {t("agent.done." + m.actions[j])}
            </span>
          );
        }
      }

      rows.push(
        <div key={i} className="agent-msg agent-msg-bot">
          <div className="agent-bubble">
            {actions.length > 0 && <div className="agent-actions">{actions}</div>}
            <p className="devanagari">{m.content}</p>
            {m.content && <SpeakButton text={m.content} small />}
          </div>
        </div>
      );
    }

    if (phase === "thinking") {
      rows.push(
        <div key="thinking" className="agent-msg agent-msg-bot">
          <div className="agent-bubble agent-typing" aria-label={t("agent.thinking")}>
            <span />
            <span />
            <span />
          </div>
        </div>
      );
    }

    return rows;
  }

  function renderMeter() {
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const level = i < levels.length ? levels[i] : 0;
      bars.push(<span key={i} style={{ height: 4 + Math.round(level * 26) + "px" }} />);
    }
    return <div className="agent-meter">{bars}</div>;
  }

  function renderComposer() {
    if (phase === "recording") {
      return (
        <div className="agent-composer agent-composer-rec">
          <button className="agent-mic is-recording" onClick={stopMic} aria-label={t("agent.stopSend")}>
            <Icon name="stop" size={18} />
          </button>
          {renderMeter()}
          <span className="agent-rec-text">{t("agent.listening")}</span>
          <button className="btn btn-ghost btn-sm" onClick={cancelMic}>
            {t("common.cancel")}
          </button>
        </div>
      );
    }

    const busy = phase === "thinking";
    return (
      <form className="agent-composer" onSubmit={handleSubmit}>
        <button type="button" className="agent-mic" onClick={startMic} disabled={busy} aria-label={t("agent.speak")}>
          <Icon name="mic" size={20} />
        </button>
        <input
          className="agent-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("agent.placeholder")}
          disabled={busy}
        />
        <button type="submit" className="agent-send" disabled={busy || !input.trim()} aria-label={t("agent.send")}>
          <Icon name="send" size={18} />
        </button>
      </form>
    );
  }

  return (
    <div className="agent-layer">
      <div className="agent-backdrop" onClick={onClose} />
      <aside className="agent-panel" role="dialog" aria-label={t("agent.title")}>
        <header className="agent-head">
          <div>
            <strong>{t("agent.title")}</strong>
            <small>{t("agent.sub")}</small>
          </div>
          <div className="agent-head-actions">
            {messages.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={newChat}>
                {t("agent.newChat")}
              </button>
            )}
            <button className="icon-btn" onClick={onClose} aria-label={t("common.close")}>
              <Icon name="x" />
            </button>
          </div>
        </header>

        <div className="agent-list" ref={listRef}>
          {messages.length === 0 && phase !== "thinking" ? renderEmpty() : renderMessages()}
        </div>

        {error && <p className="agent-error">{error}</p>}
        {renderComposer()}
      </aside>
    </div>
  );
}
