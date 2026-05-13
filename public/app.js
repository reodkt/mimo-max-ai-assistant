const form = document.querySelector("#chatForm");
const input = document.querySelector("#promptInput");
const sendButton = document.querySelector("#sendButton");
const messageList = document.querySelector("#messageList");
const promptButtons = document.querySelectorAll(".prompt-row button");

function addMessage(role, content) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const label = document.createElement("span");
  label.textContent = role === "assistant" ? "Assistant" : "You";

  const text = document.createElement("div");
  text.className = "message-content";
  setMessageContent(text, role, content);

  wrapper.append(label, text);
  messageList.appendChild(wrapper);
  messageList.scrollTop = messageList.scrollHeight;

  return wrapper;
}

function setMessageContent(element, role, content) {
  if (role === "assistant") {
    element.innerHTML = formatAssistantReply(content);
    return;
  }

  element.textContent = content;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInline(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableDivider(line) {
  return /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line);
}

function renderTable(lines) {
  const rows = lines
    .filter((line) => !isTableDivider(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => formatInline(cell.trim()))
    );

  if (!rows.length) {
    return "";
  }

  const [head, ...body] = rows;
  const header = `<thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>`;
  const bodyRows = body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");

  return `<div class="table-wrap"><table>${header}<tbody>${bodyRows}</tbody></table></div>`;
}

function formatAssistantReply(content) {
  const lines = String(content || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "<p>Tidak ada respons.</p>";
  }

  const html = [];
  let listItems = [];
  let tableLines = [];

  function flushList() {
    if (!listItems.length) {
      return;
    }

    html.push(`<ul>${listItems.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`);
    listItems = [];
  }

  function flushTable() {
    if (!tableLines.length) {
      return;
    }

    html.push(renderTable(tableLines));
    tableLines = [];
  }

  for (const line of lines) {
    if (isTableLine(line)) {
      flushList();
      tableLines.push(line);
      continue;
    }

    flushTable();

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      flushList();
      html.push(`<h4>${formatInline(heading[1])}</h4>`);
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      listItems.push((bullet || numbered)[1]);
      continue;
    }

    flushList();
    html.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  flushTable();

  return html.join("");
}

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent.trim();
    input.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) {
    return;
  }

  addMessage("user", message);
  input.value = "";
  sendButton.disabled = true;
  sendButton.textContent = "Sending";

  const loadingMessage = addMessage("assistant", "Memproses prompt...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    setMessageContent(
      loadingMessage.querySelector(".message-content"),
      "assistant",
      data.reply || data.error || "Tidak ada respons dari server."
    );
  } catch {
    setMessageContent(
      loadingMessage.querySelector(".message-content"),
      "assistant",
      "Gagal menghubungi API demo. Coba jalankan ulang server development."
    );
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send prompt";
  }
});
