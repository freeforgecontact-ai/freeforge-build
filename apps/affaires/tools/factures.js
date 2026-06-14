/* Factures Professionnelles — via le moteur de document partagé. */
FF.register(FF.docEngine({
  id: "factures", title: "Facture", icon: "📄", tag: "PME",
  desc: "Factures pro avec lignes, TPS/TVQ, rabais, statut payé — impression PDF.",
  type: "facture", noun: "facture",
  dateLabel: "Date", secondDateLabel: "Échéance",
  statuses: ["impayée", "envoyée", "payée", "en retard"]
}));
