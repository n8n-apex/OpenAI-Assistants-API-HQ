// inline-embed.js - Styled version matching the provided design
(function() {
  if (window.__INLINE_CHAT_LOADED__) return;
  window.__INLINE_CHAT_LOADED__ = true;

  const script = document.currentScript || document.querySelector('script[src*="inline-embed.js"]');
  const API_URL = 'https://openai-assistants-api-production.up.railway.app/chat';
  const TARGET = script.getAttribute('data-target');
  const HEIGHT = script.getAttribute('data-height') || '600px';
  const TITLE = script.getAttribute('data-title') || 'Bildungsfabrik Learning Buddy';

  // Find or create container
  let container;
  if (TARGET) {
    container = document.querySelector(TARGET);
    if (!container) {
      container = document.createElement('div');
      container.id = TARGET.replace('#', '');
      document.body.appendChild(container);
    }
  } else {
    container = document.createElement('div');
    script.parentNode.insertBefore(container, script.nextSibling);
  }

  // CSS matching the design
  const css = `
    .modern-chat-widget {
      width: 100%;
      max-width: 900px;
      margin: 20px auto;
      border-radius: 24px;
      overflow: hidden;
      background: white;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .modern-chat-main {
      display: flex;
      flex-direction: column;
      height: ${HEIGHT};
      background: white;
      position: relative;
    }

    .modern-chat-header {
      padding: 32px 40px 24px 40px;
      text-align: center;
      background: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      position: relative;
    }

    .modern-chat-header .icon-circle {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px auto;
      background: linear-gradient(135deg, #000000 0%, #ffffff 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: 2px solid #e5e7eb;
    }

    .modern-chat-reload-btn {
      position: absolute;
      top: 24px;
      right: 24px;
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .modern-chat-reload-btn:hover {
      background: #f1f3f4;
      color: #374151;
      transform: rotate(180deg);
    }

    .modern-chat-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.4;
    }

    .modern-chat-body {
      flex: 1;
      padding: 24px 40px;
      overflow-y: auto;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modern-chat-body.empty {
      justify-content: flex-start;
      align-items: stretch;
    }

    .modern-chat-body.filled {
      justify-content: flex-start;
      align-items: stretch;
    }

    .modern-chat-message {
      padding: 16px 20px;
      border-radius: 16px;
      max-width: 85%;
      font-size: 15px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .modern-chat-message.user {
      background: #007AFF;
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 6px;
      margin-left: auto;
    }

    .modern-chat-message.bot {
      background: #f8f9fa;
      color: #1f2937;
      align-self: flex-start;
      border-bottom-left-radius: 6px;
      border: 1px solid #e5e7eb;
      white-space: pre-wrap;
      margin-right: auto;
    }

    .modern-chat-suggestions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .modern-chat-suggestion {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 15px;
      color: #374151;
      font-weight: 500;
      text-align: left;
      position: relative;
    }

    .modern-chat-suggestion:hover {
      background: #f1f3f4;
      border-color: #007AFF;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
    }

    .modern-chat-suggestion:active {
      transform: translateY(0);
    }

    .modern-chat-input-container {
      padding: 24px 40px 32px 40px;
      background: white;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .modern-chat-input-wrapper {
      position: relative;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 28px;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .modern-chat-input-wrapper:focus-within {
      border-color: #007AFF;
      box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
    }

    .modern-chat-input {
      width: 100%;
      padding: 16px 60px 16px 24px;
      border: none;
      font-size: 16px;
      outline: none;
      background: transparent;
      color: #1f2937;
      font-family: inherit;
    }

    .modern-chat-input::placeholder {
      color: #9ca3af;
    }

    .modern-chat-send-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .modern-chat-send-btn:hover:not(:disabled) {
      background: #0056CC;
      transform: translateY(-50%) scale(1.05);
    }

    .modern-chat-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: translateY(-50%);
    }

    .modern-chat-typing {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: #f8f9fa;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      border-bottom-left-radius: 6px;
      font-size: 14px;
      align-self: flex-start;
      margin-right: auto;
      max-width: 85%;
    }

    .modern-chat-typing span {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: typing-bounce 1.4s infinite;
    }

    .modern-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .modern-chat-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Scrollbar styling */
    .modern-chat-body::-webkit-scrollbar {
      width: 6px;
    }

    .modern-chat-body::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .modern-chat-body::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .modern-chat-body::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .modern-chat-widget {
        margin: 10px;
        border-radius: 20px;
      }
      
      .modern-chat-header,
      .modern-chat-body,
      .modern-chat-input-container {
        padding-left: 24px;
        padding-right: 24px;
      }
      
      .modern-chat-main {
        height: 500px;
      }
      
      .modern-chat-suggestion {
        padding: 16px 20px;
        font-size: 14px;
      }
    }
  `;

  // Inject CSS
  if (!document.querySelector('#modern-chat-styles')) {
    const style = document.createElement('style');
    style.id = 'modern-chat-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Create widget
  const widgetId = 'modern-chat-' + Math.random().toString(36).substr(2, 9);
  container.innerHTML = `
    <div class="modern-chat-widget">
      <div class="modern-chat-main">
        <div class="modern-chat-header">
          <button class="modern-chat-reload-btn" id="${widgetId}-reload" title="Chat neu starten">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
          </button>
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
            </svg>
          </div>
          <h3>${TITLE}</h3>
        </div>
        <div class="modern-chat-body empty" id="${widgetId}-body"></div>
        <div class="modern-chat-input-container">
          <div class="modern-chat-input-wrapper">
            <input 
              type="text" 
              class="modern-chat-input" 
              id="${widgetId}-input" 
              placeholder="Wer genau ist deine Zielgruppe?" 
            />
            <button class="modern-chat-send-btn" id="${widgetId}-send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Chat functionality
  let threadId = '';
  let hasSuggestions = true;
  const chatBody = document.getElementById(widgetId + '-body');
  const chatInput = document.getElementById(widgetId + '-input');
  const sendBtn = document.getElementById(widgetId + '-send');
  const reloadBtn = document.getElementById(widgetId + '-reload');

  function resetChat() {
    threadId = '';
    hasSuggestions = true;
    chatBody.innerHTML = '';
    chatBody.classList.remove('filled');
    chatBody.classList.add('empty');
    chatInput.value = '';
    chatInput.disabled = false;
    sendBtn.disabled = false;
    showSuggestions();
  }

  function addMessage(content, sender) {
    const msg = document.createElement('div');
    msg.className = 'modern-chat-message ' + sender;
    msg.textContent = content;
    chatBody.appendChild(msg);
    chatBody.classList.remove('empty');
    chatBody.classList.add('filled');
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
  }

  function showSuggestions() {
    if (!hasSuggestions) return;
    
    const suggestions = document.createElement('div');
    suggestions.className = 'modern-chat-suggestions';
    
    const suggestionTexts = [
      'Frag mich ab!'
    ];
      
    suggestionTexts.forEach(text => {
      const suggestion = document.createElement('div');
      suggestion.className = 'modern-chat-suggestion';
      suggestion.textContent = text;
      
      suggestion.onclick = () => {
        chatInput.value = text;
        sendMessage();
      };
      
      suggestions.appendChild(suggestion);
    });
    
    chatBody.appendChild(suggestions);
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (hasSuggestions) {
      chatBody.innerHTML = '';
      hasSuggestions = false;
    }

    chatInput.disabled = true;
    sendBtn.disabled = true;

    addMessage(text, 'user');
    chatInput.value = '';

    const botMsg = addMessage('', 'bot');
    const typing = document.createElement('div');
    typing.className = 'modern-chat-typing';
    typing.innerHTML = 'Ich arbeite an einer Antwort <span></span><span></span><span></span>';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message: text })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const json = line.slice(6).trim();
            if (!json) return;

            try {
              const parsed = JSON.parse(json);
              if (parsed.threadId && !threadId) {
                threadId = parsed.threadId;
              }
              if (parsed.delta) {
                if (typing.parentNode) typing.remove();
                botMsg.textContent += parsed.delta;
                chatBody.scrollTop = chatBody.scrollHeight;
              }
            } catch (e) {}
          }
        });
      }
    } catch (error) {
      botMsg.textContent = 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.';
    } finally {
      if (typing.parentNode) typing.remove();
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn.onclick = sendMessage;
  reloadBtn.onclick = resetChat;
  chatInput.onkeypress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show initial suggestions
  setTimeout(showSuggestions, 100);
})();
