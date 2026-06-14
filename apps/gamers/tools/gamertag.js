/* Gamertag Generator — préfixes/suffixes/leet, styles, favoris, copie. */
FF.register({
  id: "gamertag", title: "Gamertag Generator", icon: "🎮", tag: "Identité",
  desc: "Génère des gamertags depuis un mot-clé et un style. Leet speak, favoris et copie en un clic.",
  mount(root, ctx) {
    const { el, store, copy, toast, clear } = ctx;
    const st = store("gamertag");

    let keyword = st.get("keyword", "");
    let style = st.get("style", "cool");
    let suggestions = st.get("suggestions", []);
    let favs = st.get("favs", []);

    const STYLES = {
      cool:  { label: "Cool" , pfx: ["xX","Xx","_","Dark","Shadow","Neon","Hyper","Alpha","Neo","Ghost","Iron","Cyber","Ultra","Storm","Pro","Epic","Void"],
                sfx: ["xX","Xx","_","GG","YT","TV","HD","OG","_","FPS","99","777","666","420","Pro","Gamer","YT"] },
      drole: { label: "Drôle", pfx: ["BaguetteMaster","Croissant","LeNul","SansZozo","VieuxMonsieur","Flan","Gateau","Sandwich"],
                sfx: ["DesForets","DeLaVie","Du69","Frites","Kebab","Boomer","2000","Noob"] },
      elite: { label: "Élite", pfx: ["EliteX","Ranked","Pro","Top1","Ace","S-Tier","Legend","GM","Radiant","Diamond","Master","Grand"],
                sfx: ["Ranked","Pro","GG","Ace","Elite","Champion","S1","Top1","Legend"] },
      mignon: { label: "Mignon", pfx: ["Bunny","Kitty","Fluffy","Kawaii","Chibi","Mochi","Peach","Cherry","Pixel","Pastel"],
                sfx: ["Chan","Kun","San","Berry","Bloom","Star","Moon","Heart","Pop","Cute"] }
    };

    const LEET = { a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", l: "1", g: "9", b: "8", z: "2" };

    function leet(str) {
      return str.split("").map(c => LEET[c.toLowerCase()] || c).join("");
    }

    function capitalize(str) {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generate() {
      if (!keyword.trim()) { toast("Entre un mot-clé d'abord", "err"); return; }
      const s = STYLES[style];
      const kw = keyword.trim();
      const kwCap = capitalize(kw);
      const kwUP = kw.toUpperCase();
      const kwLeet = leet(kw);

      const results = new Set();

      // Variantes simples
      results.add(kwCap + rand(s.sfx));
      results.add(rand(s.pfx) + kwCap);
      results.add(rand(s.pfx) + kwCap + rand(s.sfx));
      results.add(kwUP + "_" + rand(s.sfx));
      results.add(rand(s.pfx) + "_" + kwUP);

      // Leet speak
      results.add(rand(s.pfx) + leet(kwCap) + rand(s.sfx));
      results.add(kwLeet.toUpperCase() + rand(s.sfx));
      results.add(leet(kwCap + rand(s.sfx)));

      // Avec chiffres
      const nums = ["123", "007", "420", "99", "1337", "777", "360", "4K"];
      results.add(kwCap + rand(nums));
      results.add(rand(s.pfx) + kwCap + rand(nums));
      results.add(kwLeet + rand(nums));

      // Style underscore
      results.add(kwCap + "_" + rand(s.sfx));
      results.add(rand(s.pfx) + "_" + kwCap + "_" + rand(s.sfx));

      // Tirets, concat sans sépar
      results.add(kwCap + rand(s.sfx).toLowerCase());
      results.add((rand(s.pfx) + kwCap).slice(0, 16));

      suggestions = [...results].filter(Boolean).slice(0, 20);
      st.set("suggestions", suggestions);
      st.set("keyword", keyword);
      st.set("style", style);
      render();
    }

    const out = el("div");
    function render() {
      clear(out);
      const styleKeys = Object.keys(STYLES);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Générateur"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Mot-clé"),
                el("input", {
                  class: "ff-input", type: "text", placeholder: "ex: sniper, pixel, loup…",
                  value: keyword,
                  onInput(e) { keyword = e.target.value; },
                  onKeydown(e) { if (e.key === "Enter") generate(); }
                })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Style"),
                el("div", { class: "ff-seg" }, styleKeys.map(k =>
                  el("button", { class: style === k ? "on" : "", onClick() { style = k; st.set("style", k); render(); } }, STYLES[k].label)
                ))
              ])
            ]),
            el("div", { class: "ff-col" }, favs.length ? [
              el("div", { class: "ff-field" }, [
                el("label", "Mes favoris (" + favs.length + ")"),
                el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } }, favs.map(f =>
                  el("span", { class: "ff-chip", style: { cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" } }, [
                    el("span", { onClick() { copy(f); toast("Copié !", "ok"); } }, f),
                    el("span", { style: { cursor: "pointer", color: "var(--pg-err)", fontWeight: "900" }, onClick() { favs = favs.filter(x => x !== f); st.set("favs", favs); render(); } }, "×")
                  ])
                ))
              ])
            ] : null)
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: generate }, "🎲 Générer"),
            suggestions.length ? el("button", { class: "ff-btn ghost", onClick() { suggestions = []; st.set("suggestions", []); render(); } }, "Effacer") : null
          ])
        ]),
        suggestions.length ? el("div", { class: "ff-panel" }, [
          el("h2", "Suggestions (" + suggestions.length + ")"),
          el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" } },
            suggestions.map(tag =>
              el("div", { style: { display: "flex", gap: "4px", alignItems: "center", background: "var(--pg-pale)", border: "2px solid var(--pg-navy)", borderRadius: "10px", padding: "8px 10px" } }, [
                el("span", { style: { flex: 1, fontWeight: "700", color: "var(--pg-navy)", fontFamily: "var(--pg-head)" } }, tag),
                el("button", { class: "ff-btn sm gold", title: "Copier", onClick() { copy(tag); toast("Copié : " + tag, "ok"); } }, "📋"),
                el("button", { class: "ff-btn sm ghost", title: "Ajouter aux favoris", onClick() {
                  if (!favs.includes(tag)) { favs.unshift(tag); favs = favs.slice(0, 30); st.set("favs", favs); toast("Favori ajouté !", "ok"); render(); }
                } }, "⭐")
              ])
            )
          )
        ]) : null
      );
    }
    root.append(out); render();
  }
});
