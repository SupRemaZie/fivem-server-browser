import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface API {
  servers: {
    getAll: () => Promise<Server[]>
    getById: (id: number) => Promise<Server>
    create: (server: Omit<Server, 'id' | 'created_at' | 'updated_at' | 'is_online'>) => Promise<Server>
    update: (id: number, server: Omit<Server, 'id' | 'created_at' | 'updated_at' | 'is_online'>) => Promise<Server>
    delete: (id: number) => Promise<{ success: boolean }>
    getPlayerCount: (serverId: number) => Promise<number>
    checkStatus: (serverId: number) => Promise<{ isOnline: boolean }>
    checkAllStatus: () => Promise<Array<{ id: number; isOnline: boolean }>>
    addSamplePlayers: () => Promise<{ success: boolean; totalAdded: number; message: string }>
  }
  players: {
    getAll: () => Promise<Player[]>
    getById: (id: number) => Promise<Player>
    getByServerId: (serverId: number) => Promise<Player[]>
    create: (player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'is_banned' | 'is_whitelisted'>) => Promise<Player>
    update: (id: number, player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'is_banned' | 'is_whitelisted'>) => Promise<Player>
    delete: (id: number) => Promise<{ success: boolean }>
    ban: (id: number) => Promise<{ success: boolean }>
    unban: (id: number) => Promise<{ success: boolean }>
    whitelist: (id: number) => Promise<{ success: boolean }>
    unwhitelist: (id: number) => Promise<{ success: boolean }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
