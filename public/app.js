const API_URL = 'https://openai-assistants-api-hq-production.up.railway.app/chat';
let threadId = '';
let suggestionsVisible = true; // track if suggestions are on screen

// Toggle widget visibility
//document.getElementById('chat-toggle').addEventListener('click', () => {
//  const widget = document.getElementById('chat-widget');
//  widget.style.display = widget.style.display === 'flex' ? 'none' : 'flex';
//});

// Send on button click
document.getElementById('send-btn').addEventListener('click', sendMessage);

// Send on Enter key
document.getElementById('chat-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

function appendMessage(content, sender) {
  const chatBody = document.getElementById('chat-body');

  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = content;
  chatBody.appendChild(msg);

  // ✅ Switch layout when first message arrives
  chatBody.classList.add('filled');

  chatBody.scrollTop = chatBody.scrollHeight;
  return msg;
}

// ✅ Render suggestions (called on page load)
function renderSuggestions() {
  const chatBody = document.getElementById('chat-body');

  const block = document.createElement('div');
  block.id = 'suggestion-block';

  const title = document.createElement('div');
  title.style.fontSize = '13px';
  title.style.color = '#555';
  title.style.marginBottom = '8px';
  title.textContent = 'Try asking these questions...';
  block.appendChild(title);

  const suggestions = [
    'Ich möchte meine bisherige Positionierung schärfen!',
    'Wie lautet deine bisherige Positionierung?',
    'Hilf mir bei meiner Content-Strategie.'
  ];

  suggestions.forEach(text => {
    const card = document.createElement('div');
    card.classList.add('suggestion');
    card.textContent = text;

    card.addEventListener('click', () => {
      document.getElementById('chat-input').value = text;
      sendMessage(); // auto-send
    });

    block.appendChild(card);
  });

  chatBody.appendChild(block);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ✅ Remove suggestions once user starts chatting
function removeSuggestions() {
  if (suggestionsVisible) {
    const block = document.getElementById('suggestion-block');
    if (block) block.remove();
    suggestionsVisible = false;
  }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  removeSuggestions(); // ✅ hide suggestions after first input

  // Show user message
  appendMessage(text, 'user');
  input.value = '';

  // Bot placeholder
  const botMsg = appendMessage('', 'bot');

  // ✅ Insert typing indicator right below user message
  const typing = document.createElement('div');
  typing.classList.add('typing-indicator');
  typing.innerHTML = `Getting your answer <span></span><span></span><span></span>`;
  document.getElementById('chat-body').appendChild(typing);

  console.log("📡 Sending message with threadId:", threadId);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId: threadId || '', message: text })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    chunk.split("\n").forEach(line => {
      if (line.startsWith("data: ")) {
        const json = line.slice(6).trim();
        if (!json) return;

        try {
          const parsed = JSON.parse(json);

          if (parsed.threadId && !threadId) {
            threadId = parsed.threadId;
            localStorage.setItem('threadId', threadId);
          }

          if (parsed.delta) {
            // ✅ remove typing indicator as soon as bot starts typing
            if (typing) typing.remove();

            botMsg.textContent += parsed.delta;
            document.getElementById('chat-body').scrollTop =
              document.getElementById('chat-body').scrollHeight;
          }

          if (parsed.done) {
            if (typing) typing.remove(); // ✅ ensure it's gone
          }

        } catch (err) {
          console.error('Stream parse error', err);
        }
      }
    });
  }
}


if (document.readyState === "loading") {
  window.addEventListener('DOMContentLoaded', renderSuggestions);
} else {
  renderSuggestions(); // DOM already ready
}
