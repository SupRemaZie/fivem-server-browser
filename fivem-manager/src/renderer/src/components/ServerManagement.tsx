import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Server, Player, User, UserRole, Permission, ROLE_PERMISSIONS } from '../types'

interface ServerManagementProps {
  server: Server
  onBack: () => void
  onRefresh: () => void
}

type Tab = 'logs' | 'players' | 'resources' | 'bans' | 'staff'

export default function ServerManagement({
  server,
  onBack,
  onRefresh
}: ServerManagementProps): React.JSX.Element {
  const {
    hasPermission,
    user: currentUser,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
  } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('players')
  const [players, setPlayers] = useState<Player[]>([])
  const [bannedPlayers, setBannedPlayers] = useState<Player[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [logs, setLogs] = useState<Array<{ id: number; message: string; timestamp: string }>>([])
  const [loading, setLoading] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [playerToBan, setPlayerToBan] = useState<number | null>(null)
  const [banReason, setBanReason] = useState('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [serverStaffIds, setServerStaffIds] = useState<number[]>([]) // IDs des utilisateurs assignés à ce serveur
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<{
    username: string
    password: string
    email: string
    role: UserRole
    permissions: Permission[]
  }>({
    username: '',
    password: '',
    email: '',
    role: 'viewer',
    permissions: []
  })
  const [error, setError] = useState('')

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
        case 'players': {
          const playersData = await window.api.players.getByServerId(server.id)
          setPlayers(playersData)
          break
        }
        case 'bans': {
          const allPlayers = await window.api.players.getByServerId(server.id)
          setBannedPlayers(allPlayers.filter((p) => p.is_banned === 1 || p.is_banned === true))
          break
        }
        case 'resources': {
          const allressources = await window.api.resources.getByServerId(server.id)
          setResources(allressources)
          break
        }
        case 'logs': {
          // Simuler le chargement des logs (à implémenter avec l'API FiveM)
          setLogs([
            { id: 1, message: 'Serveur démarré', timestamp: new Date().toISOString() },
            { id: 2, message: 'Joueur connecté: John Doe', timestamp: new Date().toISOString() },
            { id: 3, message: 'Ressource es_extended chargée', timestamp: new Date().toISOString() }
          ])
          break
        }
        case 'staff': {
          // Charger tous les utilisateurs et ceux assignés à ce serveur
          const usersData = await getAllUsers()
          setAllUsers(usersData)
          const storedStaffIds = localStorage.getItem(`server_staff_${server.id}`)
          if (storedStaffIds) {
            setServerStaffIds(JSON.parse(storedStaffIds))
          } else {
            setServerStaffIds([])
          }
          break
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBanClick = (playerId: number) => {
    setPlayerToBan(playerId)
    setBanReason('')
    setShowBanModal(true)
  }

  const handleBanConfirm = async () => {
    if (!playerToBan) return

    if (banReason.trim() === '') {
      alert('Le motif du ban ne peut pas être vide')
      return
    }

    try {
      await window.api.players.ban(playerToBan, banReason.trim())
      setShowBanModal(false)
      setPlayerToBan(null)
      setBanReason('')
      await loadData()
      onRefresh()
    } catch (error) {
      console.error('Erreur lors du ban:', error)
      alert('Erreur lors du ban du joueur')
    }
  }

  const handleBanCancel = () => {
    setShowBanModal(false)
    setPlayerToBan(null)
    setBanReason('')
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

  // Fonctions pour gérer les utilisateurs
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!userForm.username.trim()) {
      setError("Le nom d'utilisateur est requis")
      return
    }

    if (!editingUser && !userForm.password.trim()) {
      setError('Le mot de passe est requis pour un nouvel utilisateur')
      return
    }

    try {
      if (editingUser && editingUser.id) {
        const updateData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> = {
          username: userForm.username,
          email: userForm.email || undefined,
          role: userForm.role,
          permissions: userForm.permissions.length > 0 ? userForm.permissions : undefined
        }

        if (userForm.password.trim()) {
          ;(updateData as any).password = userForm.password
        }

        await updateUser(editingUser.id, updateData)
      } else {
        await createUser({
          username: userForm.username,
          password: userForm.password,
          email: userForm.email || undefined,
          role: userForm.role,
          permissions: userForm.permissions.length > 0 ? userForm.permissions : undefined
        })
      }

      await loadData()
      handleUserCancel()
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    }
  }

  const handleUserEdit = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
      permissions: user.permissions || ROLE_PERMISSIONS[user.role] || []
    })
    setShowUserModal(true)
    setError('')
  }

  const handleUserDelete = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      await deleteUser(userId)
      // Retirer aussi du serveur si assigné
      if (server.id && serverStaffIds.includes(userId)) {
        const updatedIds = serverStaffIds.filter((id) => id !== userId)
        setServerStaffIds(updatedIds)
        localStorage.setItem(`server_staff_${server.id}`, JSON.stringify(updatedIds))
      }
      await loadData()
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleUserCancel = () => {
    setShowUserModal(false)
    setEditingUser(null)
    setUserForm({
      username: '',
      password: '',
      email: '',
      role: 'viewer',
      permissions: []
    })
    setError('')
  }

  const handleRoleChange = (role: UserRole) => {
    setUserForm((prev) => ({
      ...prev,
      role,
      permissions: ROLE_PERMISSIONS[role] || []
    }))
  }

  const handlePermissionToggle = (permission: Permission) => {
    setUserForm((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
      return { ...prev, permissions }
    })
  }

  const toggleStaffAssignment = (userId: number) => {
    if (!server.id) return

    const isAssigned = serverStaffIds.includes(userId)
    let updatedIds: number[]

    if (isAssigned) {
      updatedIds = serverStaffIds.filter((id) => id !== userId)
    } else {
      updatedIds = [...serverStaffIds, userId]
    }

    setServerStaffIds(updatedIds)
    localStorage.setItem(`server_staff_${server.id}`, JSON.stringify(updatedIds))
  }

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrateur',
      moderator: 'Modérateur',
      support: 'Support',
      viewer: 'Viewer'
    }
    return labels[role]
  }

  const getRoleColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-orange-100 text-orange-800',
      support: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800'
    }
    return colors[role]
  }

  const getServerStaff = (): User[] => {
    return allUsers.filter((user) => user.id && serverStaffIds.includes(user.id))
  }

  const allPermissions: Permission[] = [
    'servers.view',
    'servers.create',
    'servers.edit',
    'servers.delete',
    'players.view',
    'players.ban',
    'players.unban',
    'players.whitelist',
    'players.unwhitelist',
    'staff.view',
    'staff.manage',
    'logs.view',
    'resources.view',
    'resources.manage',
    'database.reset'
  ]

  const permissionLabels: Record<Permission, string> = {
    'servers.view': 'Voir les serveurs',
    'servers.create': 'Créer des serveurs',
    'servers.edit': 'Modifier les serveurs',
    'servers.delete': 'Supprimer les serveurs',
    'players.view': 'Voir les joueurs',
    'players.ban': 'Bannir des joueurs',
    'players.unban': 'Débannir des joueurs',
    'players.whitelist': 'Gérer la whitelist',
    'players.unwhitelist': 'Retirer de la whitelist',
    'staff.view': 'Voir le staff',
    'staff.manage': 'Gérer le staff',
    'logs.view': 'Voir les logs',
    'resources.view': 'Voir les ressources',
    'resources.manage': 'Gérer les ressources',
    'database.reset': 'Réinitialiser la base de données'
  }

  const allTabs = [
    { id: 'logs' as Tab, label: '📋 Logs', icon: '📋', permission: 'logs.view' as const },
    { id: 'players' as Tab, label: '👥 Joueurs', icon: '👥', permission: 'players.view' as const },
    {
      id: 'resources' as Tab,
      label: '📦 Ressources',
      icon: '📦',
      permission: 'resources.view' as const
    },
    { id: 'bans' as Tab, label: '🚫 Bans', icon: '🚫', permission: 'players.view' as const },
    { id: 'staff' as Tab, label: '👔 Staff', icon: '👔', permission: 'staff.view' as const }
  ]

  const tabs = allTabs.filter((tab) => hasPermission(tab.permission))

  // Si aucun onglet n'est accessible, rediriger vers le premier onglet disponible
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

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
            <p className="text-indigo-100 text-sm mt-1">
              {server.ip}:{server.port}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                server.is_online === 1 || server.is_online === true
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    Joueurs ({players.length})
                  </h2>
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
                                {isBanned(player)
                                  ? hasPermission('players.unban') && (
                                      <button
                                        onClick={() => player.id && handleUnban(player.id)}
                                        className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        Débannir
                                      </button>
                                    )
                                  : hasPermission('players.ban') && (
                                      <button
                                        onClick={() => player.id && handleBanClick(player.id)}
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ressources du serveur ({resources.length})
                  </h2>
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    Joueurs bannis ({bannedPlayers.length})
                  </h2>
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motif du ban
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
                          <td colSpan={4} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            Aucun joueur banni
                          </td>
                        </tr>
                      ) : (
                        bannedPlayers.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                              {player.name}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                              {player.ban_reason || (
                                <span className="text-gray-400 italic">Aucun motif renseigné</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                              {player.updated_at
                                ? new Date(player.updated_at).toLocaleDateString('fr-FR')
                                : '-'}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-sm font-medium">
                              {hasPermission('players.unban') && (
                                <button
                                  onClick={() => player.id && handleUnban(player.id)}
                                  className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Débannir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Staff */}
            {activeTab === 'staff' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Membres du staff ({getServerStaff().length} / {allUsers.length})
                  </h2>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setEditingUser(null)
                        setUserForm({
                          username: '',
                          password: '',
                          email: '',
                          role: 'viewer',
                          permissions: []
                        })
                        setShowUserModal(true)
                        setError('')
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      + Créer un utilisateur
                    </button>
                  )}
                </div>
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigné
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom d'utilisateur
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                            Aucun utilisateur
                          </td>
                        </tr>
                      ) : (
                        allUsers.map((user) => {
                          const isAssigned = user.id && serverStaffIds.includes(user.id)
                          const userPermissions =
                            user.permissions && user.permissions.length > 0
                              ? user.permissions
                              : ROLE_PERMISSIONS[user.role] || []

                          return (
                            <tr
                              key={user.id}
                              className={`hover:bg-gray-50 ${isAssigned ? 'bg-green-50' : ''}`}
                            >
                              <td className="px-4 sm:px-6 py-3 text-sm">
                                {hasPermission('staff.manage') ? (
                                  <input
                                    type="checkbox"
                                    checked={isAssigned || false}
                                    onChange={() => user.id && toggleStaffAssignment(user.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <span
                                    className={
                                      isAssigned ? 'text-green-600 font-semibold' : 'text-gray-400'
                                    }
                                  >
                                    {isAssigned ? '✓' : '○'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                                {user.username}
                                {currentUser?.id === user.id && (
                                  <span className="ml-2 text-xs text-gray-500">(Vous)</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">
                                {user.email || '-'}
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                                >
                                  {getRoleLabel(user.role)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {userPermissions.slice(0, 3).map((permission) => (
                                    <span
                                      key={permission}
                                      className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-800"
                                      title={permissionLabels[permission]}
                                    >
                                      {permissionLabels[permission].split(' ')[0]}
                                    </span>
                                  ))}
                                  {userPermissions.length > 3 && (
                                    <span className="px-2 py-1 text-xs text-gray-500">
                                      +{userPermissions.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-3 text-sm font-medium">
                                {currentUser?.role === 'admin' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUserEdit(user)}
                                      className="px-2 sm:px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                      Modifier
                                    </button>
                                    {currentUser?.id !== user.id && (
                                      <button
                                        onClick={() => user.id && handleUserDelete(user.id)}
                                        className="px-2 sm:px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                      >
                                        Supprimer
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal pour le motif de ban */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bannir un joueur</h3>
            </div>
            <div className="px-6 py-4">
              <label htmlFor="banReason" className="block text-sm font-medium text-gray-700 mb-2">
                Motif du ban *
              </label>
              <textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Entrez le motif du ban..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Le motif est obligatoire et sera affiché dans l'onglet Bans.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleBanCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleBanConfirm}
                disabled={banReason.trim() === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour créer/modifier un utilisateur */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
              </h3>
            </div>
            <form onSubmit={handleUserSubmit} className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur *
                </label>
                <input
                  id="username"
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                  required={!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  id="role"
                  value={userForm.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                >
                  <option value="viewer">Viewer</option>
                  <option value="support">Support</option>
                  <option value="moderator">Modérateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Les permissions par défaut du rôle seront appliquées, mais vous pouvez les
                  personnaliser ci-dessous.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions personnalisées
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {allPermissions.map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userForm.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {permissionLabels[permission]}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {userForm.permissions.length} permission(s) sélectionnée(s). Si aucune permission
                  n'est sélectionnée, les permissions par défaut du rôle seront utilisées.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleUserCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
