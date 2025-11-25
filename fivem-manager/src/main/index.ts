import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, getDatabase, closeDatabase } from './db'
import { Socket } from 'net'

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
  ipcMain.handle('servers:create', (_, server: { name: string; ip: string; port: number; description?: string }) => {
    try {
      const stmt = database.prepare(
        'INSERT INTO servers (name, ip, port, description) VALUES (?, ?, ?, ?)'
      )
      const result = stmt.run(server.name, server.ip, server.port, server.description || null)
      return { id: result.lastInsertRowid, ...server }
    } catch (error) {
      console.error('Erreur lors de la création du serveur:', error)
      throw error
    }
  })

  // Mettre à jour un serveur
  ipcMain.handle('servers:update', (_, id: number, server: { name: string; ip: string; port: number; description?: string }) => {
    try {
      const stmt = database.prepare(
        'UPDATE servers SET name = ?, ip = ?, port = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      stmt.run(server.name, server.ip, server.port, server.description || null, id)
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

  // Créer un joueur
  ipcMain.handle('players:create', (_, player: { name: string; server_id: number }) => {
    try {
      const stmt = database.prepare('INSERT INTO players (name, server_id) VALUES (?, ?)')
      const result = stmt.run(player.name, player.server_id)
      return { id: result.lastInsertRowid, ...player }
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

  // Fonction pour vérifier si un serveur est en ligne
  const checkServerStatus = (ip: string, port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = new Socket()
      const timeout = 3000 // 3 secondes de timeout

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
          // 10% de chance d'être banni, 20% de chance d'être whitelisté
          const isBanned = Math.random() < 0.1 ? 1 : 0
          const isWhitelisted = Math.random() < 0.2 ? 1 : 0

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
