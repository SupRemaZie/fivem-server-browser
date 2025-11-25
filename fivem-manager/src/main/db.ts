import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

// Schéma SQL de la base de données
const schema = `
-- Table des serveurs FiveM
CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des joueurs
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    server_id INTEGER NOT NULL,
    is_banned INTEGER DEFAULT 0,
    is_whitelisted INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Table des ressources
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    server_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE(server_id, name)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_players_server_id ON players(server_id);
CREATE INDEX IF NOT EXISTS idx_resources_server_id ON resources(server_id);
`

export function initDatabase(): Database.Database {
  if (db) {
    return db
  }

  // Chemin vers la base de données dans le dossier userData
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'fivem-manager.db')

  // Créer la connexion à la base de données
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Exécuter le schéma SQL
  db.exec(schema)

  // Migration : ajouter les colonnes is_banned et is_whitelisted si elles n'existent pas
  try {
    db.exec(`
      ALTER TABLE players ADD COLUMN is_banned INTEGER DEFAULT 0;
    `)
  } catch (error) {
    // La colonne existe déjà, ignorer l'erreur
  }

  try {
    db.exec(`
      ALTER TABLE players ADD COLUMN is_whitelisted INTEGER DEFAULT 1;
    `)
  } catch (error) {
    // La colonne existe déjà, mettre à jour les joueurs existants pour qu'ils soient whitelistés
    try {
      db.exec(`
        UPDATE players SET is_whitelisted = 1 WHERE is_whitelisted = 0 OR is_whitelisted IS NULL;
      `)
    } catch (updateError) {
      // Ignorer l'erreur
    }
  }

  // Migration : ajouter la colonne is_online si elle n'existe pas
  try {
    db.exec(`
      ALTER TABLE servers ADD COLUMN is_online INTEGER DEFAULT 0;
    `)
  } catch (error) {
    // La colonne existe déjà, ignorer l'erreur
  }

  // Migration : ajouter la colonne ban_reason si elle n'existe pas
  try {
    db.exec(`
      ALTER TABLE players ADD COLUMN ban_reason TEXT DEFAULT NULL;
    `)
  } catch (error) {
    // La colonne existe déjà, ignorer l'erreur
  }

  // Migration : ajouter les nouvelles colonnes pour les infos de l'API FiveM
  const newColumns = [
    { name: 'max_players', type: 'INTEGER', default: '0' },
    { name: 'current_players', type: 'INTEGER', default: '0' },
    { name: 'tags', type: 'TEXT', default: "''" },
    { name: 'discord', type: 'TEXT', default: "''" },
    { name: 'owner_name', type: 'TEXT', default: "''" },
    { name: 'last_seen', type: 'TEXT', default: "''" },
    { name: 'support_status', type: 'TEXT', default: "''" },
    { name: 'resources_count', type: 'INTEGER', default: '0' },
    { name: 'cfx_code', type: 'TEXT', default: "''" },
    { name: 'banner_url', type: 'TEXT', default: "''" },
    { name: 'icon_version', type: 'INTEGER', default: 'NULL' }
  ]

  for (const column of newColumns) {
    try {
      db.exec(`
        ALTER TABLE servers ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default};
      `)
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
    }
  }

  console.log('Base de données initialisée:', dbPath)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

