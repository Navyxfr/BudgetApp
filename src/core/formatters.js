export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const eur = value => {
  if (value == null || Number.isNaN(value)) return "0,00 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(value);
};

export const pct = n => `${Math.round(clamp(n, 0, 999))}%`;
