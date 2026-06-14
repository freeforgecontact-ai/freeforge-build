/* FreeForge — noyau partagé. 100% local, zéro dépendance, offline-first.
   Contrat outil: FF.register({id,title,icon,desc,tag,mount(root,ctx)}). */
(function (w) {
  "use strict";
  const FF = (w.FF = w.FF || {});
  FF._tools = [];
  FF.app = { name: "FreeForge", logo: "FF", tagline: "" };

  /* ---------- DOM ---------- */
  function el(tag, props, children) {
    const e = document.createElement(tag);
    if (props && (typeof props !== "object" || props.nodeType || Array.isArray(props))) { children = props; props = null; }
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === "class" || k === "className") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k === "dataset") Object.assign(e.dataset, v);
      else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k in e && k !== "list") { try { e[k] = v; } catch (_) { e.setAttribute(k, v); } }
      else e.setAttribute(k, v);
    }
    append(e, children);
    return e;
  }
  function append(e, c) {
    if (c == null) return;
    if (Array.isArray(c)) return c.forEach((x) => append(e, x));
    e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  /* ---------- Storage (JSON-safe, namespaced) ---------- */
  function store(ns) {
    const p = "ff:" + ns + ":";
    return {
      get(k, def) { try { const r = localStorage.getItem(p + k); return r == null ? def : JSON.parse(r); } catch (_) { return def; } },
      set(k, v) { try { localStorage.setItem(p + k, JSON.stringify(v)); return true; } catch (_) { FF.toast("Stockage plein", "err"); return false; } },
      remove(k) { try { localStorage.removeItem(p + k); } catch (_) {} },
      keys() { return Object.keys(localStorage).filter((x) => x.indexOf(p) === 0).map((x) => x.slice(p.length)); },
      clearAll() { this.keys().forEach((k) => this.remove(k)); }
    };
  }

  /* ---------- Format (fr-CA) ---------- */
  const _money = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
  const fmt = {
    money: (n, cur) => cur ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: cur }).format(n || 0) : _money.format(n || 0),
    num: (n, d) => new Intl.NumberFormat("fr-CA", { maximumFractionDigits: d == null ? 2 : d }).format(n || 0),
    pct: (n, d) => new Intl.NumberFormat("fr-CA", { style: "percent", maximumFractionDigits: d == null ? 1 : d }).format(n || 0),
    date: (d) => new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(d ? new Date(d) : new Date())
  };
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  /* ---------- Save / Share (native-aware) ---------- */
  function blobOf(content, mime) {
    if (content instanceof Blob) return content;
    return new Blob([content], { type: mime || "application/octet-stream" });
  }
  async function save(filename, content, mime) {
    const blob = blobOf(content, mime);
    // Capacitor (APK / desktop) — écrit sur l'appareil + propose un partage
    if (w.Capacitor && w.Capacitor.isNativePlatform && w.Capacitor.isNativePlatform()) {
      try { return await FF._nativeSave(filename, blob); } catch (e) { /* fallback web */ }
    }
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    FF.toast("Enregistré : " + filename);
    return true;
  }
  async function shareText(title, text) {
    if (navigator.share) { try { await navigator.share({ title, text }); return true; } catch (_) {} }
    try { await navigator.clipboard.writeText(text); FF.toast("Copié dans le presse-papier"); return true; } catch (_) { return false; }
  }
  function copy(text) { return shareText(null, text); }

  /* ---------- Online + cache (T2 tools) ---------- */
  async function cachedFetch(url, opts) {
    opts = opts || {};
    const st = store("cache");
    const key = opts.key || url;
    const ttl = opts.ttl || 6 * 3600e3;
    const cached = st.get(key);
    if (FF.net.online) {
      try {
        const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), opts.timeout || 9000);
        const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(to);
        if (!r.ok) throw new Error(r.status);
        const data = opts.text ? await r.text() : await r.json();
        st.set(key, { at: Date.now(), data });
        return { data, fresh: true, at: Date.now() };
      } catch (e) { if (cached) return { data: cached.data, fresh: false, at: cached.at, error: e }; throw e; }
    }
    if (cached) return { data: cached.data, fresh: false, at: cached.at, offline: true };
    throw new Error("offline-no-cache");
  }

  /* ---------- Toast ---------- */
  let toastEl, toastT;
  function toast(msg, type) {
    if (!toastEl) { toastEl = el("div", { class: "ff-toast" }); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.style.background = type === "err" ? "var(--pg-err)" : type === "ok" ? "var(--pg-ok)" : "var(--pg-ink)";
    toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  /* ---------- Print (→ PDF via navigateur, 100% local) ---------- */
  function printNode(title, node) {
    const win = w.open("", "_blank");
    if (!win) { FF.toast("Autorise les pop-ups pour imprimer", "err"); return; }
    const css = $$("link[rel=stylesheet]").map((l) => `<link rel="stylesheet" href="${l.href}">`).join("");
    win.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title || FF.app.name}</title>${css}
      <style>body{background:#fff;padding:24px;max-width:800px;margin:auto}@page{margin:14mm}</style></head>
      <body>${node.outerHTML}</body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
    setTimeout(() => { try { win.focus(); win.print(); } catch (_) {} }, 500);
  }

  /* ---------- Net state ---------- */
  FF.net = { online: navigator.onLine };
  function paintNet() {
    const b = $("#ffNet"); if (!b) return;
    b.textContent = FF.net.online ? "● en ligne" : "● hors-ligne";
    b.classList.toggle("off", !FF.net.online);
  }
  w.addEventListener("online", () => { FF.net.online = true; paintNet(); });
  w.addEventListener("offline", () => { FF.net.online = false; paintNet(); });

  /* ---------- Registry + boot ---------- */
  function register(tool) { FF._tools.push(tool); return tool; }

  function boot(cfg) {
    FF.app = Object.assign(FF.app, cfg || {});
    document.title = FF.app.name + " — FreeForge";
    const tools = FF._tools;
    const appName = (FF.app.name || "").replace(/^FreeForge\s*/i, "") || FF.app.name;
    const sky = el("div", { class: "ff-sky" }, [
      el("div", { class: "ff-sun" }), el("div", { class: "ff-cloud c1" }),
      el("div", { class: "ff-cloud c2" }), el("div", { class: "ff-cloud c3" })
    ]);
    const bar = el("header", { class: "ff-bar" }, el("div", { class: "ff-bar-in" }, [
      el("button", { class: "ff-back", title: "Retour", onClick: () => location.hash = "" }, "‹"),
      el("div", { class: "ff-logo" }, FF.app.logo || "FF"),
      el("div", { class: "ff-word" }, ["Free", el("span", { class: "forge" }, "Forge")]),
      appName ? el("span", { class: "ff-app-pill" }, appName) : null,
      el("span", { class: "ff-by" }, "par PGRG"),
      el("span", { class: "ff-spacer" }),
      el("span", { class: "ff-net", id: "ffNet" }, "●")
    ]));
    const wrap = el("main", { class: "ff-wrap" });
    const intro = el("section", { class: "ff-intro" }, [
      el("h1", FF.app.name),
      el("p", FF.app.tagline || "")
    ]);
    const grid = el("section", { class: "ff-grid" },
      tools.map((t, i) => el("button", { class: "ff-card", onClick: () => location.hash = t.id }, [
        t.tag ? el("span", { class: "tag" }, t.tag) : null,
        el("span", { class: "ic" }, t.icon || "🧰"),
        el("h3", t.title),
        el("p", t.desc || "")
      ]))
    );
    const launcher = el("div", {}, [intro, grid]);
    const surface = el("div", { class: "ff-tool" });
    wrap.append(launcher, surface);
    document.body.append(sky, bar, wrap);
    paintNet();

    const ctx = { el, $, $$, clear, store, fmt, round2, save, shareText, copy, cachedFetch, toast, print: printNode, app: FF.app };
    FF.ctx = ctx;
    const mounted = {};
    function route() {
      const id = (location.hash || "").replace(/^#/, "");
      const tool = tools.find((t) => t.id === id);
      if (!tool) { launcher.style.display = ""; surface.classList.remove("active"); bar.classList.remove("intool"); window.scrollTo(0, 0); return; }
      launcher.style.display = "none"; bar.classList.add("intool");
      clear(surface); surface.classList.add("active");
      const head = el("div", { class: "ff-intro" }, [el("h1", [el("span", { style: { marginRight: "8px" } }, tool.icon || "🧰"), tool.title]), tool.desc ? el("p", tool.desc) : null]);
      const host = el("div", {});
      surface.append(head, host);
      try { tool.mount(host, ctx); } catch (e) { host.append(el("div", { class: "ff-note" }, "Erreur outil : " + e.message)); console.error(e); }
      window.scrollTo(0, 0);
    }
    w.addEventListener("hashchange", route);
    route();

    if ("serviceWorker" in navigator) navigator.serviceWorker.register("./ff-sw.js").catch(() => {});
  }

  Object.assign(FF, { el, append, $, $$, clear, store, fmt, round2, save, shareText, copy, cachedFetch, toast, print: printNode, register, boot });
})(window);
