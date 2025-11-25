import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import ServerList from './components/ServerList'
import ServerForm from './components/ServerForm'
import ServerManagement from './components/ServerManagement'
import { Server } from './types'

function AppContent(): React.JSX.Element {
  const { isAuthenticated, user, logout, hasPermission, isLoading: authLoading } = useAuth()
  const [servers, setServers] = useState<Server[]>([])
  const [playerCounts, setPlayerCounts] = useState<Record<number, number>>({})
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const [managingServer, setManagingServer] = useState<Server | null>(null)
  const [showServerForm, setShowServerForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const serversData = await window.api.servers.getAll()
      setServers(serversData)

      // Charger les compteurs de joueurs pour chaque serveur
      const counts: Record<number, number> = {}
      const countPromises = serversData
        .filter(server => server.id)
        .map(async (server) => {
          try {
            const count = await window.api.servers.getPlayerCount(server.id!)
            counts[server.id!] = count
          } catch (error) {
            counts[server.id!] = 0
          }
        })
      
      await Promise.all(countPromises)
      setPlayerCounts(counts)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au démarrage (doit être AVANT tous les return conditionnels)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading])

  // Attendre que l'authentification soit chargée
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page de connexion
  if (!isAuthenticated) {
    return <Login />
  }

  const refreshAllServers = async () => {
    try {
      setLoading(true)
      const serversData = await window.api.servers.getAll()
      let updatedCount = 0
      let errorCount = 0

      // Rafraîchir chaque serveur qui a un code CFX
      for (const server of serversData) {
        if (server.cfx_code && server.id) {
          try {
            // Récupérer les nouvelles informations depuis l'API CFX
            const serverInfo = await window.api.servers.fetchFromCFX(server.cfx_code)
            
            // Mettre à jour le serveur avec les nouvelles informations
            await window.api.servers.update(server.id, {
              name: serverInfo.name,
              ip: serverInfo.ip,
              port: serverInfo.port,
              description: serverInfo.description,
              max_players: serverInfo.max_players,
              current_players: serverInfo.current_players,
              tags: serverInfo.tags,
              discord: serverInfo.discord,
              owner_name: serverInfo.owner_name,
              last_seen: serverInfo.last_seen,
              support_status: serverInfo.support_status,
              resources_count: serverInfo.resources_count,
              cfx_code: serverInfo.cfx_code,
              banner_url: serverInfo.banner_url,
              icon_version: serverInfo.icon_version,
              resources: (serverInfo as any).resources || [],
              players: serverInfo.players || []
            } as any)
            
            updatedCount++
          } catch (error) {
            console.error(`Erreur lors du rafraîchissement du serveur ${server.name}:`, error)
            errorCount++
          }
        }
      }

      // Recharger les données
      await loadData()
      
      if (updatedCount > 0 || errorCount > 0) {
        alert(`${updatedCount} serveur(s) mis à jour${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`)
      } else {
        alert('Aucun serveur avec code CFX trouvé')
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des serveurs:', error)
      alert('Erreur lors du rafraîchissement des serveurs')
      setLoading(false)
    }
  }

  const handleResetDatabase = async () => {
    if (confirm('⚠️ ATTENTION : Voulez-vous vraiment réinitialiser la base de données ?\n\nToutes les données (serveurs et joueurs) seront supprimées de manière permanente.\n\nCette action est irréversible !')) {
      try {
        const result = await window.api.database.reset()
        if (result.success) {
          alert(result.message)
          await loadData()
        }
      } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error)
        alert('Erreur lors de la réinitialisation de la base de données')
      }
    }
  }

  // Gestion des serveurs
  const handleServerSubmit = async (server: Omit<Server, 'id' | 'created_at' | 'updated_at' | 'is_online'>) => {
    try {
      if (editingServer?.id) {
        await window.api.servers.update(editingServer.id, server)
      } else {
        await window.api.servers.create(server)
      }
      await loadData()
      setShowServerForm(false)
      setEditingServer(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du serveur:', error)
      alert('Erreur lors de la sauvegarde du serveur')
    }
  }

  const handleServerEdit = (server: Server) => {
    setEditingServer(server)
    setShowServerForm(true)
  }

  const handleServerDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce serveur ? Les joueurs associés seront également supprimés.')) {
      try {
        await window.api.servers.delete(id)
        await loadData()
      } catch (error) {
        console.error('Erreur lors de la suppression du serveur:', error)
        alert('Erreur lors de la suppression du serveur')
      }
    }
  }

  const handleServerFormCancel = () => {
    setShowServerForm(false)
    setEditingServer(null)
  }

  const handleManagePlayers = (server: Server) => {
    setManagingServer(server)
  }

  const handleCloseServerManagement = () => {
    setManagingServer(null)
    loadData() // Recharger les données pour mettre à jour les compteurs
  }

  // Si on est en mode gestion de serveur, afficher la page de gestion
  if (managingServer) {
    return (
      <ServerManagement
        server={managingServer}
        onBack={handleCloseServerManagement}
        onRefresh={loadData}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚀 FiveM Server Manager</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">Gérez vos serveurs FiveM et leurs joueurs</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                title="Déconnexion"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Section Serveurs */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0 gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Serveurs</h2>
              <div className="flex gap-2 flex-wrap">
                {hasPermission('servers.view') && (
                  <button
                    onClick={refreshAllServers}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Rafraîchir les informations de tous les serveurs (nécessite un code CFX)"
                    disabled={loading}
                  >
                    🔄 Rafraîchir
                  </button>
                )}
                {hasPermission('database.reset') && (
                  <button
                    onClick={handleResetDatabase}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    title="Réinitialiser la base de données"
                  >
                    🗑️ Reset DB
                  </button>
                )}
                {hasPermission('servers.create') && (
                  <button
                    onClick={() => {
                      setEditingServer(null)
                      setShowServerForm(!showServerForm)
                    }}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {showServerForm ? 'Annuler' : '+ Ajouter'}
                  </button>
                )}
              </div>
            </div>

            {showServerForm && (
              <div className="mb-4 flex-shrink-0">
                <ServerForm
                  server={editingServer}
                  onSubmit={handleServerSubmit}
                  onCancel={handleServerFormCancel}
                />
              </div>
            )}

            <div className="flex-1 min-h-0">
              <ServerList
                servers={servers}
                playerCounts={playerCounts}
                onEdit={hasPermission('servers.edit') ? handleServerEdit : undefined}
                onDelete={hasPermission('servers.delete') ? handleServerDelete : undefined}
                onManagePlayers={hasPermission('players.view') ? handleManagePlayers : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
