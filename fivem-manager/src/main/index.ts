import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, getDatabase, closeDatabase } from './db'
import { Socket } from 'net'
import { request } from 'http'
import { get } from 'https'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Initialiser la base de données
  initDatabase()
  const database = getDatabase()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // ========== HANDLERS POUR LES SERVEURS ==========

  // Récupérer les informations d'un serveur via l'API FiveM avec le code CFX
  ipcMain.handle('servers:fetchFromCFX', async (_, cfxCode: string) => {
    return new Promise((resolve, reject) => {
      const url = `https://servers-frontend.fivem.net/api/servers/single/${cfxCode}`
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
      
      get(url, options, (res) => {
        // Vérifier le code de statut HTTP
        if (res.statusCode !== 200) {
          reject(new Error(`Erreur HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            console.log('========== JSON COMPLET RETOURNÉ PAR L\'API FIVEM ==========')
            console.log(JSON.stringify(json, null, 2))
            console.log('============================================================')
            console.log('Réponse API FiveM - clés principales:', Object.keys(json))
            console.log('connectEndPoints au niveau racine:', json.connectEndPoints)
            console.log('Data existe:', !!json.Data)
            
            if (!json.Data) {
              reject(new Error('Serveur non trouvé ou code CFX invalide. Structure de réponse inattendue.'))
              return
            }

            const serverData = json.Data
            // connectEndPoints peut être au niveau racine ou dans Data
            // Essayer d'abord au niveau racine, puis dans Data
            let connectEndPoints: any[] = []
            
            // Chercher connectEndPoints au niveau racine
            if (json.connectEndPoints) {
              if (Array.isArray(json.connectEndPoints)) {
                connectEndPoints = json.connectEndPoints.filter((ep: any) => ep != null)
              } else if (typeof json.connectEndPoints === 'string') {
                connectEndPoints = [json.connectEndPoints]
              }
            }
            
            // Si pas trouvé au niveau racine, chercher dans Data
            if (connectEndPoints.length === 0 && serverData.connectEndPoints) {
              if (Array.isArray(serverData.connectEndPoints)) {
                connectEndPoints = serverData.connectEndPoints.filter((ep: any) => ep != null)
              } else if (typeof serverData.connectEndPoints === 'string') {
                connectEndPoints = [serverData.connectEndPoints]
              }
            }
            
            console.log('connectEndPoints trouvés:', connectEndPoints, 'type:', typeof json.connectEndPoints, 'length:', connectEndPoints.length)
            
            // Extraire IP et port depuis connectEndPoints (format: "IP:PORT")
            let ip = ''
            let port = 30120 // Port par défaut FiveM
            
            if (connectEndPoints.length > 0) {
              const endpoint = connectEndPoints[0]
              console.log('Premier endpoint:', endpoint, 'type:', typeof endpoint)
              
              if (typeof endpoint === 'string' && endpoint.includes(':')) {
                const parts = endpoint.split(':')
                ip = parts[0].trim()
                port = parseInt(parts[1]) || 30120
                console.log('IP extraite depuis string:', ip, 'port:', port)
              } else if (typeof endpoint === 'object' && endpoint !== null) {
                // Format alternatif avec objet
                const endpointObj = endpoint as { ip?: string; address?: string; port?: number }
                ip = (endpointObj.ip || endpointObj.address || '').trim()
                port = endpointObj.port || 30120
                console.log('IP extraite depuis objet:', ip, 'port:', port)
              }
            }
            
            // Si toujours pas d'IP, essayer de chercher dans d'autres champs
            if (!ip) {
              // Chercher dans les variables du serveur
              const vars = serverData.vars || {}
              console.log('Recherche IP dans vars:', Object.keys(vars))
              
              // Dernière tentative : rejeter avec plus d'informations
              const errorMsg = `Aucune adresse IP trouvée pour ce serveur. 
connectEndPoints (racine): ${JSON.stringify(json.connectEndPoints)}
connectEndPoints (Data): ${JSON.stringify(serverData.connectEndPoints)}
Structure JSON disponible: ${Object.keys(json).join(', ')}`
              console.error(errorMsg)
              reject(new Error(errorMsg))
              return
            }

            const vars = serverData.vars || {}
            const resources = serverData.resources || []
            
            // Récupérer les joueurs depuis l'API
            const players = serverData.players || json.players || []
            console.log('Joueurs trouvés dans l\'API:', players.length)
            
            // Récupérer l'URL de la bannière/logo du serveur depuis ownerAvatar
            const bannerUrl = json.ownerAvatar || ''
            console.log('Bannière/Logo trouvé (ownerAvatar):', bannerUrl || 'Aucune')
            
            const serverInfo = {
              name: serverData.hostname || vars.sv_projectName || 'Serveur FiveM',
              ip: ip,
              port: port,
              description: vars.sv_projectDesc || serverData.sv_projectDesc || vars.sv_projectName || '',
              is_online: 1, // On suppose qu'il est en ligne si on peut récupérer les infos
              max_players: serverData.sv_maxclients || parseInt(vars.sv_maxClients) || 0,
              current_players: serverData.clients || serverData.selfReportedClients || 0,
              tags: vars.tags || '',
              discord: vars.Discord || '',
              owner_name: json.ownerName || '',
              last_seen: json.lastSeen || '',
              support_status: json.support_status || '',
              resources_count: resources.length || 0,
              cfx_code: cfxCode,
              banner_url: bannerUrl,
              icon_version: null, // Plus utilisé, on garde pour compatibilité
              resources: resources, // Liste complète des ressources
              players: players.map((p: any) => ({
                name: p.name || 'Joueur inconnu',
                id: p.id,
                ping: p.ping || 0,
                identifiers: p.identifiers || []
              }))
            }

            console.log('Informations serveur extraites avec succès:', { 
              name: serverInfo.name, 
              ip: serverInfo.ip, 
              port: serverInfo.port,
              players_count: serverInfo.players.length
            })
            resolve(serverInfo)
          } catch (error) {
            console.error('Erreur lors du parsing:', error)
            reject(new Error('Erreur lors du parsing des données: ' + (error as Error).message))
          }
        })
      }).on('error', (error) => {
        console.error('Erreur réseau:', error)
        reject(new Error('Erreur lors de la récupération des données: ' + error.message))
      })

      // Timeout de 10 secondes
      setTimeout(() => {
        reject(new Error('Timeout: Le serveur ne répond pas'))
      }, 10000)
    })
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

  // Créer un serveur
  ipcMain.handle('servers:create', (_, server: { 
    name: string
    ip: string
    port: number
    description?: string
    max_players?: number
    current_players?: number
    tags?: string
    discord?: string
    owner_name?: string
    last_seen?: string
    support_status?: string
    resources_count?: number
    cfx_code?: string
    banner_url?: string
    icon_version?: number | null
  }) => {
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
      const players = (server as any).players || []
      if (players.length > 0) {
        const playerStmt = database.prepare('INSERT INTO players (name, server_id, is_whitelisted) VALUES (?, ?, 1)')
        const insertMany = database.transaction((playersList: any[]) => {
          for (const player of playersList) {
            try {
              playerStmt.run(player.name, serverId)
            } catch (error) {
              // Ignorer les erreurs (joueur déjà existant, etc.)
              console.log('Erreur lors de l\'ajout du joueur', player.name, ':', error)
            }
          }
        })
        insertMany(players)
        console.log(`${players.length} joueurs ajoutés au serveur ${serverId}`)
      }
      
      // Ajouter les ressources si fournies
      const resources = (server as any).resources || []
      if (resources.length > 0) {
        const resourceStmt = database.prepare('INSERT OR IGNORE INTO resources (name, server_id) VALUES (?, ?)')
        const insertResources = database.transaction((resourcesList: string[]) => {
          for (const resource of resourcesList) {
            try {
              resourceStmt.run(resource, serverId)
            } catch (error) {
              // Ignorer les erreurs (ressource déjà existante, etc.)
              console.log('Erreur lors de l\'ajout de la ressource', resource, ':', error)
            }
          }
        })
        insertResources(resources)
        console.log(`${resources.length} ressources ajoutées au serveur ${serverId}`)
      }
      
      return { id: serverId, ...server }
    } catch (error) {
      console.error('Erreur lors de la création du serveur:', error)
      throw error
    }
  })

  // Mettre à jour un serveur
  ipcMain.handle('servers:update', (_, id: number, server: { 
    name: string
    ip: string
    port: number
    description?: string
    max_players?: number
    current_players?: number
    tags?: string
    discord?: string
    owner_name?: string
    last_seen?: string
    support_status?: string
    resources_count?: number
    cfx_code?: string
    banner_url?: string
    icon_version?: number | null
  }) => {
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
      const resources = (server as any).resources
      if (Array.isArray(resources)) {
        // Supprimer les anciennes ressources
        const deleteStmt = database.prepare('DELETE FROM resources WHERE server_id = ?')
        deleteStmt.run(id)
        
        // Ajouter les nouvelles ressources
        if (resources.length > 0) {
          const resourceStmt = database.prepare('INSERT OR IGNORE INTO resources (name, server_id) VALUES (?, ?)')
          const insertResources = database.transaction((resourcesList: string[]) => {
            for (const resource of resourcesList) {
              try {
                resourceStmt.run(resource, id)
              } catch (error) {
                // Ignorer les erreurs (ressource déjà existante, etc.)
                console.log('Erreur lors de l\'ajout de la ressource', resource, ':', error)
              }
            }
          })
          insertResources(resources)
          console.log(`${resources.length} ressources mises à jour pour le serveur ${id}`)
        }
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

  // ========== HANDLERS POUR LES JOUEURS ==========

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
      const stmt = database.prepare('SELECT * FROM players WHERE server_id = ? ORDER BY created_at DESC')
      return stmt.all(serverId)
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs du serveur:', error)
      throw error
    }
  })

  // ========== HANDLERS POUR LES RESSOURCES ==========

  // Obtenir toutes les ressources d'un serveur
  ipcMain.handle('resources:getByServerId', (_, serverId: number) => {
    try {
      const stmt = database.prepare('SELECT name FROM resources WHERE server_id = ? ORDER BY name ASC')
      const results = stmt.all(serverId) as Array<{ name: string }>
      return results.map(r => r.name)
    } catch (error) {
      console.error('Erreur lors de la récupération des ressources du serveur:', error)
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
      const stmt = database.prepare('INSERT INTO players (name, server_id, is_whitelisted) VALUES (?, ?, 1)')
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
  ipcMain.handle('players:ban', (_, id: number) => {
    try {
      const stmt = database.prepare('UPDATE players SET is_banned = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du ban du joueur:', error)
      throw error
    }
  })

  // Débannir un joueur
  ipcMain.handle('players:unban', (_, id: number) => {
    try {
      const stmt = database.prepare('UPDATE players SET is_banned = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
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
      const stmt = database.prepare('UPDATE players SET is_whitelisted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la whitelist:', error)
      throw error
    }
  })

  // Retirer de la whitelist
  ipcMain.handle('players:unwhitelist', (_, id: number) => {
    try {
      const stmt = database.prepare('UPDATE players SET is_whitelisted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error) {
      console.error('Erreur lors du retrait de la whitelist:', error)
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

  // Fonction pour vérifier si un serveur FiveM est en ligne
  // Essaie d'abord l'API HTTP FiveM (port +1), puis le port TCP direct
  const checkServerStatus = (ip: string, port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      // FiveM expose une API HTTP sur le port +1 (ex: 30120 -> 30121)
      const httpPort = port + 1
      const apiUrl = `http://${ip}:${httpPort}/info.json`

      // Essayer d'abord l'API HTTP FiveM
      const httpReq = request(
        {
          hostname: ip,
          port: httpPort,
          path: '/info.json',
          method: 'GET',
          timeout: 2000
        },
        (res) => {
          // Si on reçoit une réponse (même erreur 404), le serveur est en ligne
          resolve(res.statusCode !== undefined)
          res.destroy()
        }
      )

      httpReq.on('error', () => {
        // Si l'API HTTP échoue, essayer une connexion TCP simple
        const socket = new Socket()
        const timeout = 2000 // 2 secondes de timeout

        socket.setTimeout(timeout)
        socket.once('connect', () => {
          socket.destroy()
          resolve(true)
        })

        socket.once('timeout', () => {
          socket.destroy()
          resolve(false)
        })

        socket.once('error', () => {
          socket.destroy()
          resolve(false)
        })

        socket.connect(port, ip)
      })

      httpReq.on('timeout', () => {
        httpReq.destroy()
        // Essayer TCP en fallback
        const socket = new Socket()
        const timeout = 2000

        socket.setTimeout(timeout)
        socket.once('connect', () => {
          socket.destroy()
          resolve(true)
        })

        socket.once('timeout', () => {
          socket.destroy()
          resolve(false)
        })

        socket.once('error', () => {
          socket.destroy()
          resolve(false)
        })

        socket.connect(port, ip)
      })

      httpReq.end()
    })
  }

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

  // Ajouter des joueurs de test à tous les serveurs
  ipcMain.handle('servers:addSamplePlayers', () => {
    try {
      const samplePlayerNames = [
        'John_Doe',
        'Jane_Smith',
        'Mike_Johnson',
        'Sarah_Williams',
        'David_Brown',
        'Emily_Davis',
        'Chris_Wilson',
        'Jessica_Martinez',
        'Ryan_Anderson',
        'Amanda_Taylor',
        'Kevin_Thomas',
        'Lisa_Jackson',
        'Daniel_White',
        'Michelle_Harris',
        'James_Martin',
        'Jennifer_Garcia',
        'Robert_Rodriguez',
        'Nicole_Lewis',
        'William_Walker',
        'Stephanie_Hall'
      ]

      // Récupérer tous les serveurs
      const serversStmt = database.prepare('SELECT id, name FROM servers')
      const servers = serversStmt.all() as Array<{ id: number; name: string }>

      if (servers.length === 0) {
        return { success: false, message: 'Aucun serveur trouvé' }
      }

      const insertPlayer = database.prepare(
        'INSERT INTO players (name, server_id, is_banned, is_whitelisted) VALUES (?, ?, ?, ?)'
      )

      let totalAdded = 0

      for (const server of servers) {
        // Ajouter 5-10 joueurs aléatoires par serveur
        const numPlayers = Math.floor(Math.random() * 6) + 5 // Entre 5 et 10 joueurs
        const shuffledNames = [...samplePlayerNames].sort(() => Math.random() - 0.5)

        for (let i = 0; i < numPlayers && i < shuffledNames.length; i++) {
          const name = shuffledNames[i]
          // 10% de chance d'être banni, tous les joueurs sont whitelistés par défaut
          const isBanned = Math.random() < 0.1 ? 1 : 0
          const isWhitelisted = 1 // Tous les joueurs sont whitelistés par défaut

          try {
            insertPlayer.run(name, server.id, isBanned, isWhitelisted)
            totalAdded++
          } catch (error) {
            // Ignorer les erreurs (joueur déjà existant, etc.)
            console.error(`Erreur lors de l'ajout de ${name} au serveur ${server.name}:`, error)
          }
        }
      }

      return { success: true, totalAdded, message: `${totalAdded} joueur(s) ajouté(s) avec succès` }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des joueurs de test:', error)
      throw error
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Fermer la base de données à la fermeture de l'application
app.on('before-quit', () => {
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
