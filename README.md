# Portfolio Lucas Caillat

Portfolio web premium, minimaliste et élégant, reprenant l'identité visuelle de la carte de visite.

## 🚀 Démarrage Rapide

Le projet est configuré avec Next.js 15, Tailwind CSS, Framer Motion et TypeScript.

### 1. Installation

```bash
npm install
```

### 2. Développement Local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🌐 Déploiement sur GitHub Pages

Ce projet est **100% prêt** pour un déploiement sur GitHub Pages via GitHub Actions.

### Étapes de déploiement :
1. Poussez votre code sur la branche `main` d'un repository GitHub.
2. Allez dans les **Settings** de votre repository.
3. Dans la section **Pages** (menu de gauche), sous **Build and deployment**, choisissez **GitHub Actions** comme source.
4. C'est tout ! À chaque `push` sur la branche `main`, l'action GitHub va automatiquement générer l'export statique et le déployer.

*Note : Si vous déployez sur un sous-dossier (ex: `https://pseudo.github.io/mon-repo`), vous devrez décommenter et ajuster l'option `basePath` dans le fichier `next.config.ts`.*

## 🎨 Architecture & Stack

- **Framework**: Next.js (App Router, Export Statique)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (Effet Parallaxe 3D, Reveals)
- **Icônes**: Lucide React
- **Typographie**: Playfair Display (Serif) & Inter (Sans-serif)
- **Dashboard Admin**: Mock UI préparée pour intégration Supabase/Firebase.

## 📁 Structure Principale

- `src/app/page.tsx` : Landing page principale avec l'effet 3D.
- `src/app/admin/page.tsx` : Dashboard admin sécurisé.
- `src/components/Projects.tsx` : Galerie des projets.
- `src/components/Socials.tsx` : Liens réseaux sociaux.
- `.github/workflows/deploy.yml` : Workflow pour le déploiement.
