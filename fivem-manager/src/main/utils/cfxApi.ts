import { get } from 'https'
import type { CFXServerResponse, ServerInput } from '../types'

const CFX_API_BASE_URL = 'https://servers-frontend.fivem.net/api/servers/single'
const REQUEST_TIMEOUT = 10000 // 10 secondes
const DEFAULT_FIVEM_PORT = 30120

/**
 * Récupère les informations d'un serveur FiveM via l'API CFX
 */
export function fetchServerFromCFX(cfxCode: string): Promise<ServerInput> {
  return new Promise((resolve, reject) => {
    const url = `${CFX_API_BASE_URL}/${cfxCode}`

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json'
      }
    }

    const request = get(url, options, (res) => {
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
          const json: CFXServerResponse = JSON.parse(data)

          if (!json.Data) {
            reject(
              new Error('Serveur non trouvé ou code CFX invalide. Structure de réponse inattendue.')
            )
            return
          }

          const serverInfo = parseCFXResponse(json, cfxCode)
          resolve(serverInfo)
        } catch (error) {
          console.error('Erreur lors du parsing:', error)
          reject(new Error('Erreur lors du parsing des données: ' + (error as Error).message))
        }
      })
    })

    request.on('error', (error) => {
      console.error('Erreur réseau:', error)
      reject(new Error('Erreur lors de la récupération des données: ' + error.message))
    })

    // Timeout
    setTimeout(() => {
      request.destroy()
      reject(new Error('Timeout: Le serveur ne répond pas'))
    }, REQUEST_TIMEOUT)
  })
}

/**
 * Parse la réponse de l'API CFX en objet ServerInput
 */
function parseCFXResponse(json: CFXServerResponse, cfxCode: string): ServerInput {
  const serverData = json.Data!
  const vars = serverData.vars || {}
  const resources = serverData.resources || []
  const players = serverData.players || json.players || []

  // Extraire IP et port depuis connectEndPoints
  const connectEndPoints = serverData.connectEndPoints
  const ip = typeof connectEndPoints === 'string' 
    ? connectEndPoints 
    : Array.isArray(connectEndPoints) && connectEndPoints.length > 0
    ? connectEndPoints[0]
    : ''
  const port = DEFAULT_FIVEM_PORT

  console.log("Joueurs trouvés dans l'API:", players.length)

  const bannerUrl = json.ownerAvatar || ''
  console.log('Bannière/Logo trouvé (ownerAvatar):', bannerUrl || 'Aucune')

  const serverInfo: ServerInput = {
    name: serverData.hostname || vars.sv_projectName || 'Serveur FiveM',
    ip,
    port,
    description: vars.sv_projectDesc || serverData.sv_projectDesc || vars.sv_projectName || '',
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
    icon_version: null,
    resources,
    players: players.map((p) => ({
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
    players_count: serverInfo.players?.length || 0
  })

  return serverInfo
}
