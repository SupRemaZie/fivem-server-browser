import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'
import { fetchServerFromCFX } from '../utils/cfxApi'
import { checkServerStatus } from '../utils/serverStatus'
import type { ServerInput } from '../types'

/**
 * Enregistre tous les handlers IPC pour les serveurs
 */
export function registerServerHandlers(database: Database.Database): void {
  // Récupérer les informations d'un serveur via l'API FiveM avec le code CFX
  ipcMain.handle('servers:fetchFromCFX', async (_, cfxCode: string) => {
    return fetchServerFromCFX(cfxCode)
  })

  // Obtenir tous les serveurs
  ipcMain.handle('servers:getAll', () => {
    try {
      const stmt = database.prepare('SELECT * FROM servers ORDER BY created_at DESC')
      return stmt.all()
    } catch (error) {
      console.error('Erreur lors de la récupération des serveurs:', error)
      throw error
    }
  })

  // Obtenir un serveur par ID
  ipcMain.handle('servers:getById', (_, id: number) => {
    try {
      const stmt = database.prepare('SELECT * FROM servers WHERE id = ?')
      return stmt.get(id)
    } catch (error) {
      console.error('Erreur lors de la récupération du serveur:', error)
      throw error
    }
  })

  // Vérifier si un serveur existe déjà (par IP/port ou par code CFX)
  ipcMain.handle('servers:exists', (_, ip: string, port: number, cfxCode?: string | null) => {
    try {
      // Vérifier par code CFX si fourni
      if (cfxCode && cfxCode.trim()) {
        const cfxStmt = database.prepare('SELECT id, name FROM servers WHERE cfx_code = ?')
        const cfxResult = cfxStmt.get(cfxCode.trim()) as { id: number; name: string } | undefined
        if (cfxResult) {
          return { exists: true, server: cfxResult }
        }
      }

      // Vérifier par IP et port
      const ipPortStmt = database.prepare('SELECT id, name FROM servers WHERE ip = ? AND port = ?')
      const ipPortResult = ipPortStmt.get(ip, port) as { id: number; name: string } | undefined
      if (ipPortResult) {
        return { exists: true, server: ipPortResult }
      }

      return { exists: false }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'existence du serveur:', error)
      throw error
    }
  })

  // Créer un serveur
  ipcMain.handle('servers:create', (_, server: ServerInput) => {
    try {
      const stmt = database.prepare(
        `INSERT INTO servers (
          name, ip, port, description, max_players, current_players, 
          tags, discord, owner_name, last_seen, support_status, 
          resources_count, cfx_code, banner_url, icon_version, is_online
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      const result = stmt.run(
        server.name,
        server.ip,
        server.port,
        server.description || null,
        server.max_players || 0,
        server.current_players || 0,
        server.tags || null,
        server.discord || null,
        server.owner_name || null,
        server.last_seen || null,
        server.support_status || null,
        server.resources_count || 0,
        server.cfx_code || null,
        server.banner_url || null,
        server.icon_version || null,
        1 // is_online par défaut à 1 si créé via CFX
      )
      const serverId = result.lastInsertRowid as number

      // Ajouter les joueurs si fournis
      if (server.players && server.players.length > 0) {
        insertPlayers(database, server.players, serverId)
      }

      // Ajouter les ressources si fournies
      if (server.resources && server.resources.length > 0) {
        insertResources(database, server.resources, serverId)
      }

      return { id: serverId, ...server }
    } catch (error) {
      console.error('Erreur lors de la création du serveur:', error)
      throw error
    }
  })

  // Mettre à jour un serveur
  ipcMain.handle('servers:update', (_, id: number, server: ServerInput) => {
    try {
      const stmt = database.prepare(
        `UPDATE servers SET 
          name = ?, ip = ?, port = ?, description = ?, 
          max_players = ?, current_players = ?, tags = ?, 
          discord = ?, owner_name = ?, last_seen = ?, 
          support_status = ?, resources_count = ?, cfx_code = ?,
          banner_url = ?, icon_version = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`
      )
      stmt.run(
        server.name,
        server.ip,
        server.port,
        server.description || null,
        server.max_players || 0,
        server.current_players || 0,
        server.tags || null,
        server.discord || null,
        server.owner_name || null,
        server.last_seen || null,
        server.support_status || null,
        server.resources_count || 0,
        server.cfx_code || null,
        server.banner_url || null,
        server.icon_version || null,
        id
      )

      // Mettre à jour les ressources si fournies
      if (Array.isArray(server.resources)) {
        updateResources(database, server.resources, id)
      }

      return { id, ...server }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du serveur:', error)
      throw error
    }
  })

  // Supprimer un serveur
  ipcMain.handle('servers:delete', (_, id: number) => {
    try {
      const stmt = database.prepare('DELETE FROM servers WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la suppression du serveur:', error)
      throw error
    }
  })

  // Obtenir le nombre de joueurs par serveur
  ipcMain.handle('servers:getPlayerCount', (_, serverId: number) => {
    try {
      const stmt = database.prepare('SELECT COUNT(*) as count FROM players WHERE server_id = ?')
      const result = stmt.get(serverId) as { count: number }
      return result.count
    } catch (error) {
      console.error('Erreur lors du comptage des joueurs:', error)
      throw error
    }
  })

  // Vérifier l'état d'un serveur
  ipcMain.handle('servers:checkStatus', async (_, serverId: number) => {
    try {
      const stmt = database.prepare('SELECT ip, port FROM servers WHERE id = ?')
      const server = stmt.get(serverId) as { ip: string; port: number } | undefined

      if (!server) {
        throw new Error('Serveur non trouvé')
      }

      const isOnline = await checkServerStatus(server.ip, server.port)

      // Mettre à jour l'état dans la base de données
      const updateStmt = database.prepare(
        'UPDATE servers SET is_online = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      updateStmt.run(isOnline ? 1 : 0, serverId)

      return { isOnline }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error)
      throw error
    }
  })

  // Vérifier l'état de tous les serveurs
  ipcMain.handle('servers:checkAllStatus', async () => {
    try {
      const stmt = database.prepare('SELECT id, ip, port FROM servers')
      const servers = stmt.all() as Array<{ id: number; ip: string; port: number }>

      const results = await Promise.all(
        servers.map(async (server) => {
          const isOnline = await checkServerStatus(server.ip, server.port)
          const updateStmt = database.prepare(
            'UPDATE servers SET is_online = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          )
          updateStmt.run(isOnline ? 1 : 0, server.id)
          return { id: server.id, isOnline }
        })
      )

      return results
    } catch (error) {
      console.error('Erreur lors de la vérification des statuts:', error)
      throw error
    }
  })
}

/**
 * Insère plusieurs joueurs dans la base de données
 */
function insertPlayers(
  database: Database.Database,
  players: Array<{ name: string }>,
  serverId: number
): void {
  const playerStmt = database.prepare(
    'INSERT INTO players (name, server_id, is_whitelisted) VALUES (?, ?, 1)'
  )
  const insertMany = database.transaction((playersList: Array<{ name: string }>) => {
    for (const player of playersList) {
      try {
        playerStmt.run(player.name, serverId)
      } catch (error) {
        // Ignorer les erreurs (joueur déjà existant, etc.)
        console.log("Erreur lors de l'ajout du joueur", player.name, ':', error)
      }
    }
  })
  insertMany(players)
  console.log(`${players.length} joueurs ajoutés au serveur ${serverId}`)
}

/**
 * Insère plusieurs ressources dans la base de données
 */
function insertResources(database: Database.Database, resources: string[], serverId: number): void {
  const resourceStmt = database.prepare(
    'INSERT OR IGNORE INTO resources (name, server_id) VALUES (?, ?)'
  )
  const insertResources = database.transaction((resourcesList: string[]) => {
    for (const resource of resourcesList) {
      try {
        resourceStmt.run(resource, serverId)
      } catch (error) {
        // Ignorer les erreurs (ressource déjà existante, etc.)
        console.log("Erreur lors de l'ajout de la ressource", resource, ':', error)
      }
    }
  })
  insertResources(resources)
  console.log(`${resources.length} ressources ajoutées au serveur ${serverId}`)
}

/**
 * Met à jour les ressources d'un serveur (supprime les anciennes et ajoute les nouvelles)
 */
function updateResources(database: Database.Database, resources: string[], serverId: number): void {
  // Supprimer les anciennes ressources
  const deleteStmt = database.prepare('DELETE FROM resources WHERE server_id = ?')
  deleteStmt.run(serverId)

  // Ajouter les nouvelles ressources
  if (resources.length > 0) {
    insertResources(database, resources, serverId)
    console.log(`${resources.length} ressources mises à jour pour le serveur ${serverId}`)
  }
}
