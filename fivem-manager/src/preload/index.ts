import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Types pour les serveurs et joueurs
export interface Server {
  id?: number
  name: string
  ip: string
  port: number
  description?: string
  is_online?: number | boolean
  created_at?: string
  updated_at?: string
}

export interface Player {
  id?: number
  name: string
  server_id: number
  is_banned?: number | boolean
  is_whitelisted?: number | boolean
  server_name?: string
  server_ip?: string
  server_port?: number
  created_at?: string
  updated_at?: string
}

// Custom APIs for renderer
const api = {
  // APIs pour les serveurs
  servers: {
    getAll: (): Promise<Server[]> => ipcRenderer.invoke('servers:getAll'),
    getById: (id: number): Promise<Server> => ipcRenderer.invoke('servers:getById', id),
    exists: (
      ip: string,
      port: number,
      cfxCode?: string | null
    ): Promise<{ exists: boolean; server?: { id: number; name: string } }> =>
      ipcRenderer.invoke('servers:exists', ip, port, cfxCode),
    create: (
      server: Omit<Server, 'id' | 'created_at' | 'updated_at' | 'is_online'>
    ): Promise<Server> => ipcRenderer.invoke('servers:create', server),
    update: (
      id: number,
      server: Omit<Server, 'id' | 'created_at' | 'updated_at' | 'is_online'>
    ): Promise<Server> => ipcRenderer.invoke('servers:update', id, server),
    delete: (id: number): Promise<{ success: boolean }> => ipcRenderer.invoke('servers:delete', id),
    getPlayerCount: (serverId: number): Promise<number> =>
      ipcRenderer.invoke('servers:getPlayerCount', serverId),
    checkStatus: (serverId: number): Promise<{ isOnline: boolean }> =>
      ipcRenderer.invoke('servers:checkStatus', serverId),
    checkAllStatus: (): Promise<Array<{ id: number; isOnline: boolean }>> =>
      ipcRenderer.invoke('servers:checkAllStatus'),
    fetchFromCFX: (
      cfxCode: string
    ): Promise<{
      name: string
      ip: string
      port: number
      description: string
      is_online: number
      max_players: number
      current_players: number
      tags: string
      discord: string
      owner_name: string
      last_seen: string
      support_status: string
      resources_count: number
      cfx_code: string
      banner_url: string
      icon_version: number | null
      players: Array<{ name: string; id?: number; ping?: number; identifiers?: string[] }>
    }> => ipcRenderer.invoke('servers:fetchFromCFX', cfxCode)
  },
  // APIs pour les joueurs
  players: {
    getAll: (): Promise<Player[]> => ipcRenderer.invoke('players:getAll'),
    getById: (id: number): Promise<Player> => ipcRenderer.invoke('players:getById', id),
    getByServerId: (serverId: number): Promise<Player[]> =>
      ipcRenderer.invoke('players:getByServerId', serverId),
    create: (
      player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'is_banned' | 'is_whitelisted'>
    ): Promise<Player> => ipcRenderer.invoke('players:create', player),
    update: (
      id: number,
      player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'is_banned' | 'is_whitelisted'>
    ): Promise<Player> => ipcRenderer.invoke('players:update', id, player),
    delete: (id: number): Promise<{ success: boolean }> => ipcRenderer.invoke('players:delete', id),
    ban: (id: number, reason: string, userId?: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('players:ban', id, reason, userId),
    unban: (id: number): Promise<{ success: boolean }> => ipcRenderer.invoke('players:unban', id),
    whitelist: (id: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('players:whitelist', id),
    unwhitelist: (id: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('players:unwhitelist', id)
  },
  // APIs pour les ressources
  resources: {
    getByServerId: (serverId: number): Promise<string[]> =>
      ipcRenderer.invoke('resources:getByServerId', serverId)
  },
  // APIs pour la base de données
  database: {
    reset: (): Promise<{ success: boolean; message: string }> =>
      ipcRenderer.invoke('database:reset')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
