# 🚀 Fivage - FiveM Server Manager

Application de bureau développée avec **Electron**, **React**, **TypeScript** et **SQLite** pour gérer vos serveurs FiveM, leurs joueurs et ressources.

---

## ✨ Fonctionnalités

### 🖥️ Gestion des serveurs
- **Ajout de serveurs** : manuel ou via code CFX pour import automatique
- **Modification et suppression** de serveurs
- **Rafraîchissement automatique** depuis l'API CFX
- **Vérification du statut** en ligne/hors ligne
- **Stockage persistant** en base SQLite

### 👤 Gestion des joueurs
- **Liste des joueurs** par serveur
- **Gestion des bans** : bannir/débannir
- **Gestion de la whitelist** : ajouter/retirer
- **Import automatique** depuis l'API CFX

### 📦 Gestion des ressources
- **Affichage des ressources** par serveur
- **Synchronisation automatique** depuis l'API CFX
- **Mise à jour** lors du rafraîchissement

---

## 🛠️ Technologies

- **Electron** - Application desktop multiplateforme
- **React + TypeScript** - Interface moderne et type-safe
- **Vite** - Build rapide et développement fluide
- **TailwindCSS** - Design moderne et responsive
- **SQLite (better-sqlite3)** - Stockage local performant

---

## 📦 Installation

### Prérequis
- **Node.js** 20 ou supérieur
- **npm**

### Étapes

1. **Cloner le projet**
```bash
git clone https://github.com/SupRemaZie/fivem-server-browser.git
cd fivem-server-browser/fivem-manager
```

2. **Installer les dépendances**
```bash
npm install --legacy-peer-deps
```

3. **Lancer en mode développement**
```bash
npm run dev
```

4. **Builder l'application**
```bash
npm run build
npm run build:linux  # Build pour Linux (AppImage)
```

---

## 🚀 Utilisation

### Ajouter un serveur

1. Cliquez sur **"+ Ajouter"**
2. **Option 1** : Remplissez manuellement les informations
3. **Option 2** : Utilisez le code CFX
   - Entrez le code CFX du serveur
   - Cliquez sur **"Récupérer"**
   - Les informations seront automatiquement remplies

### Gérer un serveur

1. Cliquez sur **"Gérer"** à côté d'un serveur
2. Accédez aux onglets :
   - **👥 Joueurs** : voir et gérer les joueurs
   - **📦 Ressources** : voir la liste des ressources
   - **🚫 Bans** : voir les joueurs bannis

### Rafraîchir les serveurs

1. Cliquez sur **"🔄 Rafraîchir"**
2. Tous les serveurs avec un code CFX seront mis à jour depuis l'API FiveM

---

## 📁 Structure du projet

```
fivem-server-browser/
├── fivem-manager/
│   ├── src/
│   │   ├── main/              # Processus principal Electron
│   │   │   ├── index.ts        # Point d'entrée
│   │   │   ├── db.ts           # Gestion SQLite
│   │   │   └── handlers/       # Handlers IPC
│   │   ├── preload/            # Bridge sécurisé IPC
│   │   └── renderer/           # Frontend React
│   │       └── src/
│   │           ├── components/ # Composants React
│   │           └── context/   # Contextes (Auth, Theme)
│   ├── resources/              # Ressources (icônes)
│   └── package.json
└── README.md
```

---

## 🔧 Scripts disponibles

```bash
npm run dev          # Mode développement
npm run build        # Build de l'application
npm run build:linux # Build AppImage pour Linux
npm run typecheck    # Vérification TypeScript
npm run lint         # Vérification ESLint
npm run test         # Tests unitaires
```

---

## 🗄️ Base de données

La base de données SQLite est automatiquement créée dans :
- **Linux** : `~/.config/fivem-manager/fivem-manager.db`
- **Windows** : `%APPDATA%/fivem-manager/fivem-manager.db`
- **macOS** : `~/Library/Application Support/fivem-manager/fivem-manager.db`

### Tables
- **servers** : Informations des serveurs
- **players** : Joueurs associés aux serveurs
- **resources** : Ressources par serveur

---

## 🔄 CI/CD

Le projet utilise GitHub Actions pour :
- **CI** : Lint, typecheck et tests sur chaque push
- **Build & Release** : Build automatique et release sur tag `v*`

---

## 📝 Notes

- Les serveurs doivent avoir un **code CFX** pour le rafraîchissement automatique
- Les **ressources** et **joueurs** sont synchronisés depuis l'API CFX
- Le **statut en ligne/hors ligne** est vérifié automatiquement

---

## 📄 Licence

MIT

---

## 👨‍💻 Auteur

Développé par **@SupRemaZie** dans le cadre d'un module ElectronJS.
