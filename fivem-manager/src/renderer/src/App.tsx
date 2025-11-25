import { useState, useEffect } from 'react'
import ServerList from './components/ServerList'
import ServerForm from './components/ServerForm'
import ServerManagement from './components/ServerManagement'
import { Server } from './types'

function App(): React.JSX.Element {
  const [servers, setServers] = useState<Server[]>([])
  const [playerCounts, setPlayerCounts] = useState<Record<number, number>>({})
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const [managingServer, setManagingServer] = useState<Server | null>(null)
  const [showServerForm, setShowServerForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // Charger les données au démarrage
  useEffect(() => {
    loadData()
    // Vérifier l'état de tous les serveurs au chargement
    checkAllServersStatus()
  }, [])

  const checkAllServersStatus = async () => {
    try {
      await window.api.servers.checkAllStatus()
      await loadData() // Recharger pour mettre à jour les états
    } catch (error) {
      console.error('Erreur lors de la vérification des statuts:', error)
    }
  }

  const handleAddSamplePlayers = async () => {
    if (confirm('Voulez-vous ajouter des joueurs de test à tous les serveurs ?')) {
      try {
        const result = await window.api.servers.addSamplePlayers()
        if (result.success) {
          alert(result.message)
          await loadData()
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout des joueurs:', error)
        alert('Erreur lors de l\'ajout des joueurs')
      }
    }
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚀 FiveM Server Manager</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Gérez vos serveurs FiveM et leurs joueurs</p>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Section Serveurs */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0 gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Serveurs</h2>
              <div className="flex gap-2">
                <button
                  onClick={checkAllServersStatus}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Vérifier l'état de tous les serveurs"
                >
                  🔄 Vérifier
                </button>
                <button
                  onClick={handleAddSamplePlayers}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  title="Ajouter des joueurs de test"
                >
                  👥 Ajouter joueurs
                </button>
                <button
                  onClick={() => {
                    setEditingServer(null)
                    setShowServerForm(!showServerForm)
                  }}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  {showServerForm ? 'Annuler' : '+ Ajouter'}
                </button>
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
                onEdit={handleServerEdit}
                onDelete={handleServerDelete}
                onManagePlayers={handleManagePlayers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
