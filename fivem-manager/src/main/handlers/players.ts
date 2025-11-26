import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'

/**
 * Enregistre tous les handlers IPC pour les joueurs
 */
export function registerPlayerHandlers(database: Database.Database): void {
  // Obtenir tous les joueurs
  ipcMain.handle('players:getAll', () => {
    try {
      const stmt = database.prepare(`
        SELECT p.*, s.name as server_name, s.ip as server_ip, s.port as server_port
        FROM players p
        LEFT JOIN servers s ON p.server_id = s.id
        ORDER BY p.created_at DESC
      `)
      return stmt.all()
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs:', error)
      throw error
    }
  })

  // Obtenir les joueurs d'un serveur
  ipcMain.handle('players:getByServerId', (_, serverId: number) => {
    try {
      const stmt = database.prepare(
        'SELECT *, banned_by_user_id FROM players WHERE server_id = ? ORDER BY created_at DESC'
      )
      return stmt.all(serverId)
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs du serveur:', error)
      throw error
    }
  })

  // Obtenir un joueur par ID
  ipcMain.handle('players:getById', (_, id: number) => {
    try {
      const stmt = database.prepare('SELECT * FROM players WHERE id = ?')
      return stmt.get(id)
    } catch (error) {
      console.error('Erreur lors de la récupération du joueur:', error)
      throw error
    }
  })

  // Créer un joueur (whitelisté par défaut)
  ipcMain.handle('players:create', (_, player: { name: string; server_id: number }) => {
    try {
      const stmt = database.prepare(
        'INSERT INTO players (name, server_id, is_whitelisted) VALUES (?, ?, 1)'
      )
      const result = stmt.run(player.name, player.server_id)
      return { id: result.lastInsertRowid, ...player, is_whitelisted: true }
    } catch (error) {
      console.error('Erreur lors de la création du joueur:', error)
      throw error
    }
  })

  // Mettre à jour un joueur
  ipcMain.handle('players:update', (_, id: number, player: { name: string; server_id: number }) => {
    try {
      const stmt = database.prepare(
        'UPDATE players SET name = ?, server_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(player.name, player.server_id, id)
      return { id, ...player }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du joueur:', error)
      throw error
    }
  })

  // Supprimer un joueur
  ipcMain.handle('players:delete', (_, id: number) => {
    try {
      const stmt = database.prepare('DELETE FROM players WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la suppression du joueur:', error)
      throw error
    }
  })

  // Bannir un joueur
  ipcMain.handle('players:ban', (_, id: number, reason: string, userId?: number) => {
    try {
      const stmt = database.prepare(
        'UPDATE players SET is_banned = 1, ban_reason = ?, banned_by_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(reason || null, userId || null, id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du ban du joueur:', error)
      throw error
    }
  })

  // Débannir un joueur
  ipcMain.handle('players:unban', (_, id: number) => {
    try {
      const stmt = database.prepare(
        'UPDATE players SET is_banned = 0, ban_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du unban du joueur:', error)
      throw error
    }
  })

  // Ajouter à la whitelist
  ipcMain.handle('players:whitelist', (_, id: number) => {
    try {
      const stmt = database.prepare(
        'UPDATE players SET is_whitelisted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la whitelist:", error)
      throw error
    }
  })

  // Retirer de la whitelist
  ipcMain.handle('players:unwhitelist', (_, id: number) => {
    try {
      const stmt = database.prepare(
        'UPDATE players SET is_whitelisted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du retrait de la whitelist:', error)
      throw error
    }
  })
}
