const https = require("https");

const systemPrompt =
  "You are Mimo Max inside a responsible AI productivity demo. Give concise, practical answers and avoid unsafe or private-data requests.";

function requestMimo(messages) {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL;
  const model = process.env.MIMO_MODEL || "mimo-v2.5-pro";

  if (!apiKey || !baseUrl) {
    return Promise.resolve({
      reply:
        "Demo mode: add MIMO_API_KEY and MIMO_BASE_URL to the deployment environment to call the real Mimo API."
    });
  }

  const endpoint = new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`);
  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.4,
    max_tokens: 900
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
            reject(new Error("Mimo API returned a non-JSON response."));
            return;
          }

          if (apiResponse.statusCode < 200 || apiResponse.statusCode >= 300) {
            reject(new Error(payload.error?.message || `Mimo API failed with ${apiResponse.statusCode}`));
            return;
          }

          resolve({
            reply:
              payload.choices?.[0]?.message?.content ||
              "The Mimo API returned no message content for this request."
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

    const completion = await requestMimo([
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
