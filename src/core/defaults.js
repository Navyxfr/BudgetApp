const DEFAULT_CATEGORY_COLORS = [
  "#C8956C",
  "#5B9A6F",
  "#C89040",
  "#C45B52",
  "#8B7BB5",
  "#D4837A",
  "#6B8EB5",
  "#B5A36B",
  "#7BB5A8",
  "#B57BB0",
  "#7BAD5B",
  "#B56B6B"
];

const defaultUid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function defaultCats(uidFn = defaultUid, colors = DEFAULT_CATEGORY_COLORS) {
  return [
    { id: uidFn(), name: "Courses", icon: "ShoppingCart", color: colors[0], o: 0 },
    { id: uidFn(), name: "Carburant", icon: "Car", color: colors[1], o: 1 },
    { id: uidFn(), name: "Bebe", icon: "Baby", color: colors[2], o: 2 },
    { id: uidFn(), name: "Animaux", icon: "Dog", color: colors[3], o: 3 },
    { id: uidFn(), name: "Sante", icon: "Heart", color: colors[4], o: 4 },
    { id: uidFn(), name: "Loisirs", icon: "Gamepad2", color: colors[5], o: 5 },
    { id: uidFn(), name: "Restaurants", icon: "Utensils", color: colors[6], o: 6 },
    { id: uidFn(), name: "Transports", icon: "Car", color: colors[7], o: 7 }
  ];
}

export function defaultState(persons, cats, options = {}) {
  const uidFn = options.uidFn || defaultUid;
  const colors = options.colors || DEFAULT_CATEGORY_COLORS;
  const categories = cats || defaultCats(uidFn, colors);
  return {
    cfg: { dark: "auto", persons, categories, onb: true },
    loans: [],
    savings: [],
    investments: [],
    months: {}
  };
}

export { DEFAULT_CATEGORY_COLORS };
