import { Socket } from 'net'
import { request } from 'http'

const HTTP_TIMEOUT = 2000
const TCP_TIMEOUT = 2000

/**
 * Vérifie si un serveur FiveM est en ligne
 * Essaie d'abord l'API HTTP FiveM (port +1), puis le port TCP direct
 */
export function checkServerStatus(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const httpPort = port + 1

    // Essayer d'abord l'API HTTP FiveM
    const httpReq = request(
      {
        hostname: ip,
        port: httpPort,
        path: '/info.json',
        method: 'GET',
        timeout: HTTP_TIMEOUT
      },
      (res) => {
        // Si on reçoit une réponse (même erreur 404), le serveur est en ligne
        resolve(res.statusCode !== undefined)
        res.destroy()
      }
    )

    httpReq.on('error', () => {
      // Si l'API HTTP échoue, essayer une connexion TCP simple
      tryTcpConnection(ip, port, resolve)
    })

    httpReq.on('timeout', () => {
      httpReq.destroy()
      // Essayer TCP en fallback
      tryTcpConnection(ip, port, resolve)
    })

    httpReq.end()
  })
}

/**
 * Tente une connexion TCP simple pour vérifier si le serveur répond
 */
function tryTcpConnection(ip: string, port: number, resolve: (value: boolean) => void): void {
  const socket = new Socket()
  
  socket.setTimeout(TCP_TIMEOUT)
  
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
}

