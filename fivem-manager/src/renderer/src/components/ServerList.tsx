import { Server } from '../types'

interface ServerListProps {
  servers: Server[]
  playerCounts: Record<number, number>
  onEdit: (server: Server) => void
  onDelete: (id: number) => void
  onManagePlayers: (server: Server) => void
}

export default function ServerList({ servers, playerCounts, onEdit, onDelete, onManagePlayers }: ServerListProps): React.JSX.Element {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      <div className="bg-gray-800 text-white px-4 sm:px-6 py-3 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold">Serveurs FiveM</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Statut
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Nom
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                IP:Port
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden md:table-cell">
                Description
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Joueurs
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                  Aucun serveur enregistré
                </td>
              </tr>
            ) : (
              servers.map((server) => {
                const isOnline = server.is_online === 1 || server.is_online === true
                return (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            isOnline ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          title={isOnline ? 'En ligne' : 'Hors ligne'}
                        ></span>
                        <span className="text-xs text-gray-600 hidden sm:inline">
                          {isOnline ? 'En ligne' : 'Hors ligne'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-[150px] sm:max-w-none">{server.name}</div>
                    </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.ip}:{server.port}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500 hidden md:table-cell">
                    <div className="truncate max-w-[200px]">{server.description || '-'}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-medium">{playerCounts[server.id || 0] || 0}</span> joueur{playerCounts[server.id || 0] !== 1 ? 's' : ''}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <button
                        onClick={() => onManagePlayers(server)}
                        className="text-green-600 hover:text-green-900 text-xs sm:text-sm"
                        title="Gérer les joueurs"
                      >
                        Gérer
                      </button>
                      <button
                        onClick={() => onEdit(server)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                        title="Modifier"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => server.id && onDelete(server.id)}
                        className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                        title="Supprimer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

