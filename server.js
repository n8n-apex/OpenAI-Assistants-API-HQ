const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
app.use(express.json());

const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: "*"
}));

// NEW: Serve the inline embed script
app.get('/inline-embed.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  
  // Check if file exists, otherwise send a basic inline script
  const embedPath = path.join(__dirname, 'public', 'inline-embed.js');
  const fs = require('fs');
  
  if (fs.existsSync(embedPath)) {
    res.sendFile(embedPath);
  } else {
    // Fallback inline script if file doesn't exist yet
    res.send(`
// Fallback inline embed script
(function() {
  if (window.__INLINE_CHAT_LOADED__) return;
  window.__INLINE_CHAT_LOADED__ = true;
  
  const script = document.currentScript || document.querySelector('script[src*="inline-embed.js"]');
  const HEIGHT = script.getAttribute('data-height') || '500px';
  const TITLE = script.getAttribute('data-title') || '💬 Ask AI Assistant';
  const TARGET = script.getAttribute('data-target');
  
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
  
  // Create iframe fallback
  const iframe = document.createElement('iframe');
  iframe.src = 'https://openai-assistants-api-production.up.railway.app/embed';
  iframe.style.width = '100%';
  iframe.style.height = HEIGHT;
  iframe.style.border = 'none';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
  
  container.appendChild(iframe);
})();
    `);
  }
});

// NEW: Serve embed page (iframe version)
app.get('/embed', (req, res) => {
  const embedPath = path.join(__dirname, 'public', 'embed.html');
  const fs = require('fs');
  
  if (fs.existsSync(embedPath)) {
    res.sendFile(embedPath);
  } else {
    // Fallback to index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// NEW: Demo page
app.get('/demo', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inline Chat Widget Demo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; }
    .section { background: white; padding: 30px; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    pre { background: #1a1a1a; color: #e6e6e6; padding: 15px; border-radius: 6px; overflow-x: auto; }
    .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="section">
      <h1>🚀 Inline Chat Widget Demo</h1>
      <p>This demonstrates how to embed the chat widget directly into your webpage.</p>
      
      <div class="highlight">
        <strong>💡 Usage:</strong> Add this script tag to your HTML:
      </div>
      
      <pre>&lt;script src="https://openai-assistants-api-production.up.railway.app/inline-embed.js"&gt;&lt;/script&gt;</pre>
      
      <h2>🎯 Live Demo:</h2>
    </div>
    
    <!-- Actual embed -->
    <script src="/inline-embed.js" data-height="400px" data-title="🤖 Demo Assistant"></script>
    
    <div class="section">
      <h2>✨ Features</h2>
      <ul>
        <li>No popups - integrates naturally</li>
        <li>Responsive design</li>
        <li>Easy one-script integration</li>
        <li>Customizable height and title</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `);
});

// NEW: Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Existing chat endpoint (unchanged)
app.post('/chat', async (req, res) => {
  const { threadId, message } = req.body;
  let tId = threadId;

  // Set SSE headers early
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Kickstart SSE so client starts listening
  res.write(':\n\n');

  try {
    // Create thread if needed
    if (!tId || tId === 'undefined' || typeof tId !== "string" || !tId.startsWith("thread_")) {
      console.log("🌀 No threadId provided, creating new thread...");
      const tRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      });

      const tData = await tRes.json();
      console.log("📩 Thread creation response:", tData);

      if (!tRes.ok || !tData.id) throw new Error(`Thread creation failed: ${JSON.stringify(tData)}`);

      tId = tData.id;
    }

    console.log(`✅ Using threadId: ${tId}`);
    res.write(`data: ${JSON.stringify({ threadId: tId })}\n\n`);

    // Send user message
    console.log("📨 Sending message to thread...");
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${tId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'user', content: message })
    });

    const msgData = await msgRes.json();
    console.log("📩 Message send response:", msgData);

    if (!msgRes.ok) throw new Error(`Message send failed: ${JSON.stringify(msgData)}`);

    // Start run stream
    console.log("📡 Starting run stream...");
    const runRes = await fetch(`https://api.openai.com/v1/threads/${tId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        stream: true
      })
    });

    if (!runRes.ok || !runRes.body) {
      const errText = await runRes.text();
      throw new Error(`Run stream failed: ${errText}`);
    }

    const reader = runRes.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
    
      const chunk = decoder.decode(value, { stream: true });
    
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;

        console.log("Json Response:", line);
    
        const data = line.slice(6).trim();
        if (!data) continue;
    
        if (data === "[DONE]") {
          console.log("✅ Stream completed");
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          break;
        }
    
        try {
          const event = JSON.parse(data);
    
          // Only handle 'thread.message.delta' events with text content
          if (event.object === "thread.message.delta" && event.delta?.content) {
            for (const block of event.delta.content) {
              if (block.type === "text" && block.text?.value) {
                res.write(`data: ${JSON.stringify({ delta: block.text.value })}\n\n`);
              }
            }
          }
    
        } catch (err) {
          // ignore malformed JSON / pings
        }
      }
    }
    
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("💥 Server error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Embed script: https://openai-assistants-api-production.up.railway.app/inline-embed.js`);
  console.log(`🎯 Demo page: https://openai-assistants-api-production.up.railway.app/demo`);
});
