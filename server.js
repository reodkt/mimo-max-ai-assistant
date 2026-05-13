const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const systemPrompt =
  "You are Mimo Max inside a responsible AI productivity demo. Give concise, practical answers and avoid unsafe or private-data requests.";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function requestMimo(messages) {
  const apiKey = process.env.MIMO_API_KEY;
  const baseUrl = process.env.MIMO_BASE_URL;
  const model = process.env.MIMO_MODEL || "mimo-max-1.6b";

  if (!apiKey || !baseUrl) {
    return Promise.resolve({
      reply:
        "Demo mode: add MIMO_API_KEY and MIMO_BASE_URL to .env.local or your shell environment to call the real Mimo API."
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

async function handleChat(request, response) {
  try {
    const rawBody = await readBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const message = String(payload.message || "").trim();

    if (!message) {
      sendJson(response, 400, { error: "Message is required." });
      return;
    }

    if (message.length > 4000) {
      sendJson(response, 413, { error: "Message is too long for this demo endpoint." });
      return;
    }

    const completion = await requestMimo([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]);

    sendJson(response, 200, completion);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error."
    });
  }
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/chat") {
    handleChat(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Mimo Max AI Assistant running at http://localhost:${PORT}`);
});
