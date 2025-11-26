import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, UserRole, Permission, ROLE_PERMISSIONS } from '../types'

export default function UserManagement(): React.JSX.Element {
  const { getAllUsers, createUser, updateUser, deleteUser, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<{
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
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await getAllUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role,
      permissions: ROLE_PERMISSIONS[role] || []
    }))
  }

  const handlePermissionToggle = (permission: Permission) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission]
      return { ...prev, permissions }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim()) {
      setError("Le nom d'utilisateur est requis")
      return
    }

    if (!editingUser && !formData.password.trim()) {
      setError('Le mot de passe est requis pour un nouvel utilisateur')
      return
    }

    try {
      if (editingUser && editingUser.id) {
        const updateData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> = {
          username: formData.username,
          email: formData.email || undefined,
          role: formData.role,
          permissions: formData.permissions.length > 0 ? formData.permissions : undefined
        }

        if (formData.password.trim()) {
          ;(updateData as any).password = formData.password
        }

        await updateUser(editingUser.id, updateData)
      } else {
        await createUser({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          role: formData.role,
          permissions: formData.permissions.length > 0 ? formData.permissions : undefined
        })
      }

      await loadUsers()
      handleCancel()
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
      permissions: user.permissions || ROLE_PERMISSIONS[user.role] || []
    })
    setShowModal(true)
    setError('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      await deleteUser(id)
      await loadUsers()
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'viewer',
      permissions: []
    })
    setError('')
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Gestion des utilisateurs ({users.length})
        </h2>
        <button
          onClick={() => {
            setEditingUser(null)
            setFormData({
              username: '',
              password: '',
              email: '',
              role: 'viewer',
              permissions: []
            })
            setShowModal(true)
            setError('')
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          + Ajouter un utilisateur
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                      {user.username}
                      {currentUser?.id === user.id && (
                        <span className="ml-2 text-xs text-gray-500">(Vous)</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(user.permissions && user.permissions.length > 0
                          ? user.permissions
                          : ROLE_PERMISSIONS[user.role] || []
                        )
                          .slice(0, 3)
                          .map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-800"
                              title={permissionLabels[permission]}
                            >
                              {permissionLabels[permission].split(' ')[0]}
                            </span>
                          ))}
                        {(user.permissions && user.permissions.length > 0
                          ? user.permissions
                          : ROLE_PERMISSIONS[user.role] || []
                        ).length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +
                            {(user.permissions && user.permissions.length > 0
                              ? user.permissions
                              : ROLE_PERMISSIONS[user.role] || []
                            ).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-2 sm:px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Modifier
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => user.id && handleDelete(user.id)}
                            className="px-2 sm:px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Supprimer
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
      )}

      {/* Modal pour créer/modifier un utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
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
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
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
                  value={formData.role}
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
                        checked={formData.permissions.includes(permission)}
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
                  {formData.permissions.length} permission(s) sélectionnée(s). Si aucune permission
                  n'est sélectionnée, les permissions par défaut du rôle seront utilisées.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
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
