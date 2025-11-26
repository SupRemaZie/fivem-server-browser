# 🚀 FiveM Server Manager

**FiveM Server Manager** est une application de bureau développée avec **Electron**, **React**, **TypeScript**, **Vite**, **TailwindCSS** et **SQLite**.  
Elle permet de gérer une liste de serveurs FiveM, leurs joueurs, ressources et bien plus encore.

Ce projet a été réalisé dans le cadre d'un module ElectronJS.

---

## 📦 Fonctionnalités principales

### 🖥️ Gestion des serveurs FiveM
- **Ajouter un serveur** manuellement (nom, IP, port, description)
- **Importer depuis CFX** : récupération automatique des informations via le code CFX du serveur
- **Modifier ou supprimer** un serveur
- **Rafraîchir** : mise à jour automatique de tous les serveurs depuis l'API CFX
- **Vérification du statut** : détection automatique si un serveur est en ligne ou hors ligne
- **Affichage complet** : liste des serveurs avec statut, nombre de joueurs, ressources, etc.
- **Stockage persistant** en base SQLite

### 👤 Gestion des joueurs
- **Voir les joueurs** associés à un serveur
- **Modifier ou supprimer** un joueur
- **Gestion des bans** : bannir/débannir des joueurs
- **Gestion de la whitelist** : ajouter/retirer des joueurs de la whitelist
- **Affichage par serveur** : liste des joueurs filtrée par serveur
- **Statuts visuels** : indicateurs visuels pour les joueurs bannis et whitelistés

### 📦 Gestion des ressources
- **Affichage des ressources** : liste complète des ressources d'un serveur
- **Synchronisation automatique** : les ressources sont récupérées depuis l'API CFX
- **Mise à jour** : les ressources sont automatiquement mises à jour lors du rafraîchissement

### 🗄️ Base de données locale (SQLite)
- **Table `servers`** : stockage des informations des serveurs
  - Informations de base (nom, IP, port, description)
  - Informations CFX (code CFX, bannière, propriétaire, tags, etc.)
  - Statut en ligne/hors ligne
  - Nombre de joueurs (actuels/maximum)
- **Table `players`** : gestion des joueurs
  - Association avec un serveur (clé étrangère)
  - Statut de ban et whitelist
- **Table `resources`** : liste des ressources par serveur
  - Nom de la ressource
  - Association avec un serveur (clé étrangère)
- **Initialisation automatique** : création des tables au premier lancement
- **Migrations automatiques** : ajout des nouvelles colonnes si nécessaire

### ⚙️ Technologies
- **Electron** : application desktop multiplateforme
- **React + TypeScript** : interface moderne et type-safe
- **Vite** : build rapide et développement fluide
- **TailwindCSS** : design moderne et responsive
- **SQLite (better-sqlite3)** : stockage local performant
- **IPC sécurisé** (preload) : communication sécurisée entre Electron et React

### 🔍 Qualité & automatisation
- **TypeScript** : typage strict pour une meilleure maintenabilité
- **ESLint** : vérification de la qualité du code
- **Structure modulaire** : code organisé et maintenable

---

## 📁 Structure du projet

```
fivem-server-browser/
├── fivem-manager/
│   ├── src/
│   │   ├── main/              # Processus principal Electron
│   │   │   ├── index.ts        # Point d'entrée et handlers IPC
│   │   │   ├── db.ts           # Gestion de la base de données SQLite
│   │   │   └── schema.sql      # Schéma de la base de données
│   │   ├── preload/            # Bridge sécurisé IPC
│   │   │   ├── index.ts        # Exposition des APIs
│   │   │   └── index.d.ts       # Définitions TypeScript
│   │   └── renderer/           # Frontend React
│   │       ├── index.html
│   │       └── src/
│   │           ├── App.tsx     # Composant principal
│   │           ├── main.tsx    # Point d'entrée React
│   │           ├── types.ts    # Définitions TypeScript
│   │           └── components/
│   │               ├── ServerList.tsx
│   │               ├── ServerForm.tsx
│   │               ├── ServerManagement.tsx
│   │               ├── PlayerList.tsx
│   │               └── PlayerForm.tsx
│   ├── resources/              # Ressources (icônes, etc.)
│   ├── scripts/                # Scripts utilitaires
│   ├── package.json
│   ├── electron.vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 🛠️ Installation

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE-UTILISATEUR/fivem-server-browser.git
cd fivem-server-browser/fivem-manager
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer l'application en mode développement

```bash
npm run dev
```

### 4. Builder l'application

```bash
# Build pour toutes les plateformes
npm run build

# Build pour une plateforme spécifique
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 🚀 Utilisation

### Ajouter un serveur

1. Cliquez sur le bouton **"+ Ajouter"**
2. **Option 1** : Remplissez manuellement les informations (nom, IP, port, description)
3. **Option 2** : Utilisez le code CFX pour importer automatiquement toutes les informations
   - Entrez le code CFX du serveur (visible dans l'URL FiveM)
   - Cliquez sur **"Récupérer"**
   - Les informations seront automatiquement remplies (nom, IP, port, description, joueurs, ressources, etc.)

### Gérer un serveur

1. Cliquez sur **"Gérer"** à côté d'un serveur
2. Accédez aux différents onglets :
   - **👥 Joueurs** : voir et gérer les joueurs (bannir, débannir, whitelist)
   - **📦 Ressources** : voir la liste complète des ressources
   - **🚫 Bans** : voir uniquement les joueurs bannis

### Rafraîchir les serveurs

1. Cliquez sur le bouton **"🔄 Rafraîchir"**
2. Tous les serveurs avec un code CFX seront mis à jour depuis l'API FiveM
3. Les informations (joueurs, ressources, statut) seront synchronisées

### Gérer les joueurs

- **Bannir un joueur** : Cliquez sur "Bannir" dans la liste des joueurs
- **Débannir un joueur** : Cliquez sur "Débannir" dans la liste des joueurs bannis
- **Whitelist** : Les joueurs peuvent être ajoutés à la whitelist (géré automatiquement lors de l'import CFX)

---

## 🔧 Configuration

### Base de données

La base de données SQLite est automatiquement créée dans le dossier de données utilisateur :
- **Linux** : `~/.config/fivem-manager/fivem-manager.db`
- **Windows** : `%APPDATA%/fivem-manager/fivem-manager.db`
- **macOS** : `~/Library/Application Support/fivem-manager/fivem-manager.db`

### Scripts disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Builder l'application
npm run typecheck    # Vérifier les types TypeScript
npm run lint         # Vérifier le code avec ESLint
npm run format       # Formater le code avec Prettier
```

---

## 📝 Notes

- Les serveurs doivent avoir un **code CFX** pour utiliser la fonctionnalité de rafraîchissement automatique
- Les **ressources** sont automatiquement synchronisées lors de l'import depuis CFX
- Les **joueurs** sont automatiquement importés depuis l'API CFX si disponibles
- Le **statut en ligne/hors ligne** est vérifié automatiquement

---


## 📄 Licence

Ce projet est réalisé dans le cadre d'un module académique.

---

## 👨‍💻 Auteur

Développé dans le cadre d'un module ElectronJS.
