/* World Time Buddy — horloges live multi-villes, fuseaux IANA, heure d'été auto. */
FF.register({
  id: "world-time", title: "World Time Buddy", icon: "🕐", tag: "Fuseaux",
  desc: "Horloges en direct pour plusieurs villes. Heure d'été automatique via Intl.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("world-time");

    const FUSEAUX = [
      ["America/Toronto", "Toronto"],
      ["America/Montreal", "Montréal"],
      ["America/New_York", "New York"],
      ["America/Chicago", "Chicago"],
      ["America/Denver", "Denver"],
      ["America/Los_Angeles", "Los Angeles"],
      ["America/Vancouver", "Vancouver"],
      ["America/Anchorage", "Anchorage"],
      ["America/Honolulu", "Honolulu"],
      ["America/Mexico_City", "Mexico City"],
      ["America/Sao_Paulo", "São Paulo"],
      ["America/Buenos_Aires", "Buenos Aires"],
      ["America/Bogota", "Bogotá"],
      ["America/Lima", "Lima"],
      ["America/Santiago", "Santiago"],
      ["America/Caracas", "Caracas"],
      ["Europe/London", "Londres"],
      ["Europe/Paris", "Paris"],
      ["Europe/Berlin", "Berlin"],
      ["Europe/Madrid", "Madrid"],
      ["Europe/Rome", "Rome"],
      ["Europe/Amsterdam", "Amsterdam"],
      ["Europe/Brussels", "Bruxelles"],
      ["Europe/Zurich", "Zurich"],
      ["Europe/Stockholm", "Stockholm"],
      ["Europe/Oslo", "Oslo"],
      ["Europe/Copenhagen", "Copenhague"],
      ["Europe/Helsinki", "Helsinki"],
      ["Europe/Warsaw", "Varsovie"],
      ["Europe/Prague", "Prague"],
      ["Europe/Vienna", "Vienne"],
      ["Europe/Lisbon", "Lisbonne"],
      ["Europe/Athens", "Athènes"],
      ["Europe/Budapest", "Budapest"],
      ["Europe/Bucharest", "Bucarest"],
      ["Europe/Kiev", "Kyiv"],
      ["Europe/Moscow", "Moscou"],
      ["Europe/Istanbul", "Istanbul"],
      ["Asia/Dubai", "Dubaï"],
      ["Asia/Kolkata", "Mumbai / New Delhi"],
      ["Asia/Dhaka", "Dhaka"],
      ["Asia/Bangkok", "Bangkok"],
      ["Asia/Singapore", "Singapour"],
      ["Asia/Kuala_Lumpur", "Kuala Lumpur"],
      ["Asia/Hong_Kong", "Hong Kong"],
      ["Asia/Shanghai", "Shanghai"],
      ["Asia/Seoul", "Séoul"],
      ["Asia/Tokyo", "Tokyo"],
      ["Asia/Jakarta", "Jakarta"],
      ["Asia/Manila", "Manille"],
      ["Asia/Taipei", "Taipei"],
      ["Asia/Karachi", "Karachi"],
      ["Asia/Tashkent", "Tachkent"],
      ["Asia/Riyadh", "Riyad"],
      ["Asia/Tehran", "Téhéran"],
      ["Asia/Beirut", "Beyrouth"],
      ["Asia/Jerusalem", "Jérusalem"],
      ["Africa/Cairo", "Le Caire"],
      ["Africa/Johannesburg", "Johannesburg"],
      ["Africa/Lagos", "Lagos"],
      ["Africa/Nairobi", "Nairobi"],
      ["Africa/Casablanca", "Casablanca"],
      ["Africa/Tunis", "Tunis"],
      ["Pacific/Auckland", "Auckland"],
      ["Pacific/Sydney", "Sydney"],
      ["Pacific/Fiji", "Fidji"],
      ["Australia/Adelaide", "Adélaïde"],
      ["Australia/Perth", "Perth"]
    ];

    let villes = st.get("villes", [
      { tz: "America/Montreal", nom: "Montréal" },
      { tz: "Europe/Paris", nom: "Paris" },
      { tz: "Asia/Tokyo", nom: "Tokyo" },
      { tz: "America/New_York", nom: "New York" }
    ]);

    function persist() { st.set("villes", villes); }

    let tickInterval = null;
    const clockEls = {};
    const out = el("div");

    function formatHeure(tz) {
      try {
        return new Intl.DateTimeFormat("fr-CA", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
        }).format(new Date());
      } catch (e) { return "--:--:--"; }
    }

    function formatDate(tz) {
      try {
        return new Intl.DateTimeFormat("fr-CA", {
          timeZone: tz, weekday: "long", day: "numeric", month: "long"
        }).format(new Date());
      } catch (e) { return ""; }
    }

    function getDecalage(tz) {
      try {
        const now = new Date();
        const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        const localDate = new Date(now.toLocaleString("en-US", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        const diffH = (tzDate - localDate) / 3600000;
        const diffHStr = diffH >= 0 ? "+" + diffH : String(diffH);
        return diffH === 0 ? "Heure locale" : diffHStr + " h vs maintenant";
      } catch (e) { return ""; }
    }

    function estJour(tz) {
      try {
        const h = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()), 10);
        return h >= 7 && h < 20;
      } catch (e) { return true; }
    }

    function tick() {
      villes.forEach(function(v, i) {
        var card = clockEls[i];
        if (card) {
          var heureEl = card.querySelector(".wt-heure");
          if (heureEl) heureEl.textContent = formatHeure(v.tz);
        }
      });
    }

    function render() {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      ctx.clear(out);
      Object.keys(clockEls).forEach(function(k) { delete clockEls[k]; });

      var addPanel = el("div", { class: "ff-panel" }, [
        el("h2", "Ajouter une ville"),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("select", { class: "ff-select", id: "wt-tz-sel" },
              FUSEAUX.map(function(f) { return el("option", { value: f[0] }, f[1] + " (" + f[0] + ")"); })
            )
          ]),
          el("div", { class: "ff-col", style: { flex: "0 0 auto" } }, [
            el("button", { class: "ff-btn primary", onClick: function() {
              var sel = root.querySelector("#wt-tz-sel");
              if (!sel) return;
              var tz = sel.value;
              var found = FUSEAUX.find(function(f) { return f[0] === tz; });
              var nom = found ? found[1] : tz;
              if (villes.find(function(v) { return v.tz === tz; })) { toast("Cette ville est déjà dans la liste", "err"); return; }
              villes.push({ tz: tz, nom: nom });
              persist();
              render();
              toast(nom + " ajouté", "ok");
            } }, "＋ Ajouter")
          ])
        ])
      ]);

      var horloges = el("div", { class: "ff-row" });

      villes.forEach(function(v, i) {
        var jour = estJour(v.tz);
        var decalage = getDecalage(v.tz);
        var bgColor = jour ? "var(--pg-pale)" : "var(--pg-navy)";
        var textColor = jour ? "var(--pg-navy)" : "#fff";

        var card = el("div", { class: "ff-col", style: { flex: "1 1 220px" } }, [
          el("div", { style: { background: bgColor, border: "3px solid var(--pg-navy)", borderRadius: "var(--pg-r)", padding: "18px", boxShadow: "4px 5px 0 var(--pg-shadow)", textAlign: "center" } }, [
            el("div", { style: { fontSize: "2rem", marginBottom: "4px" } }, jour ? "☀️" : "🌙"),
            el("div", { style: { fontFamily: "var(--pg-head)", fontWeight: 700, fontSize: "1.1rem", color: textColor, marginBottom: "2px" } }, v.nom),
            el("div", { style: { fontSize: ".78rem", color: jour ? "var(--pg-mut)" : "var(--pg-sky2)", marginBottom: "8px" } }, v.tz),
            el("div", { class: "wt-heure", style: { fontFamily: "monospace", fontSize: "2.2rem", fontWeight: 700, color: jour ? "var(--pg-blue)" : "var(--pg-yel)", letterSpacing: "2px" } }, formatHeure(v.tz)),
            el("div", { style: { fontSize: ".82rem", color: jour ? "var(--pg-mut)" : "var(--pg-sky2)", marginTop: "4px" } }, formatDate(v.tz)),
            el("span", { class: "ff-chip", style: { marginTop: "8px" } }, decalage),
            (function(idx) {
              return el("button", { class: "ff-btn sm ghost", style: { marginTop: "10px" }, onClick: function() {
                villes.splice(idx, 1);
                persist();
                render();
              } }, "✕ Retirer");
            })(i)
          ])
        ]);

        clockEls[i] = card;
        horloges.append(card);
      });

      if (villes.length === 0) {
        horloges.append(el("div", { class: "ff-empty" }, "Aucune ville ajoutée. Utilisez le panneau ci-dessus."));
      }

      out.append(addPanel, horloges);
      tickInterval = setInterval(tick, 1000);
    }

    window.addEventListener("hashchange", function stopTick() {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      window.removeEventListener("hashchange", stopTick);
    });

    root.append(out);
    render();
  }
});
