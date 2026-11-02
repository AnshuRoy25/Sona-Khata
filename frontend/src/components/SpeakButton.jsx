import { useState } from "react";
import Icon from "./Icon.jsx";
import { speak, stopSpeaking } from "../lib/speech.js";
import { useToast } from "../context/ToastContext.jsx";
import { useLang } from "../context/LanguageContext.jsx";

// plays a sentence through Timbre; "Listen" by default
export default function SpeakButton({ text, label, small }) {
  const [state, setState] = useState("idle"); // idle | loading | playing
  const toast = useToast();
  const { t } = useLang();

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (state === "playing") {
      stopSpeaking();
      setState("idle");
      return;
    }

    setState("loading");
    try {
      await speak(text, function () {
        setState("idle");
      });
      setState("playing");
    } catch (err) {
      setState("idle");
      toast.error(err.message || t("speak.error"));
    }
  }

  let caption = label || t("common.listen");
  if (state === "loading") caption = t("common.loading");
  if (state === "playing") caption = t("common.stop");

  return (
    <button
      type="button"
      className={"btn btn-ghost" + (small ? " btn-sm" : "") + (state === "playing" ? " is-playing" : "")}
      onClick={handleClick}
      disabled={state === "loading"}
      title={t("detail.readAloud")}
    >
      <Icon name={state === "playing" ? "stop" : "speaker"} size={16} />
      {caption}
    </button>
  );
}
