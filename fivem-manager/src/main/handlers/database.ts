import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'

/**
 * Enregistre tous les handlers IPC pour la base de données
 */
export function registerDatabaseHandlers(database: Database.Database): void {
  // Réinitialiser la base de données (supprimer toutes les données)
  ipcMain.handle('database:reset', () => {
    try {
      // Supprimer tous les joueurs
      database.prepare('DELETE FROM players').run()

      // Supprimer tous les serveurs
      database.prepare('DELETE FROM servers').run()

      // Réinitialiser les séquences AUTOINCREMENT
      database.prepare('DELETE FROM sqlite_sequence WHERE name IN ("servers", "players")').run()

      return { success: true, message: 'Base de données réinitialisée avec succès' }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la base de données:', error)
      throw error
    }
  })
}
