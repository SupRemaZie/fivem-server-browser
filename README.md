# 🚀 FiveM Server Manager

**FiveM Server Manager** est une application de bureau développée avec **Electron**, **React**, **Vite**, **TailwindCSS** et **SQLite**.  
Elle permet de gérer une liste de serveurs FiveM ainsi qu’un ensemble de joueurs associés.

Ce projet a été réalisé dans le cadre d’un module ElectronJS.

---

## 📦 Fonctionnalités principales

### 🖥️ Gestion des serveurs FiveM
- Ajouter un serveur (nom, IP, port, description)
- Modifier ou supprimer un serveur
- Afficher la liste complète des serveurs
- Stockage persistant en base SQLite

### 👤 Gestion des joueurs
- Ajouter un joueur
- Associer un joueur à un serveur (FK)
- Modifier ou supprimer un joueur
- Affichage des joueurs dans une table dédiée

### 🗄️ Base de données locale (SQLite)
- Table `servers`
- Table `players`
- Initialisation automatique via `schema.sql`

### ⚙️ Technologies
- **Electron** : application desktop
- **React + Vite** : interface rapide et modulaire
- **TailwindCSS** : design moderne et responsive
- **SQLite** : stockage local
- **IPC sécurisé** (preload) pour communiquer entre Electron et React

### 🔍 Qualité & automatisation
- CI GitHub Actions
- Linter HTML (HTMLHint)
- Structure claire et maintenable

---

## 📁 Structure du projet

fivem-server-manager/
├─ electron/
│ ├─ main.js # Processus principal Electron
│ ├─ preload.js # Bridge sécurisé
│ ├─ db.js # Connexion SQLite
│ └─ schema.sql # Définition des tables
├─ renderer/ # Front React (Vite + Tailwind)
│ ├─ index.html
│ ├─ src/
│ │ ├─ App.jsx
│ │ ├─ main.jsx
│ │ └─ index.css
│ ├─ tailwind.config.js
│ ├─ postcss.config.js
│ ├─ package.json
│ └─ vite.config.js
├─ .github/workflows/
│ └─ ci.yml # Workflow CI
├─ .htmlhintrc # Configuration HTMLHint
├─ package.json # Scripts globaux
└─ README.md

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone https://github.com/TON-UTILISATEUR/fivem-server-manager.git
cd fivem-server-manager


