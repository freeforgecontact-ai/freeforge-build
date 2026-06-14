/* Tournament Bracket Drawer — simple & double élimination, 4/8/16 joueurs, persistance. */
FF.register({
  id: "bracket", title: "Tournament Bracket Drawer", icon: "🏆", tag: "Tournoi",
  desc: "Crée un arbre de tournoi (4/8/16 joueurs), simple ou double élimination. Avance les gagnants au clic.",
  mount(root, ctx) {
    const { el, store, save, toast, clear } = ctx;
    const st = store("bracket");

    let size = st.get("size", 8);
    let mode = st.get("mode", "single");
    let players = st.get("players", Array.from({ length: 8 }, (_, i) => "Joueur " + (i + 1)));
    let matches = st.get("matches", null);
    let loserMatches = st.get("loserMatches", null);
    let grandFinal = st.get("grandFinal", null);

    function persist() {
      st.set("size", size); st.set("mode", mode);
      st.set("players", players); st.set("matches", matches);
      st.set("loserMatches", loserMatches); st.set("grandFinal", grandFinal);
    }

    // Initialise bracket
    function initBracket() {
      const n = size;
      // Rounds winners bracket
      const rounds = Math.log2(n);
      const m = [];
      // R1
      const r1 = [];
      for (let i = 0; i < n / 2; i++) {
        r1.push({ id: "W_0_" + i, p1: players[i * 2] || null, p2: players[i * 2 + 1] || null, winner: null, round: 0, pos: i });
      }
      m.push(r1);
      // Rounds suivants
      for (let r = 1; r < rounds; r++) {
        const prev = m[r - 1];
        const rnd = [];
        for (let i = 0; i < prev.length / 2; i++) {
          rnd.push({ id: "W_" + r + "_" + i, p1: null, p2: null, winner: null, round: r, pos: i });
        }
        m.push(rnd);
      }
      matches = m;

      if (mode === "double") {
        // Perdants bracket : autant de rounds que W - 1
        const lb = [];
        for (let r = 0; r < (rounds - 1) * 2; r++) {
          const cnt = Math.max(1, Math.floor(n / Math.pow(2, Math.floor(r / 2) + 2)));
          const rnd = [];
          for (let i = 0; i < cnt; i++) {
            rnd.push({ id: "L_" + r + "_" + i, p1: null, p2: null, winner: null, round: r, pos: i });
          }
          if (rnd.length) lb.push(rnd);
        }
        loserMatches = lb;
        grandFinal = { id: "GF", p1: null, p2: null, winner: null };
      } else {
        loserMatches = null;
        grandFinal = null;
      }
      persist();
    }

    function setWinner(isLoser, roundIdx, matchIdx, player) {
      const arr = isLoser ? loserMatches : matches;
      if (!arr || !arr[roundIdx] || !arr[roundIdx][matchIdx]) return;
      const match = arr[roundIdx][matchIdx];
      if (!player || (!match.p1 && !match.p2)) return;
      match.winner = player;

      // Propagation WB
      if (!isLoser) {
        const nextRound = roundIdx + 1;
        if (matches[nextRound]) {
          const nextMatch = matches[nextRound][Math.floor(matchIdx / 2)];
          if (nextMatch) {
            if (matchIdx % 2 === 0) nextMatch.p1 = player;
            else nextMatch.p2 = player;
          }
        }
        // Double élim : perdant va dans LB
        if (mode === "double" && loserMatches) {
          const loser = player === match.p1 ? match.p2 : match.p1;
          // R1 du LB reçoit les perdants du WB R1
          if (roundIdx === 0 && loserMatches[0]) {
            loserMatches[0][matchIdx] = loserMatches[0][matchIdx] || { id: "L_0_" + matchIdx, p1: null, p2: null, winner: null };
            if (!loserMatches[0][matchIdx].p1) loserMatches[0][matchIdx].p1 = loser;
            else loserMatches[0][matchIdx].p2 = loser;
          }
        }
        // Finale simple ou grand final double
        const finalRound = matches[matches.length - 1];
        if (finalRound && finalRound.length === 1 && finalRound[0].winner) {
          toast("Gagnant : " + finalRound[0].winner + " 🏆", "ok");
        }
      }

      // LB propagation
      if (isLoser && loserMatches) {
        const nextLB = roundIdx + 1;
        if (loserMatches[nextLB]) {
          const nm = loserMatches[nextLB][Math.floor(matchIdx / 2)];
          if (nm) {
            if (matchIdx % 2 === 0) nm.p1 = player;
            else nm.p2 = player;
          }
        } else if (grandFinal) {
          grandFinal.p2 = player;
        }
      }

      persist(); render();
    }

    function setGrandFinalWinner(player) {
      if (!grandFinal || !player) return;
      grandFinal.winner = player;
      persist(); render();
      toast("Champion du tournoi : " + player + " 🏆", "ok");
    }

    function renderMatch(match, isLoser, roundIdx, matchIdx) {
      const done = !!match.winner;
      function slot(player, side) {
        const isWinner = done && match.winner === player;
        const isLoserSlot = done && match.winner !== player;
        return el("div", {
          style: {
            display: "flex", alignItems: "center", gap: "6px", padding: "5px 8px",
            background: isWinner ? "#ffd23f" : isLoserSlot ? "#fee2e2" : "var(--pg-pale)",
            borderRadius: "6px", border: "2px solid " + (isWinner ? "#f59e0b" : "var(--pg-navy)"),
            cursor: player && !done ? "pointer" : "default",
            fontWeight: isWinner ? "900" : "600",
            color: isWinner ? "var(--pg-navy)" : "var(--pg-ink)",
            fontSize: "0.85rem",
            minWidth: "120px"
          },
          onClick: player && !done ? () => setWinner(isLoser, roundIdx, matchIdx, player) : null
        }, [
          el("span", { style: { flex: 1 } }, player || el("span", { style: { color: "var(--pg-mut)", fontStyle: "italic" } }, "TBD")),
          isWinner ? el("span", "🏆") : null
        ]);
      }
      return el("div", {
        style: {
          display: "flex", flexDirection: "column", gap: "3px",
          border: "2px solid var(--pg-navy)", borderRadius: "10px",
          padding: "6px", background: "#fff",
          boxShadow: "2px 2px 0 var(--pg-navy)", minWidth: "140px"
        }
      }, [slot(match.p1, 1), el("div", { style: { height: "1px", background: "var(--pg-sky2)" } }), slot(match.p2, 2)]);
    }

    function renderRound(round, roundIdx, isLoser) {
      return el("div", { style: { display: "flex", flexDirection: "column", gap: "12px", justifyContent: "space-around", minWidth: "160px" } }, [
        el("div", { style: { fontSize: ".75rem", fontWeight: "900", color: "var(--pg-mut)", textAlign: "center", marginBottom: "4px" } },
          (isLoser ? "LB R" : "R") + (roundIdx + 1)
        ),
        ...round.map((m, mi) => renderMatch(m, isLoser, roundIdx, mi))
      ]);
    }

    const out = el("div");
    function render() {
      clear(out);

      // Édition noms joueurs
      const playerInputs = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "6px", marginBottom: "10px" } },
        Array.from({ length: size }, (_, i) =>
          el("input", {
            class: "ff-input", type: "text", value: players[i] || "Joueur " + (i + 1),
            placeholder: "Joueur " + (i + 1), style: { fontSize: "0.9rem" },
            onInput(e) { players[i] = e.target.value; }
          })
        )
      );

      const finalMatch = matches && matches[matches.length - 1] && matches[matches.length - 1][0];
      const champion = finalMatch ? finalMatch.winner : null;

      out.append(
        champion ? el("div", { class: "ff-result", style: { marginBottom: "16px" } }, [
          el("div", { class: "lbl" }, "Champion du tournoi"),
          el("div", { class: "big" }, "🏆 " + champion)
        ]) : null,

        el("div", { class: "ff-panel" }, [
          el("h2", "Paramètres"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Taille"),
                el("div", { class: "ff-seg" }, [4, 8, 16].map(n =>
                  el("button", { class: size === n ? "on" : "", onClick() { size = n; players = Array.from({ length: n }, (_, i) => players[i] || "Joueur " + (i + 1)); persist(); render(); } }, n + " joueurs")
                ))
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Type"),
                el("div", { class: "ff-seg" }, [
                  el("button", { class: mode === "single" ? "on" : "", onClick() { mode = "single"; persist(); render(); } }, "Élimination simple"),
                  el("button", { class: mode === "double" ? "on" : "", onClick() { mode = "double"; persist(); render(); } }, "Élimination double")
                ])
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Noms des joueurs"),
                playerInputs
              ])
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick() {
              players = Array.from({ length: size }, (_, i) => {
                const inp = playerInputs.querySelectorAll("input")[i];
                return inp ? inp.value || "Joueur " + (i + 1) : "Joueur " + (i + 1);
              });
              initBracket(); render();
            } }, "🔄 Générer / Réinitialiser"),
            matches ? el("button", { class: "ff-btn ghost", onClick() { matches = null; loserMatches = null; grandFinal = null; persist(); render(); } }, "Effacer") : null
          ])
        ]),

        matches ? el("div", { class: "ff-panel" }, [
          el("h2", "Bracket — Winners" + (mode === "double" ? " (WB)" : "")),
          el("div", { class: "ff-note" }, "Clique sur un joueur pour le déclarer gagnant du match."),
          el("div", { style: { overflowX: "auto" } }, [
            el("div", { style: { display: "flex", gap: "32px", padding: "8px 4px", alignItems: "flex-start", minWidth: "max-content" } },
              matches.map((round, ri) => renderRound(round, ri, false))
            )
          ])
        ]) : null,

        matches && mode === "double" && loserMatches && loserMatches.length ? el("div", { class: "ff-panel" }, [
          el("h2", "Losers Bracket (LB)"),
          el("div", { style: { overflowX: "auto" } }, [
            el("div", { style: { display: "flex", gap: "32px", padding: "8px 4px", alignItems: "flex-start", minWidth: "max-content" } },
              loserMatches.map((round, ri) => renderRound(round, ri, true))
            )
          ])
        ]) : null,

        matches && mode === "double" && grandFinal ? el("div", { class: "ff-panel" }, [
          el("h2", "Grande Finale"),
          el("div", { style: { display: "flex", justifyContent: "center", padding: "16px" } }, [
            el("div", {
              style: {
                display: "flex", flexDirection: "column", gap: "3px",
                border: "3px solid #f59e0b", borderRadius: "14px",
                padding: "10px", background: "#fff",
                boxShadow: "4px 4px 0 var(--pg-navy)", minWidth: "160px"
              }
            }, [
              el("div", { style: { fontSize: ".7rem", fontWeight: "900", color: "var(--pg-mut)", textAlign: "center", marginBottom: "4px" } }, "GRANDE FINALE"),
              ...[grandFinal.p1, grandFinal.p2].map((player, si) => {
                const isW = grandFinal.winner === player;
                return el("div", {
                  style: {
                    padding: "6px 10px", background: isW ? "#ffd23f" : "var(--pg-pale)",
                    borderRadius: "6px", border: "2px solid " + (isW ? "#f59e0b" : "var(--pg-navy)"),
                    cursor: player && !grandFinal.winner ? "pointer" : "default",
                    fontWeight: isW ? "900" : "600", marginBottom: si === 0 ? "3px" : 0
                  },
                  onClick: player && !grandFinal.winner ? () => setGrandFinalWinner(player) : null
                }, player || el("span", { style: { color: "var(--pg-mut)", fontStyle: "italic" } }, "TBD"));
              }),
              grandFinal.winner ? el("div", { style: { textAlign: "center", marginTop: "6px", fontWeight: "900", color: "var(--pg-ok)" } }, "🏆 " + grandFinal.winner) : null
            ])
          ])
        ]) : null
      );
    }

    root.append(out);
    if (!matches) initBracket();
    render();
  }
});
