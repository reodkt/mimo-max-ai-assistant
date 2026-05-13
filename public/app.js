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

  const text = document.createElement("p");
  text.textContent = content;

  wrapper.append(label, text);
  messageList.appendChild(wrapper);
  messageList.scrollTop = messageList.scrollHeight;

  return wrapper;
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
    loadingMessage.querySelector("p").textContent =
      data.reply || data.error || "Tidak ada respons dari server.";
  } catch {
    loadingMessage.querySelector("p").textContent =
      "Gagal menghubungi API demo. Coba jalankan ulang server development.";
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send prompt";
  }
});
