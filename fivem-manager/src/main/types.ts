// Types partagés pour les serveurs, joueurs et ressources

export interface ServerInput {
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
  players?: Array<{ name: string; id?: number; ping?: number; identifiers?: string[] }>
  resources?: string[]
}

export interface PlayerInput {
  name: string
  server_id: number
}

export interface CFXServerResponse {
  Data?: {
    hostname?: string
    connectEndPoints?: string | string[]
    vars?: Record<string, string>
    resources?: string[]
    players?: Array<{ name: string; id: number; ping?: number; identifiers?: string[] }>
    clients?: number
    selfReportedClients?: number
    sv_maxclients?: number
    sv_projectDesc?: string
  }
  players?: Array<{ name: string; id: number; ping?: number; identifiers?: string[] }>
  ownerAvatar?: string
  ownerName?: string
  lastSeen?: string
  support_status?: string
}

