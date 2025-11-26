import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchServerFromCFX } from './cfxApi'
import type { CFXServerResponse } from '../types'
import { get } from 'https'

// Mock du module https
vi.mock('https', () => {
  const mockRequest = {
    on: vi.fn(),
    destroy: vi.fn()
  }
  return {
    get: vi.fn((url, options, callback) => {
      return mockRequest
    })
  }
})

describe('cfxApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchServerFromCFX', () => {
    it('devrait parser correctement une réponse CFX valide', async () => {
      const mockResponse: CFXServerResponse = {
        Data: {
          hostname: 'Mon Serveur FiveM',
          connectEndPoints: '127.0.0.1',
          vars: {
            sv_projectName: 'Mon Projet',
            sv_projectDesc: 'Description du serveur',
            sv_maxClients: '32',
            tags: 'roleplay,economy',
            Discord: 'https://discord.gg/test'
          },
          resources: ['resource1', 'resource2'],
          players: [
            { name: 'Joueur 1', id: 1, ping: 50, identifiers: ['steam:123'] },
            { name: 'Joueur 2', id: 2, ping: 30 }
          ],
          clients: 2,
          sv_maxclients: 32
        },
        ownerName: 'Propriétaire',
        ownerAvatar: 'https://example.com/avatar.png',
        lastSeen: '2024-01-01',
        support_status: 'active'
      }

      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify(mockResponse))
          }
          if (event === 'end') {
            handler()
          }
        })
      }

      const mockRequest = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            // Ne pas appeler le handler d'erreur pour ce test
          }
        }),
        destroy: vi.fn()
      }

      vi.mocked(get).mockImplementation((url, options, callback) => {
        if (callback) {
          callback(mockRes as any)
        }
        return mockRequest as any
      })

      const result = await fetchServerFromCFX('abc123')

      expect(result).toBeDefined()
      expect(result.name).toBe('Mon Serveur FiveM')
      expect(result.ip).toBe('127.0.0.1')
      expect(result.port).toBe(30120)
      expect(result.description).toBe('Description du serveur')
      expect(result.max_players).toBe(32)
      expect(result.current_players).toBe(2)
      expect(result.tags).toBe('roleplay,economy')
      expect(result.discord).toBe('https://discord.gg/test')
      expect(result.owner_name).toBe('Propriétaire')
      expect(result.banner_url).toBe('https://example.com/avatar.png')
      expect(result.resources_count).toBe(2)
      expect(result.cfx_code).toBe('abc123')
      expect(result.players).toHaveLength(2)
      expect(result.players![0].name).toBe('Joueur 1')
    })

    it('devrait rejeter avec une erreur si le code HTTP n\'est pas 200', async () => {
      const mockRes = {
        statusCode: 404,
        statusMessage: 'Not Found',
        on: vi.fn()
      }

      const mockRequest = {
        on: vi.fn(),
        destroy: vi.fn()
      }

      vi.mocked(get).mockImplementation((url, options, callback) => {
        if (callback) {
          callback(mockRes as any)
        }
        return mockRequest as any
      })

      await expect(fetchServerFromCFX('invalid')).rejects.toThrow('Erreur HTTP 404')
    })

    it('devrait rejeter avec une erreur si la réponse ne contient pas de Data', async () => {
      const mockResponse: CFXServerResponse = {}

      const mockRes = {
        statusCode: 200,
        statusMessage: 'OK',
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify(mockResponse))
          }
          if (event === 'end') {
            handler()
          }
        })
      }

      const mockRequest = {
        on: vi.fn(),
        destroy: vi.fn()
      }

      vi.mocked(get).mockImplementation((url, options, callback) => {
        if (callback) {
          callback(mockRes as any)
        }
        return mockRequest as any
      })

      await expect(fetchServerFromCFX('abc123')).rejects.toThrow(
        'Serveur non trouvé ou code CFX invalide'
      )
    })

    it('devrait rejeter avec une erreur en cas de timeout', async () => {
      vi.useFakeTimers()

      const mockRequest = {
        on: vi.fn(),
        destroy: vi.fn()
      }

      vi.mocked(get).mockImplementation(() => {
        return mockRequest as any
      })

      const promise = fetchServerFromCFX('abc123')

      // Avancer le temps de 10 secondes pour déclencher le timeout
      vi.advanceTimersByTime(10000)

      await expect(promise).rejects.toThrow('Timeout')

      vi.useRealTimers()
    })
  })
})

