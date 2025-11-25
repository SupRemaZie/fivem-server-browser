import { useState, useEffect } from 'react'
import { Server, Player } from '../types'

interface ServerManagementProps {
  server: Server
  onBack: () => void
  onRefresh: () => void
}

type Tab = 'logs' | 'players' | 'resources' | 'bans'

export default function ServerManagement({ server, onBack, onRefresh }: ServerManagementProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('players')
  const [players, setPlayers] = useState<Player[]>([])
  const [bannedPlayers, setBannedPlayers] = useState<Player[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [logs, setLogs] = useState<Array<{ id: number; message: string; timestamp: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (server.id) {
      loadData()
    }
  }, [server.id, activeTab])

  const loadData = async () => {
    if (!server.id) return
    try {
      setLoading(true)
      switch (activeTab) {
        case 'players':
          const playersData = await window.api.players.getByServerId(server.id)
          setPlayers(playersData)
          break
        case 'bans':
          const allPlayers = await window.api.players.getByServerId(server.id)
          setBannedPlayers(allPlayers.filter(p => p.is_banned === 1 || p.is_banned === true))
          break
        case 'resources':
          const allressources = await window.api.resources.getByServerId(server.id)
          setResources(allressources)
          break
        case 'logs':
          // Simuler le chargement des logs (à implémenter avec l'API FiveM)
          setLogs([
            { id: 1, message: 'Serveur démarré', timestamp: new Date().toISOString() },
            { id: 2, message: 'Joueur connecté: John Doe', timestamp: new Date().toISOString() },
            { id: 3, message: 'Ressource es_extended chargée', timestamp: new Date().toISOString() }
          ])
          break
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (playerId: number) => {
    if (confirm('Êtes-vous sûr de vouloir bannir ce joueur ?')) {
      try {
        await window.api.players.ban(playerId)
        await loadData()
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
      await loadData()
      onRefresh()
    } catch (error) {
      console.error('Erreur lors du unban:', error)
      alert('Erreur lors du unban du joueur')
    }
  }

  const isBanned = (player: Player): boolean => {
    return player.is_banned === 1 || player.is_banned === true
  }

  const isWhitelisted = (player: Player): boolean => {
    return player.is_whitelisted === 1 || player.is_whitelisted === true
  }

  const tabs = [
    { id: 'logs' as Tab, label: '📋 Logs', icon: '📋' },
    { id: 'players' as Tab, label: '👥 Joueurs', icon: '👥' },
    { id: 'resources' as Tab, label: '📦 Ressources', icon: '📦' },
    { id: 'bans' as Tab, label: '🚫 Bans', icon: '🚫' }
  ]

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 mr-4 text-sm sm:text-base"
            >
              ← Retour
            </button>
            <h1 className="text-xl sm:text-2xl font-bold inline">{server.name}</h1>
            <p className="text-indigo-100 text-sm mt-1">{server.ip}:{server.port}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              server.is_online === 1 || server.is_online === true
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {server.is_online === 1 || server.is_online === true ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Tab: Logs */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Logs du serveur</h2>
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            Aucun log disponible
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 font-mono">
                              {log.message}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Players */}
            {activeTab === 'players' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Joueurs ({players.length})</h2>
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            Aucun joueur enregistré
                          </td>
                        </tr>
                      ) : (
                        players.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                              {player.name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm">
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
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium">
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
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Resources */}
            {activeTab === 'resources' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Ressources du serveur ({resources.length})</h2>
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <div className="p-4 sm:p-6">
                    {resources.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Aucune ressource disponible</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map((resource, index) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{resource}</span>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Actif
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Bans */}
            {activeTab === 'bans' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Joueurs bannis ({bannedPlayers.length})</h2>
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de ban
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bannedPlayers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            Aucun joueur banni
                          </td>
                        </tr>
                      ) : (
                        bannedPlayers.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                              {player.name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                              {player.updated_at ? new Date(player.updated_at).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium">
                              <button
                                onClick={() => player.id && handleUnban(player.id)}
                                className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Débannir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

