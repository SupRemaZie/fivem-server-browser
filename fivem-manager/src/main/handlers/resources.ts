import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'

/**
 * Enregistre tous les handlers IPC pour les ressources
 */
export function registerResourceHandlers(database: Database.Database): void {
  // Obtenir toutes les ressources d'un serveur
  ipcMain.handle('resources:getByServerId', (_, serverId: number) => {
    try {
      const stmt = database.prepare(
        'SELECT name FROM resources WHERE server_id = ? ORDER BY name ASC'
      )
      const results = stmt.all(serverId) as Array<{ name: string }>
      return results.map((r) => r.name)
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources du serveur:', error)
      throw error
    }
  })
}
