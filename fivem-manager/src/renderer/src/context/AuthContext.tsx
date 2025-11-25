import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole, Permission, ROLE_PERMISSIONS } from '../types'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  isAuthenticated: boolean
  isLoading: boolean
  // Gestion des utilisateurs (admin seulement)
  getAllUsers: () => Promise<User[]>
  createUser: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<User>
  updateUser: (id: number, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) => Promise<User>
  deleteUser: (id: number) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setIsLoading(false)
  }, [])

  // Sauvegarder l'utilisateur dans localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [user])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Récupérer les utilisateurs depuis localStorage
      const storedUsers = localStorage.getItem('users')
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : []

      // Si aucun utilisateur n'existe, créer un admin par défaut
      if (users.length === 0) {
        const defaultAdmin: User = {
          id: 1,
          username: 'admin',
          password: 'admin', // En production, utiliser un hash
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        users.push(defaultAdmin)
        localStorage.setItem('users', JSON.stringify(users))
      }

      // Rechercher l'utilisateur
      const foundUser = users.find(
        u => u.username === username && u.password === password
      )

      if (foundUser) {
        // Créer une copie sans le mot de passe
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword as User)
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
  }

  const getUserPermissions = (): Permission[] => {
    if (!user) return []
    
    // Si l'utilisateur a des permissions personnalisées, les utiliser
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions
    }
    
    // Sinon, utiliser les permissions par défaut du rôle
    return ROLE_PERMISSIONS[user.role] || []
  }

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    const permissions = getUserPermissions()
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Fonctions de gestion des utilisateurs (admin seulement)
  const getAllUsers = async (): Promise<User[]> => {
    try {
      const storedUsers = localStorage.getItem('users')
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : []
      // Retourner les utilisateurs sans les mots de passe
      return users.map(({ password: _, ...userWithoutPassword }) => userWithoutPassword as User)
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      return []
    }
  }

  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
    try {
      const storedUsers = localStorage.getItem('users')
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : []
      
      // Vérifier si le nom d'utilisateur existe déjà
      if (users.some(u => u.username === userData.username)) {
        throw new Error('Ce nom d\'utilisateur existe déjà')
      }

      const newUser: User = {
        ...userData,
        id: users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))

      // Retourner sans le mot de passe
      const { password: _, ...userWithoutPassword } = newUser
      return userWithoutPassword as User
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      throw error
    }
  }

  const updateUser = async (id: number, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> => {
    try {
      const storedUsers = localStorage.getItem('users')
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : []
      
      const userIndex = users.findIndex(u => u.id === id)
      if (userIndex === -1) {
        throw new Error('Utilisateur non trouvé')
      }

      // Vérifier si le nom d'utilisateur existe déjà (sauf pour l'utilisateur actuel)
      if (userData.username && users.some((u, index) => u.username === userData.username && index !== userIndex)) {
        throw new Error('Ce nom d\'utilisateur existe déjà')
      }

      const updatedUser: User = {
        ...users[userIndex],
        ...userData,
        id,
        updated_at: new Date().toISOString()
      }

      users[userIndex] = updatedUser
      localStorage.setItem('users', JSON.stringify(users))

      // Si l'utilisateur modifié est l'utilisateur connecté, mettre à jour l'état
      if (user && user.id === id) {
        const { password: _, ...userWithoutPassword } = updatedUser
        setUser(userWithoutPassword as User)
      }

      // Retourner sans le mot de passe
      const { password: _, ...userWithoutPassword } = updatedUser
      return userWithoutPassword as User
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
      throw error
    }
  }

  const deleteUser = async (id: number): Promise<boolean> => {
    try {
      const storedUsers = localStorage.getItem('users')
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : []
      
      // Ne pas permettre la suppression de l'utilisateur connecté
      if (user && user.id === id) {
        throw new Error('Vous ne pouvez pas supprimer votre propre compte')
      }

      const filteredUsers = users.filter(u => u.id !== id)
      if (filteredUsers.length === users.length) {
        throw new Error('Utilisateur non trouvé')
      }

      localStorage.setItem('users', JSON.stringify(filteredUsers))
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAuthenticated: !!user,
        isLoading,
        getAllUsers,
        createUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

