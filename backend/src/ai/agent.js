import config from "../config/config.js";
import { toolDefinitions, runTool } from "./tools.js";

function systemPrompt(user) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return `You are GoldLedger's assistant for a ${user.role} named ${user.name}.
Today is ${today} (YYYY-MM-DD).
Reply in the same language the user uses (Hindi, English or Hinglish).
Keep replies short and in plain text, no markdown, because replies are read out loud.
Only offer things your tools can do.
Use tools to get real data. Never make up numbers or order numbers.
Weights are in grams.
Before any tool that changes data, repeat the details and ask for a yes first.
When the user names a person, call find_person first.
Turn deadlines like 20 din into a YYYY-MM-DD date from today.
If a detail is missing, ask for it. Do not guess wastage or weight.
To confirm or reject, call list_pending_entries first to get the entryId. Never read ids out to the user.
Phone numbers are only needed for create_order. For existing orders, use the orderNo.`;
}

async function callLLM(messages) {
  const res = await fetch(config.llmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.llmApiKey,
    },
    body: JSON.stringify({
      model: config.llmModel,
      messages: messages,
      tools: toolDefinitions,
    }),
  });

  if (!res.ok) {
    throw new Error("LLM error " + res.status);
  }

  const data = await res.json();
  return data.choices[0].message;
}

export async function runAgent(history, user) {
  const messages = [{ role: "system", content: systemPrompt(user) }];
  for (let i = 0; i < history.length; i++) {
    messages.push(history[i]);
  }

  const toolsUsed = [];

  // at most 5 calls to the LLM for one message
  for (let round = 0; round < 5; round++) {
    const reply = await callLLM(messages);
    messages.push(reply);

    // no tool asked for, so this is the final answer
    if (!reply.tool_calls) {
      return { reply: reply.content, toolsUsed: toolsUsed };
    }

    // run each tool and send the result back
    for (let i = 0; i < reply.tool_calls.length; i++) {
      const call = reply.tool_calls[i];
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments || "{}");

      const result = await runTool(name, args, user);
      toolsUsed.push({ name: name, args: args, ok: !result.error });

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { reply: "Sorry, I could not finish that. Please try again.", toolsUsed: toolsUsed };
}