import config from "../../config/config.js";

// one request to the LLM (OpenAI-compatible format)
// returns the model's message: either text, or tool_calls
export async function callLLM(messages, tools) {
  const res = await fetch(config.llmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.llmApiKey,
    },
    body: JSON.stringify({
      model: config.llmModel,
      messages: messages,
      tools: tools,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[llm] error", res.status, JSON.stringify(data));
    throw new Error("LLM error " + res.status);
  }

  return data.choices[0].message;
}