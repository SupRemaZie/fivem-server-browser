# 📊 Schéma de la Base de Données

## Vue d'ensemble

La base de données utilise **SQLite** et contient 3 tables principales pour gérer les serveurs FiveM, leurs joueurs et leurs ressources.

---

## 🗄️ Diagramme des relations

```
┌─────────────────────────────────────────────────────────┐
│                      SERVERS                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ id (PK, INTEGER, AUTOINCREMENT)                    │  │
│  │ name (TEXT, NOT NULL)                              │  │
│  │ ip (TEXT, NOT NULL)                                │  │
│  │ port (INTEGER, NOT NULL)                           │  │
│  │ description (TEXT)                                 │  │
│  │ is_online (INTEGER, DEFAULT 0)                    │  │
│  │ max_players (INTEGER, DEFAULT 0)                  │  │
│  │ current_players (INTEGER, DEFAULT 0)             │  │
│  │ tags (TEXT, DEFAULT '')                           │  │
│  │ discord (TEXT, DEFAULT '')                        │  │
│  │ owner_name (TEXT, DEFAULT '')                      │  │
│  │ last_seen (TEXT, DEFAULT '')                      │  │
│  │ support_status (TEXT, DEFAULT '')                 │  │
│  │ resources_count (INTEGER, DEFAULT 0)              │  │
│  │ cfx_code (TEXT, DEFAULT '')                       │  │
│  │ banner_url (TEXT, DEFAULT '')                     │  │
│  │ icon_version (INTEGER, DEFAULT NULL)               │  │
│  │ created_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)   │  │
│  │ updated_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ 1
                        │
                        │
        ┌───────────────┴───────────────┐
        │                               │
        │ N                            │ N
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│     PLAYERS      │          │    RESOURCES     │
│                  │          │                  │
│ id (PK)          │          │ id (PK)          │
│ name (TEXT)      │          │ name (TEXT)      │
│ server_id (FK)   │          │ server_id (FK)   │
│ is_banned        │          │ created_at       │
│ is_whitelisted   │          │                  │
│ ban_reason       │          │ UNIQUE(server_id,│
│ created_at       │          │  name)           │
│ updated_at       │          │                  │
└──────────────────┘          └──────────────────┘
```

---

## 📋 Détails des tables

### 1. Table `servers`

**Description** : Stocke toutes les informations des serveurs FiveM.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique du serveur |
| `name` | TEXT | NOT NULL | Nom du serveur |
| `ip` | TEXT | NOT NULL | Adresse IP du serveur |
| `port` | INTEGER | NOT NULL | Port du serveur |
| `description` | TEXT | NULL | Description du serveur |
| `is_online` | INTEGER | DEFAULT 0 | Statut en ligne (0 = hors ligne, 1 = en ligne) |
| `max_players` | INTEGER | DEFAULT 0 | Nombre maximum de joueurs |
| `current_players` | INTEGER | DEFAULT 0 | Nombre actuel de joueurs |
| `tags` | TEXT | DEFAULT '' | Tags du serveur |
| `discord` | TEXT | DEFAULT '' | Lien Discord du serveur |
| `owner_name` | TEXT | DEFAULT '' | Nom du propriétaire |
| `last_seen` | TEXT | DEFAULT '' | Dernière fois vu |
| `support_status` | TEXT | DEFAULT '' | Statut de support |
| `resources_count` | INTEGER | DEFAULT 0 | Nombre de ressources |
| `cfx_code` | TEXT | DEFAULT '' | Code CFX du serveur |
| `banner_url` | TEXT | DEFAULT '' | URL de la bannière |
| `icon_version` | INTEGER | DEFAULT NULL | Version de l'icône |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date de création |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Index** : Aucun index spécifique (clé primaire automatiquement indexée)

---

### 2. Table `players`

**Description** : Stocke les joueurs associés aux serveurs.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique du joueur |
| `name` | TEXT | NOT NULL | Nom du joueur |
| `server_id` | INTEGER | NOT NULL, FOREIGN KEY | Référence vers `servers.id` |
| `is_banned` | INTEGER | DEFAULT 0 | Statut de ban (0 = non banni, 1 = banni) |
| `is_whitelisted` | INTEGER | DEFAULT 1 | Statut whitelist (0 = non whitelisté, 1 = whitelisté) |
| `ban_reason` | TEXT | DEFAULT NULL | Motif du ban (si banni) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date de création |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date de mise à jour |

