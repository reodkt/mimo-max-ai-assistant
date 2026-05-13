const https = require("https");

const systemPrompt =
  "You are a fast, friendly experimental AI assistant. Answer in Indonesian by default. Keep responses short and clean: max 6 bullets or 4 short paragraphs. Do not use markdown tables, ASCII diagrams, code blocks, horizontal rules, checkboxes, or decorative symbols. Use simple headings only when helpful. Do not mention internal provider or model branding unless the user asks directly.";

function requestAiService(messages) {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL;
  const model = process.env.MIMO_MODEL || "mimo-v2.5-pro";

  if (!apiKey || !baseUrl) {
    return Promise.resolve({
      reply:
        "Demo mode: add API credentials to the deployment environment to call the real AI service."
    });
  }

  const endpoint = new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`);
  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.25,
    max_tokens: 300
  });

  return new Promise((resolve, reject) => {
    const apiRequest = https.request(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (apiResponse) => {
        let responseBody = "";

        apiResponse.on("data", (chunk) => {
          responseBody += chunk;
        });

        apiResponse.on("end", () => {
          let payload = {};

          try {
            payload = JSON.parse(responseBody);
          } catch {
            reject(new Error("AI service returned a non-JSON response."));
            return;
          }

          if (apiResponse.statusCode < 200 || apiResponse.statusCode >= 300) {
            reject(new Error(payload.error?.message || `AI service failed with ${apiResponse.statusCode}`));
            return;
          }

          resolve({
            reply:
              payload.choices?.[0]?.message?.content ||
              "The AI service returned no message content for this request."
          });
        });
      }
    );

    apiRequest.on("error", reject);
    apiRequest.write(body);
    apiRequest.end();
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const message = String(request.body?.message || "").trim();

    if (!message) {
      response.status(400).json({ error: "Message is required." });
      return;
    }

    if (message.length > 4000) {
      response.status(413).json({ error: "Message is too long for this demo endpoint." });
      return;
    }

    const completion = await requestAiService([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);

    response.status(200).json(completion);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error."
    });
  }
};
