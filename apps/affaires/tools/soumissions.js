/* Créateur de Soumissions (devis) — moteur partagé, convertible en facture. */
FF.register(FF.docEngine({
  id: "soumissions", title: "Soumission", icon: "📝", tag: "Devis",
  desc: "Devis pro convertibles en facture en un clic — TPS/TVQ, validité, PDF.",
  type: "devis", noun: "soumission",
  dateLabel: "Date", secondDateLabel: "Valide jusqu’au",
  statuses: ["brouillon", "envoyée", "acceptée", "refusée"]
}));
