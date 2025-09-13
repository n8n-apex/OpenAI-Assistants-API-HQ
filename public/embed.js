/* embed.js */
(function () {
  // prevent double load
  if (window.__OA_INLINE_BOOT__) return;
  window.__OA_INLINE_BOOT__ = true;

  /* -------------------- Utilities -------------------- */
  function getDeviceId() {
    var ua = navigator.userAgent, pf = navigator.platform;
    return btoa(ua + pf);
  }
  function generateSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function getCookie(name) {
    var result = null;
    if (document.cookie && document.cookie !== "") {
      var parts = document.cookie.split(";");
      for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c.substring(0, name.length + 1) === name + "=") {
          result = decodeURIComponent(c.substring(name.length + 1));
          break;
        }
      }
    }
    return result;
  }
  function setSessionCookie(projectId) {
    var key = "cgpts-" + projectId;
    var val = getCookie(key);
    var exp = new Date();
    exp.setTime(exp.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    if (!val) val = generateSessionId();
    document.cookie =
      key +
      "=" +
      val +
      "; expires=" +
      exp.toUTCString() +
      "; path=/; Samesite=Lax; Secure;";
    return val;
  }
  function refreshSessionId(projectId) {
    var key = "cgpts-" + projectId;
    if (getCookie(key)) {
      document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
    }
    return setSessionCookie(projectId);
  }

  // create element helpers
  function assignDeep(el, props) {
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v && typeof v === "object" && !(v instanceof Node)) {
        if (!el[k]) el[k] = {};
        assignDeep(el[k], v);
      } else {
        el[k] = v;
      }
    });
    return el;
  }
  function makeIframe(opts) {
    var defaults = {
      src: "about:blank",
      border: "0",
      padding: "0",
      frameBorder: "0",
      marginWidth: "0",
      marginHeight: "0",
      vspace: "0",
      hspace: "0",
      scrolling: "no",
      className: "",
      width: "100%",
      height: "100%",
      style: {},
      allow: "clipboard-write;",
    };
    var cfg = assignDeep({}, defaults);
    assignDeep(cfg, opts || {});
    var el = document.createElement("iframe");
    assignDeep(el, cfg);
    return el;
  }
  function tooltip(btn, text) {
    const tip = document.createElement("span");
    tip.innerHTML = text;
    tip.style.cssText +=
      "position:absolute;top:-3rem;left:-4rem;color:#fff;background:#3b3b3b;padding:0.5rem;border-radius:0.5rem;border:1px solid #808080;max-width:10rem;opacity:0;visibility:hidden;z-index:1;white-space:pre-wrap;line-height:1.2;transition:all 200ms";
    btn.appendChild(tip);
    btn.setAttribute("aria-label", text);
    btn.onmouseenter = function () {
      tip.style.opacity = 1;
      tip.style.visibility = "visible";
    };
    btn.onmouseleave = function () {
      tip.style.opacity = 0;
      tip.style.visibility = "hidden";
    };
  }
  function pickTextColor(bgHexOrRgba) {
    // simple contrast check; assumes hex like #RRGGBB or rgba/array
    let r = 115, g = 103, b = 240, a = 1; // fallback to brand color #7367f0
    if (typeof bgHexOrRgba === "string" && bgHexOrRgba.startsWith("#")) {
      let h = bgHexOrRgba.replace("#", "");
      if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
      const n = parseInt(h, 16);
      r = (n >> 16) & 255;
      g = (n >> 8) & 255;
      b = n & 255;
    }
    const yiq = (299 * r + 587 * g + 114 * b) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  }

  /* -------------------- Script attributes -------------------- */
  var s =
    document.currentScript ||
    (function () {
      var xs = document.getElementsByTagName("script");
      return xs[xs.length - 1];
    })();

  // Host where the iframe lives (your app)
  var APP = "https://openai-assistants-api-production.up.railway.app";

  // Attributes
  var PROJECT_ID = s.getAttribute("data-project") || "default";
  var PUBLIC_KEY = s.getAttribute("data-key") || "";
  var TARGET_SEL = s.getAttribute("data-target") || "#ai-chat";
  var WIDTH = s.getAttribute("data-width") || "100%";
  var HEIGHT = s.getAttribute("data-height") || "100%";
  var DEBUG = Number(s.getAttribute("data-debug") || "0");
  var PREPROMPT = s.getAttribute("data-prompt") || "";
  var EXTERNAL_ID = s.getAttribute("data-external-id") || "";
  var RESET_ON_LOAD = Number(s.getAttribute("data-reset") || "0");

  // Theme from remote (optional safe defaults)
  var TOOLBAR_BG = s.getAttribute("data-toolbar-color") || "#7367f0";
  var BRAND_COLOR = s.getAttribute("data-brand-color") || "#7367f0";
  var BTN_FG = pickTextColor(BRAND_COLOR);

  // Where to mount
  var mount = document.querySelector(TARGET_SEL);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = TARGET_SEL.startsWith("#") ? TARGET_SEL.slice(1) : "ai-chat";
    document.body.appendChild(mount);
  }

  // Ensure CSS (optional: serve a small stylesheet from your app)
  if (!document.querySelector('link[data-chat-css="1"]')) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = APP + "/style.css";
    link.setAttribute("data-chat-css", "1");
    document.head.appendChild(link);
  }

  // Inline overrides to keep things embedded in-page
  if (!document.querySelector('style[data-chat-inline-overrides="1"]')) {
    var ov = document.createElement("style");
    ov.setAttribute("data-chat-inline-overrides", "1");
    ov.textContent = `
      #oa-chat-widget{display:flex;position:relative;width:100%;height:auto;max-width:100%;}
      #oa-chat-body{height:calc(100% - var(--oa-chat-header-h));}
      .oa-hidden{display:none !important;}
    `;
    document.head.appendChild(ov);
  }

  /* -------------------- Markup -------------------- */
  var container = document.createElement("div");
  container.id = "oa-chat-container";
  container.className = "oa-chat-container";
  container.style.width = WIDTH;
  container.style.height = HEIGHT;
  container.style.setProperty("--oa-chat-header-h", "45px");

  // header with actions
  var header = document.createElement("div");
  header.id = "oa-chat-header";
  header.style.backgroundColor = TOOLBAR_BG;
  header.style.height = "var(--oa-chat-header-h)";
  header.style.display = "flex";
  header.style.justifyContent = "flex-end";
  header.style.alignItems = "center";
  header.style.gap = "1rem";
  header.style.paddingInline = "1rem";

  // buttons base style
  var BTN_BASE = {
    cursor: "pointer",
    borderRadius: "50%",
    outline: "none",
    border: "0",
    position: "relative",
    color: "var(--oa-btn-fg, #fff)",
    padding: "0",
    backgroundColor: "var(--oa-btn-bg, #000)",
    width: "28px",
    height: "28px",
    lineHeight: "0",
  };

  // Reset button
  var resetBtn = document.createElement("button");
  resetBtn.id = "oa-reset";
  resetBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg>';
  Object.assign(resetBtn.style, BTN_BASE);
  tooltip(resetBtn, "Start a new conversation");

  // Share button (visibility controlled by iframe)
  var shareBtn = document.createElement("button");
  shareBtn.id = "oa-share";
  shareBtn.className = "oa-hidden";
  shareBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m12-6a3 3 0 1 0 6 0a3 3 0 1 0-6 0m0 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0m-6.3-7.3l6.6-3.4m-6.6 6l6.6 3.4"/></svg>';
  Object.assign(shareBtn.style, BTN_BASE);
  tooltip(shareBtn, "Share conversation");

  // Export button (visibility controlled by iframe)
  var exportBtn = document.createElement("button");
  exportBtn.id = "oa-export";
  exportBtn.className = "oa-hidden";
  exportBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5l5-5m-5-7v12"/></svg>';
  Object.assign(exportBtn.style, BTN_BASE);
  tooltip(exportBtn, "Export conversation");

  header.appendChild(shareBtn);
  header.appendChild(exportBtn);
  header.appendChild(resetBtn);

  // set CSS variables for icon colors
  var colorHost = document.createElement("div");
  colorHost.style.setProperty("--oa-btn-bg", BRAND_COLOR);
  colorHost.style.setProperty("--oa-btn-fg", BTN_FG);

  // iframe
  var sessionId = RESET_ON_LOAD ? refreshSessionId(PROJECT_ID) : setSessionCookie(PROJECT_ID);
  var deviceId = getDeviceId();

  function buildIframeSrc() {
    var url = new URL(APP + "/embed");
    url.searchParams.set("project", PROJECT_ID);
    url.searchParams.set("key", PUBLIC_KEY);
    url.searchParams.set("session", sessionId);
    url.searchParams.set("device", deviceId);
    url.searchParams.set("rs", "embed");
    url.searchParams.set("embed", "1");
    if (PREPROMPT) {
      url.searchParams.set("prompt", PREPROMPT);
      url.searchParams.set("preprompt", "1");
    }
    if (EXTERNAL_ID) url.searchParams.set("external_id", EXTERNAL_ID);

    // Lightweight page context (safe, in URL)
    url.searchParams.set("page", window.location.href);
    url.searchParams.set("title", document.title || "");
    return url.toString();
  }

  var iframe = makeIframe({
    src: buildIframeSrc(),
    width: "100%",
    height: "100%",
    scrolling: "yes",
  });
  iframe.setAttribute("aria-label", "Embedded Chat");
  iframe.style.height = "calc(100% - var(--oa-chat-header-h))";

  // wire up actions
  function hardReset() {
    sessionId = refreshSessionId(PROJECT_ID);
    iframe.src = buildIframeSrc();
  }
  resetBtn.addEventListener("click", function (e) {
    e.preventDefault();
    hardReset();
  });
  shareBtn.addEventListener("click", function (e) {
    e.preventDefault();
    iframe.contentWindow?.postMessage({ action: "share-conversation" }, APP);
  });
  exportBtn.addEventListener("click", function (e) {
    e.preventDefault();
    iframe.contentWindow?.postMessage({ action: "export-conversation" }, APP);
  });

  // postMessage bridge from iframe
  window.addEventListener("message", function (evt) {
    if (evt.origin !== APP) return;
    var payload = evt.data || {};
    if (payload.action === "export-button-visibility") {
      exportBtn.classList.toggle("oa-hidden", !payload.showExportButton);
    }
    if (payload.action === "share-button-visibility") {
      shareBtn.classList.toggle("oa-hidden", !payload.showShareButton);
    }
    if (payload.status === "error" && payload.code === 403) {
      // Refresh session on auth-ish errors
      hardReset();
    }
  });

  // assemble DOM
  colorHost.appendChild(header);
  colorHost.appendChild(iframe);
  container.appendChild(colorHost);
  mount.appendChild(container);

  if (Number(DEBUG)) {
    // eslint-disable-next-line no-console
    console.log("[embed] src:", iframe.src);
  }
})();
