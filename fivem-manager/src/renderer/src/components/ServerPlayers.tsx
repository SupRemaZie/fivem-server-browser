import { useState, useEffect } from 'react'
import { Server, Player } from '../types'
import { useAuth } from '../context/AuthContext'

interface ServerPlayersProps {
  server: Server
  onClose: () => void
  onRefresh: () => void
}

export default function ServerPlayers({
  server,
  onClose,
  onRefresh
}: ServerPlayersProps): React.JSX.Element {
  const { user: currentUser } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()
  }, [server.id])

  const loadPlayers = async () => {
    if (!server.id) return
    try {
      setLoading(true)
      const playersData = await window.api.players.getByServerId(server.id)
      setPlayers(playersData)
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (playerId: number) => {
    if (confirm('Êtes-vous sûr de vouloir bannir ce joueur ?')) {
      try {
        await window.api.players.ban(playerId, 'Banni depuis la liste des joueurs', currentUser?.id)
        await loadPlayers()
        onRefresh()
      } catch (error) {
        console.error('Erreur lors du ban:', error)
        alert('Erreur lors du ban du joueur')
      }
    }
  }

  const handleUnban = async (playerId: number) => {
    try {
      await window.api.players.unban(playerId)
      await loadPlayers()
      onRefresh()
    } catch (error) {
      console.error('Erreur lors du unban:', error)
      alert('Erreur lors du unban du joueur')
    }
  }

  const handleWhitelist = async (playerId: number) => {
    try {
      await window.api.players.whitelist(playerId)
      await loadPlayers()
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de l'ajout à la whitelist:", error)
      alert("Erreur lors de l'ajout à la whitelist")
    }
  }

  const handleUnwhitelist = async (playerId: number) => {
    try {
      await window.api.players.unwhitelist(playerId)
      await loadPlayers()
      onRefresh()
    } catch (error) {
      console.error('Erreur lors du retrait de la whitelist:', error)
      alert('Erreur lors du retrait de la whitelist')
    }
  }

  const isBanned = (player: Player): boolean => {
    return player.is_banned === 1 || player.is_banned === true
  }

  const isWhitelisted = (player: Player): boolean => {
    return player.is_whitelisted === 1 || player.is_whitelisted === true
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestion des joueurs</h2>
            <p className="text-indigo-100 mt-1">
              {server.name} ({server.ip}:{server.port})
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl font-bold">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des joueurs...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun joueur enregistré pour ce serveur
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                        <div className="truncate max-w-[200px] sm:max-w-none">{player.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {isBanned(player) ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Banni
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          )}
                          {isWhitelisted(player) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Whitelist
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          {isBanned(player) ? (
                            <button
                              onClick={() => player.id && handleUnban(player.id)}
                              className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Débannir
                            </button>
                          ) : (
                            <button
                              onClick={() => player.id && handleBan(player.id)}
                              className="px-2 sm:px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Bannir
                            </button>
                          )}
                          {isWhitelisted(player) ? (
                            <button
                              onClick={() => player.id && handleUnwhitelist(player.id)}
                              className="px-2 sm:px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Retirer WL
                            </button>
                          ) : (
                            <button
                              onClick={() => player.id && handleWhitelist(player.id)}
                              className="px-2 sm:px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Ajouter WL
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
