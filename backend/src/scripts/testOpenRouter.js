import config from "../config/config.js";

async function testOpenRouter() {
  const sentence =
    "रमेश ज्वैलर्स से 100 ग्राम सोना मिला, रानी हार के लिए, 3 ग्राम wastage, 20 दिन में देना है";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + config.openrouterApiKey,
    },
    body: JSON.stringify({
      model: config.openrouterModel,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract details from a sentence spoken in a jewellery workshop. " +
            "Reply ONLY with JSON, no other text, in this shape: " +
            '{"jeweller": string, "weightGrams": number, "item": string, "wastageGrams": number, "days": number}',
        },
        { role: "user", content: sentence },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("OpenRouter error:", response.status, data);
    return;
  }

  const text = data.choices[0].message.content;
  console.log("Raw reply:", text);

  try {
    const parsed = JSON.parse(text);
    console.log("Parsed JSON:", parsed);
  } catch (err) {
    console.log("Reply was not clean JSON");
  }
}

testOpenRouter();