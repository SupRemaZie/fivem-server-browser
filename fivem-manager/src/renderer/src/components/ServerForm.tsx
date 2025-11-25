import { useState, useEffect } from 'react'
import { Server } from '../types'

interface ServerFormProps {
  server?: Server | null
  onSubmit: (server: Omit<Server, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}

export default function ServerForm({ server, onSubmit, onCancel }: ServerFormProps): React.JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: 30120,
    description: '',
    max_players: 0,
    current_players: 0,
    tags: '',
    discord: '',
    owner_name: '',
    last_seen: '',
    support_status: '',
    resources_count: 0,
    cfx_code: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cfxCode, setCfxCode] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || '',
        ip: server.ip || '',
        port: server.port || 30120,
        description: server.description || '',
        max_players: server.max_players || 0,
        current_players: server.current_players || 0,
        tags: server.tags || '',
        discord: server.discord || '',
        owner_name: server.owner_name || '',
        last_seen: server.last_seen || '',
        support_status: server.support_status || '',
        resources_count: server.resources_count || 0,
        cfx_code: server.cfx_code || ''
      })
    } else {
      setFormData({
        name: '',
        ip: '',
        port: 30120,
        description: '',
        max_players: 0,
        current_players: 0,
        tags: '',
        discord: '',
        owner_name: '',
        last_seen: '',
        support_status: '',
        resources_count: 0,
        cfx_code: ''
      })
    }
    setCfxCode('')
    setFetchError(null)
  }, [server])

  const handleFetchFromCFX = async () => {
    if (!cfxCode.trim()) {
      setFetchError('Veuillez entrer un code CFX')
      return
    }

    setIsFetching(true)
    setFetchError(null)

    try {
      const serverInfo = await window.api.servers.fetchFromCFX(cfxCode.trim())
      setFormData({
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
        cfx_code: serverInfo.cfx_code
      })
      setCfxCode('') // Réinitialiser le champ après succès
    } catch (error) {
      setFetchError((error as Error).message || 'Erreur lors de la récupération des informations')
      console.error('Erreur:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ 
        name: '', 
        ip: '', 
        port: 30120, 
        description: '',
        max_players: 0,
        current_players: 0,
        tags: '',
        discord: '',
        owner_name: '',
        last_seen: '',
        support_status: '',
        resources_count: 0,
        cfx_code: ''
      })
      setCfxCode('')
      setFetchError(null)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        {server ? 'Modifier le serveur' : 'Ajouter un serveur'}
      </h3>
      
      {!server && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <label htmlFor="cfxCode" className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Ajouter via code CFX (optionnel)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="cfxCode"
              value={cfxCode}
              onChange={(e) => setCfxCode(e.target.value)}
              placeholder="Ex: dl5zpy"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleFetchFromCFX()
                }
              }}
            />
            <button
              type="button"
              onClick={handleFetchFromCFX}
              disabled={isFetching || !cfxCode.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetching ? 'Chargement...' : 'Récupérer'}
            </button>
          </div>
          {fetchError && (
            <p className="mt-2 text-sm text-red-600">{fetchError}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Entrez le code CFX du serveur (visible dans l'URL FiveM) pour récupérer automatiquement les informations
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ip" className="block text-sm font-medium text-gray-700 mb-1">
              IP *
            </label>
            <input
              type="text"
              id="ip"
              required
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              placeholder="127.0.0.1"
            />
          </div>
          <div>
            <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
              Port *
            </label>
            <input
              type="number"
              id="port"
              required
              min="1"
              max="65535"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 3000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : server ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  )
}

