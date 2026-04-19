/**
 * MATIC Studio Chat Agent - Website Integration
 * Redesigned to match MATIC Studio's clean corporate identity.
 */

(function () {
    'use strict';
  
    const CHAT_API_URL = 'https://maticstudio-chat-agent.onrender.com';
    const CALENDLY_URL = 'https://calendly.com/maticstudio/tune-up-call';
    const SCHEDULING_KEYWORDS = ['schedule', 'booking', 'appointment', 'call', 'meeting', 'consultation', 'tune-up', 'calendly'];
    const FETCH_TIMEOUT_MS = 12000;
  
    let sessionId = null;
    let conversationHistory = [];
    let isProcessing = false;
    let isOpen = false;
    let calendlyWindow = null;
  
    /* ─── STYLES ─────────────────────────────────────────────────── */
    function injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --mc-ink:       #0f0f0f;
          --mc-ink-mid:   #3a3a3a;
          --mc-ink-muted: #888888;
          --mc-rule:      #e0ddd6;
          --mc-bg:        #faf9f7;
          --mc-surface:   #ffffff;
          --mc-accent:    #c8a96e;
          --mc-font-head: 'Instrument Serif', Georgia, serif;
          --mc-font-body: 'DM Sans', system-ui, sans-serif;
          --mc-radius:    2px;
          --mc-shadow:    0 8px 40px rgba(15,15,15,0.14);
        }
  
        /* ── Trigger button ── */
        #mc-trigger {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9000;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--mc-ink);
          color: #fff;
          border: none;
          cursor: pointer;
          padding: 0.75rem 1.25rem 0.75rem 1rem;
          border-radius: var(--mc-radius);
          font-family: var(--mc-font-body);
          font-size: 0.8125rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          box-shadow: var(--mc-shadow);
          transition: background 0.2s, transform 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        #mc-trigger:hover { background: #2a2a2a; transform: translateY(-1px); }
  
        #mc-trigger-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--mc-accent);
          flex-shrink: 0;
          animation: mc-pulse 2.4s ease-in-out infinite;
        }
        @keyframes mc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.65); }
        }
  
        /* ── Backdrop ── */
        #mc-backdrop {
          position: fixed; inset: 0;
          z-index: 9001;
          background: rgba(15,15,15,0.32);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.32s ease;
        }
        #mc-backdrop.mc-open { opacity: 1; pointer-events: all; }
  
        /* ── Panel ── */
        #mc-panel {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          z-index: 9002;
          width: min(420px, 100vw);
          background: var(--mc-bg);
          border-left: 1px solid var(--mc-rule);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.34s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--mc-font-body);
        }
        #mc-panel.mc-open { transform: translateX(0); }
  
        /* ── Header ── */
        #mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--mc-rule);
          flex-shrink: 0;
          background: var(--mc-bg);
        }
        #mc-header-left { display: flex; align-items: center; gap: 0.75rem; }
        #mc-avatar {
          width: 36px; height: 36px;
          border-radius: var(--mc-radius);
          background: var(--mc-ink);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        #mc-avatar span {
          font-family: var(--mc-font-head);
          font-style: italic;
          font-size: 1rem;
          color: #fff;
          line-height: 1;
        }
        #mc-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--mc-ink);
          line-height: 1.2;
        }
        #mc-subtitle {
          font-size: 0.725rem;
          color: var(--mc-ink-muted);
          margin-top: 1px;
        }
        #mc-header-right { display: flex; align-items: center; gap: 0.5rem; }
        .mc-icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--mc-ink-muted);
          padding: 5px; border-radius: var(--mc-radius);
          display: flex; align-items: center;
          transition: color 0.15s, background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .mc-icon-btn:hover { color: var(--mc-ink); background: var(--mc-rule); }
  
        /* ── Messages ── */
        #mc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          scroll-behavior: smooth;
        }
        #mc-messages::-webkit-scrollbar { width: 3px; }
        #mc-messages::-webkit-scrollbar-track { background: transparent; }
        #mc-messages::-webkit-scrollbar-thumb { background: var(--mc-rule); border-radius: 2px; }
  
        .mc-msg { display: flex; flex-direction: column; gap: 3px; max-width: 86%; }
        .mc-msg--bot  { align-self: flex-start; }
        .mc-msg--user { align-self: flex-end; }
  
        .mc-bubble {
          padding: 0.7rem 1rem;
          border-radius: var(--mc-radius);
          font-size: 0.875rem;
          line-height: 1.65;
        }
        .mc-msg--bot  .mc-bubble { background: var(--mc-surface); border: 1px solid var(--mc-rule); color: var(--mc-ink); }
        .mc-msg--user .mc-bubble { background: var(--mc-ink); color: #fff; }
  
        .mc-time {
          font-size: 0.6563rem;
          color: var(--mc-ink-muted);
          padding: 0 0.2rem;
        }
        .mc-msg--user .mc-time { text-align: right; }
  
        /* ── Typing indicator ── */
        .mc-typing {
          display: flex; align-items: center; gap: 4px;
          padding: 0.7rem 1rem;
          background: var(--mc-surface);
          border: 1px solid var(--mc-rule);
          border-radius: var(--mc-radius);
          width: fit-content;
        }
        .mc-typing-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--mc-ink-muted);
          animation: mc-bounce 1.2s ease-in-out infinite;
        }
        .mc-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .mc-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes mc-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
  
        /* ── Quick replies ── */
        #mc-suggestions {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          padding: 0 1.5rem 1rem;
          flex-shrink: 0;
        }
        .mc-suggestion {
          background: none;
          border: 1px solid var(--mc-rule);
          border-radius: var(--mc-radius);
          padding: 0.4rem 0.8rem;
          font-family: var(--mc-font-body);
          font-size: 0.75rem;
          color: var(--mc-ink-mid, #3a3a3a);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .mc-suggestion:hover { border-color: var(--mc-ink); color: var(--mc-ink); background: var(--mc-surface); }
  
        /* ── Input row ── */
        #mc-input-row {
          display: flex; gap: 0.5rem;
          padding: 1rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--mc-rule);
          flex-shrink: 0;
          background: var(--mc-bg);
        }
        #mc-input {
          flex: 1;
          font-family: var(--mc-font-body);
          font-size: 0.875rem;
          color: var(--mc-ink);
          background: var(--mc-surface);
          border: 1px solid var(--mc-rule);
          border-radius: var(--mc-radius);
          padding: 0.65rem 0.9rem;
          resize: none;
          height: 42px;
          line-height: 1.5;
          outline: none;
          transition: border-color 0.2s;
        }
        #mc-input:focus { border-color: var(--mc-ink); }
        #mc-input::placeholder { color: var(--mc-ink-muted); }
        #mc-send {
          background: var(--mc-ink); color: #fff;
          border: none; border-radius: var(--mc-radius);
          width: 42px; height: 42px; flex-shrink: 0;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        #mc-send:hover:not(:disabled) { background: #2a2a2a; }
        #mc-send:disabled { background: var(--mc-rule); cursor: not-allowed; }
  
        /* ── Calendly notice ── */
        .mc-calendly-notice {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8125rem; color: var(--mc-ink-muted);
          margin-top: 4px; padding: 0 0.2rem;
        }
        .mc-calendly-link {
          color: var(--mc-ink); font-weight: 500;
          text-decoration: underline; cursor: pointer; background: none; border: none;
          font-family: var(--mc-font-body); font-size: 0.8125rem; padding: 0;
        }
        .mc-calendly-link:hover { color: var(--mc-ink-muted); }
      `;
      document.head.appendChild(style);
    }
  
    /* ─── DOM ─────────────────────────────────────────────────────── */
    function buildWidget() {
      // Trigger button
      const trigger = document.createElement('button');
      trigger.id = 'mc-trigger';
      trigger.setAttribute('aria-label', 'Open MATIC Studio Assistant');
      trigger.innerHTML = `<span id="mc-trigger-dot"></span>Ask MATIC`;
      trigger.addEventListener('click', openPanel);
      document.body.appendChild(trigger);
  
      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.id = 'mc-backdrop';
      backdrop.addEventListener('click', closePanel);
      document.body.appendChild(backdrop);
  
      // Panel
      const panel = document.createElement('div');
      panel.id = 'mc-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'MATIC Studio Assistant');
      panel.setAttribute('aria-modal', 'true');
      panel.innerHTML = `
        <div id="mc-header">
          <div id="mc-header-left">
            <div id="mc-avatar"><span>M</span></div>
            <div>
              <div id="mc-title">MATIC Assistant</div>
              <div id="mc-subtitle">Ask me anything about automation</div>
            </div>
          </div>
          <div id="mc-header-right">
            <button class="mc-icon-btn" id="mc-reset-btn" title="Reset conversation" aria-label="Reset conversation">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button class="mc-icon-btn" id="mc-close-btn" title="Close" aria-label="Close assistant">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/>
              </svg>
            </button>
          </div>
        </div>
  
        <div id="mc-messages"></div>
  
        <div id="mc-suggestions">
          <button class="mc-suggestion" data-q="What services does MATIC Studio offer?">What do you offer?</button>
          <button class="mc-suggestion" data-q="How do I start a project with MATIC Studio?">Start a project</button>
          <button class="mc-suggestion" data-q="Who are the people behind MATIC Studio?">Meet the team</button>
          <button class="mc-suggestion" data-q="I'd like to schedule a consultation">Book a call</button>
        </div>
  
        <div id="mc-input-row">
          <textarea id="mc-input" placeholder="Ask about automation, pricing, the team…" rows="1" aria-label="Your message"></textarea>
          <button id="mc-send" disabled aria-label="Send message">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(panel);
  
      // Wire events
      document.getElementById('mc-close-btn').addEventListener('click', closePanel);
      document.getElementById('mc-reset-btn').addEventListener('click', resetChat);
      document.getElementById('mc-send').addEventListener('click', () => submitMessage());
      document.getElementById('mc-input').addEventListener('input', onInputChange);
      document.getElementById('mc-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMessage(); }
      });
      document.getElementById('mc-suggestions').querySelectorAll('.mc-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
          hideSuggestions();
          submitMessage(btn.getAttribute('data-q'));
        });
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closePanel(); });
    }
  
    /* ─── PANEL OPEN / CLOSE ──────────────────────────────────────── */
    function openPanel() {
      isOpen = true;
      document.getElementById('mc-panel').classList.add('mc-open');
      document.getElementById('mc-backdrop').classList.add('mc-open');
      document.getElementById('mc-trigger').style.display = 'none';
      if (conversationHistory.length === 0) addWelcome();
      if (!sessionId) sessionId = newSessionId();
      setTimeout(() => document.getElementById('mc-input').focus(), 380);
    }
  
    function closePanel() {
      isOpen = false;
      document.getElementById('mc-panel').classList.remove('mc-open');
      document.getElementById('mc-backdrop').classList.remove('mc-open');
      document.getElementById('mc-trigger').style.display = '';
    }
  
    function resetChat() {
      conversationHistory = [];
      sessionId = newSessionId();
      document.getElementById('mc-messages').innerHTML = '';
      document.getElementById('mc-suggestions').style.display = '';
      addWelcome();
      document.getElementById('mc-input').value = '';
      document.getElementById('mc-input').style.height = '42px';
      document.getElementById('mc-send').disabled = true;
    }
  
    /* ─── MESSAGES ────────────────────────────────────────────────── */
    function addWelcome() {
      addBotMessage("Hello! I'm your MATIC Studio assistant. I can answer questions about our services, help scope your project, or book a consultation with the team. What brings you here today?");
    }
  
    function getTime() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  
    function addBotMessage(text) {
      const wrap = document.createElement('div');
      wrap.className = 'mc-msg mc-msg--bot';
      wrap.innerHTML = `<div class="mc-bubble">${formatText(text)}</div><div class="mc-time">${getTime()}</div>`;
      document.getElementById('mc-messages').appendChild(wrap);
      scrollBottom();
    }
  
    function addUserMessage(text) {
      const wrap = document.createElement('div');
      wrap.className = 'mc-msg mc-msg--user';
      wrap.innerHTML = `<div class="mc-bubble">${esc(text)}</div><div class="mc-time">${getTime()}</div>`;
      document.getElementById('mc-messages').appendChild(wrap);
      scrollBottom();
    }
  
    function showTyping() {
      const wrap = document.createElement('div');
      wrap.className = 'mc-msg mc-msg--bot';
      wrap.id = 'mc-typing';
      wrap.innerHTML = `<div class="mc-typing"><div class="mc-typing-dot"></div><div class="mc-typing-dot"></div><div class="mc-typing-dot"></div></div>`;
      document.getElementById('mc-messages').appendChild(wrap);
      scrollBottom();
    }
  
    function hideTyping() {
      const el = document.getElementById('mc-typing');
      if (el) el.remove();
    }
  
    function hideSuggestions() {
      document.getElementById('mc-suggestions').style.display = 'none';
    }
  
    function scrollBottom() {
      const el = document.getElementById('mc-messages');
      el.scrollTop = el.scrollHeight;
    }
  
    function formatText(str) {
      return str
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    }
  
    function esc(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  
    /* ─── INPUT ───────────────────────────────────────────────────── */
    function onInputChange() {
      const inp = document.getElementById('mc-input');
      document.getElementById('mc-send').disabled = inp.value.trim() === '' || isProcessing;
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
    }
  
    /* ─── SEND / API ──────────────────────────────────────────────── */
    async function submitMessage(overrideText) {
      const inp = document.getElementById('mc-input');
      const text = overrideText || inp.value.trim();
      if (!text || isProcessing) return;
  
      hideSuggestions();
      addUserMessage(text);
      if (!overrideText) { inp.value = ''; inp.style.height = '42px'; }
      document.getElementById('mc-send').disabled = true;
      isProcessing = true;
      showTyping();
  
      // Scheduling intent → open Calendly
      const lower = text.toLowerCase();
      if (SCHEDULING_KEYWORDS.some(k => lower.includes(k))) {
        hideTyping();
        addBotMessage("I'd love to help you book time with the team. Opening our scheduling calendar now…");
        openCalendly();
        isProcessing = false;
        return;
      }
  
      if (!sessionId) sessionId = newSessionId();
      conversationHistory.push({ role: 'user', content: text });
  
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
      try {
        const res = await fetch(`${CHAT_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation_history: conversationHistory,
            session_id: sessionId
          }),
          signal: controller.signal,
          mode: 'cors'
        });
  
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
        const data = await res.json();
        hideTyping();
  
        const isSuccess = data && (data.status === 'success' || (typeof data.response === 'string' && data.response.length > 0));
        const reply = isSuccess
          ? (data.response || 'Got it.')
          : fallback(lower);
  
        if (data.session_id) sessionId = data.session_id;
        conversationHistory.push({ role: 'assistant', content: reply });
        addBotMessage(reply);
  
      } catch (err) {
        clearTimeout(timeout);
        hideTyping();
        const reply = fallback(lower);
        addBotMessage(reply);
      } finally {
        isProcessing = false;
        document.getElementById('mc-send').disabled = document.getElementById('mc-input').value.trim() === '';
        document.getElementById('mc-input').focus();
      }
    }
  
    /* ─── FALLBACK ────────────────────────────────────────────────── */
    const FALLBACKS = [
      [['what do you offer', 'services', 'what can you do'],
        "MATIC Studio specializes in business process automation — workflow automation, AI integration, custom scheduling, and process optimization. We work across Healthcare, Banking, BPOs, Telecom, Oil & Gas, and Payments. Want to tell me about your business so I can suggest where we'd fit?"],
      [['team', 'who are you', 'founders', 'people'],
        "MATIC Studio was founded by **Neil Zoleta** (Lead Architect) alongside partners **Shiela Joyce Canent** and **Alex Chen**, both Chief Engineers. We're based in Taguig City, Metro Manila."],
      [['pricing', 'cost', 'how much', 'rates'],
        "Our pricing depends on the scope and complexity of your automation needs. I'd recommend a free consultation so we can understand your processes and give you a tailored quote. Want to book a call?"],
      [['contact', 'email', 'reach'],
        "You can reach the team at **inquire@maticstudio.net**, or book a consultation directly through our calendar. I can open the scheduler for you — just say the word."],
    ];
  
    function fallback(lower) {
      for (const [keywords, response] of FALLBACKS) {
        if (keywords.some(k => lower.includes(k))) return response;
      }
      return "I'm having a little trouble reaching our servers right now. You're welcome to email us at **inquire@maticstudio.net** and the team will respond promptly.";
    }
  
    /* ─── CALENDLY ────────────────────────────────────────────────── */
    function openCalendly() {
      if (calendlyWindow && !calendlyWindow.closed) {
        try { calendlyWindow.focus(); return; } catch (_) {}
      }
      const win = window.open(CALENDLY_URL, '_blank', 'noopener');
      calendlyWindow = win || null;
      if (!win) window.location.href = CALENDLY_URL;
    }
  
    /* ─── UTILS ───────────────────────────────────────────────────── */
    function newSessionId() {
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  
    /* ─── INIT ────────────────────────────────────────────────────── */
    function init() {
      injectStyles();
      buildWidget();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();