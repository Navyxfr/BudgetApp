export const FR_MONTHS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre"
];

export const monthKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const parseMonthKey = k => {
  const [y, m] = String(k || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
};

export const monthLabel = k => {
  const d = parseMonthKey(k);
  return `${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const addMonths = (k, n) => {
  const d = parseMonthKey(k);
  d.setMonth(d.getMonth() + Number(n || 0));
  return monthKey(d);
};

export const nowKey = () => monthKey(new Date());

export const canNav = (targetKey, maxForwardMonths = 1) =>
  targetKey <= addMonths(nowKey(), maxForwardMonths);

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const yearFromMonthKey = k => parseMonthKey(k).getFullYear();

