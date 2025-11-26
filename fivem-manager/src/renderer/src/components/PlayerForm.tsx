import { useState, useEffect } from 'react'
import { Player, Server } from '../types'

interface PlayerFormProps {
  player?: Player | null
  servers: Server[]
  onSubmit: (
    player: Omit<
      Player,
      'id' | 'created_at' | 'updated_at' | 'server_name' | 'server_ip' | 'server_port'
    >
  ) => Promise<void>
  onCancel: () => void
}

export default function PlayerForm({
  player,
  servers,
  onSubmit,
  onCancel
}: PlayerFormProps): React.JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    server_id: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        server_id: player.server_id || 0
      })
    } else {
      setFormData({
        name: '',
        server_id: servers.length > 0 ? servers[0].id || 0 : 0
      })
    }
  }, [player, servers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.server_id === 0) {
      alert('Veuillez sélectionner un serveur')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ name: '', server_id: servers.length > 0 ? servers[0].id || 0 : 0 })
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        {player ? 'Modifier le joueur' : 'Ajouter un joueur'}
      </h3>
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
        <div>
          <label htmlFor="server_id" className="block text-sm font-medium text-gray-700 mb-1">
            Serveur *
          </label>
          <select
            id="server_id"
            required
            value={formData.server_id}
            onChange={(e) => setFormData({ ...formData, server_id: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
            disabled={servers.length === 0}
          >
            {servers.length === 0 ? (
              <option value="0">Aucun serveur disponible</option>
            ) : (
              <>
                <option value="0">Sélectionner un serveur</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.ip}:{server.port})
                  </option>
                ))}
              </>
            )}
          </select>
          {servers.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">Veuillez d'abord ajouter un serveur</p>
          )}
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
            disabled={isSubmitting || servers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : player ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  )
}
