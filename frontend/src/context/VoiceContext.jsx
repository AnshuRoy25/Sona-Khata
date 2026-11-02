import { createContext, useContext, useState } from "react";
import AgentPanel from "../components/agent/AgentPanel.jsx";

const VoiceContext = createContext(null);

// lets any page open the assistant
// the chat lives here, so closing and opening the panel keeps the conversation
export function VoiceProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const value = {
    openVoice: function () {
      setOpen(true);
    },
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
      {open && <AgentPanel messages={messages} setMessages={setMessages} onClose={() => setOpen(false)} />}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