**Relations** :
- `server_id` → `servers.id` (ON DELETE CASCADE)

**Index** :
- `idx_players_server_id` sur `server_id` (pour améliorer les performances des requêtes par serveur)

---

### 3. Table `resources`

**Description** : Stocke les ressources (scripts, mods) de chaque serveur.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique de la ressource |
| `name` | TEXT | NOT NULL | Nom de la ressource |
| `server_id` | INTEGER | NOT NULL, FOREIGN KEY | Référence vers `servers.id` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Date de création |

**Relations** :
- `server_id` → `servers.id` (ON DELETE CASCADE)

**Contraintes uniques** :
- `UNIQUE(server_id, name)` : Une ressource ne peut apparaître qu'une seule fois par serveur

**Index** :
- `idx_resources_server_id` sur `server_id` (pour améliorer les performances des requêtes par serveur)

---

## 🔗 Relations entre les tables

### Relation `servers` ↔ `players`
- **Type** : Un-à-plusieurs (1:N)
- **Cardinalité** : Un serveur peut avoir plusieurs joueurs
- **Clé étrangère** : `players.server_id` → `servers.id`
- **Cascade** : Si un serveur est supprimé, tous ses joueurs sont automatiquement supprimés (ON DELETE CASCADE)

### Relation `servers` ↔ `resources`
- **Type** : Un-à-plusieurs (1:N)
- **Cardinalité** : Un serveur peut avoir plusieurs ressources
- **Clé étrangère** : `resources.server_id` → `servers.id`
- **Cascade** : Si un serveur est supprimé, toutes ses ressources sont automatiquement supprimées (ON DELETE CASCADE)
- **Contrainte unique** : Une ressource ne peut apparaître qu'une seule fois par serveur

---

## 📊 Statistiques et optimisations

### Index créés
1. **`idx_players_server_id`** : Index sur `players.server_id`
   - Améliore les performances lors de la récupération des joueurs d'un serveur spécifique
   
2. **`idx_resources_server_id`** : Index sur `resources.server_id`
   - Améliore les performances lors de la récupération des ressources d'un serveur spécifique

### Mode WAL (Write-Ahead Logging)
La base de données utilise le mode **WAL** (`journal_mode = WAL`) pour améliorer les performances en lecture/écriture simultanées.

---

## 🔄 Migrations

Le système de base de données inclut des migrations automatiques pour :
- Ajouter la colonne `is_banned` à la table `players`
- Ajouter la colonne `is_whitelisted` à la table `players`
- Ajouter la colonne `ban_reason` à la table `players` (motif du ban)
- Ajouter la colonne `is_online` à la table `servers`
- Ajouter les colonnes liées à l'API CFX (`max_players`, `current_players`, `tags`, `discord`, `owner_name`, `last_seen`, `support_status`, `resources_count`, `cfx_code`, `banner_url`, `icon_version`)

Ces migrations sont exécutées automatiquement au démarrage si les colonnes n'existent pas encore.

---

## 📝 Exemples de requêtes

### Récupérer tous les serveurs avec leur nombre de joueurs
```sql
SELECT s.*, COUNT(p.id) as player_count
FROM servers s
LEFT JOIN players p ON s.id = p.server_id
GROUP BY s.id;
```

### Récupérer tous les joueurs d'un serveur
```sql
SELECT * FROM players WHERE server_id = ?;
```

### Récupérer toutes les ressources d'un serveur
```sql
SELECT name FROM resources WHERE server_id = ? ORDER BY name ASC;
```

### Récupérer les joueurs bannis d'un serveur
```sql
SELECT * FROM players 
WHERE server_id = ? AND is_banned = 1;
```

---

## 🗂️ Fichier de base de données

**Emplacement** :
- **Linux** : `~/.config/fivem-manager/fivem-manager.db`
- **Windows** : `%APPDATA%/fivem-manager/fivem-manager.db`
- **macOS** : `~/Library/Application Support/fivem-manager/fivem-manager.db`

**Format** : SQLite 3

