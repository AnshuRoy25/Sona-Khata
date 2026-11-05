import { systemPrompt } from "./prompt.js";
import { callLLM } from "./llm.js";
import { toolDefinitions } from "../tools/definitions.js";
import { runTool } from "../tools/index.js";

const MAX_ROUNDS = 5;

export async function runAgent(history, user) {
  const messages = [{ role: "system", content: systemPrompt(user) }];
  for (let i = 0; i < history.length; i++) {
    messages.push(history[i]);
  }

  const toolsUsed = [];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const reply = await callLLM(messages, toolDefinitions);
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

      console.log("[agent] round " + (round + 1) + ": " + name, args);

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