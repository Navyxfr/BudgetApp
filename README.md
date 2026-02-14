# Budget Planner

PWA de gestion de budget familial multi-foyers.

## Déployer sur Vercel (gratuit, 24/24)

### 1. Préparer

```bash
git init
git add .
git commit -m "init"
```

### 2. Push sur GitHub

```bash
# Créer un repo sur github.com (privé recommandé)
git remote add origin https://github.com/TON_USER/budget-planner.git
git branch -M main
git push -u origin main
```

### 3. Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) → Sign up avec GitHub
2. "Import Project" → sélectionner `budget-planner`
3. Framework: **Vite** (auto-détecté)
4. Cliquer **Deploy**
5. URL live en ~60 secondes

### 4. Installer sur mobile

- **iPhone** : Safari → ouvrir l'URL → Partager → "Sur l'écran d'accueil"
- **Android** : Chrome → ouvrir l'URL → menu ⋮ → "Ajouter à l'écran d'accueil"

## Dev local

```bash
npm install
npm run dev
```

## Stack

- React 18 + Vite
- Recharts (graphiques)
- Lucide React (icônes)
- PWA via vite-plugin-pwa
- localStorage (données locales, pas de serveur)
