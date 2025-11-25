import { Server } from '../types'

interface ServerListProps {
  servers: Server[]
  playerCounts: Record<number, number>
  onEdit?: (server: Server) => void
  onDelete?: (id: number) => void
  onManagePlayers?: (server: Server) => void
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
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Statut
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Nom
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden lg:table-cell">
                IP:Port
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden xl:table-cell">
                Description
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Joueurs
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden lg:table-cell">
                Tags
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden xl:table-cell">
                Discord
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10 hidden 2xl:table-cell">
                Propriétaire
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                  Aucun serveur enregistré
                </td>
              </tr>
            ) : (
              servers.map((server) => {
                const isOnline = server.is_online === 1 || server.is_online === true
                const currentPlayers = server.current_players ?? playerCounts[server.id || 0] ?? 0
                const maxPlayers = server.max_players ?? 0
                const tags = server.tags ? server.tags.split(',').slice(0, 3).join(', ') : '-'
                const discord = server.discord || '-'
                const ownerName = server.owner_name || '-'
                
                return (
                  <tr key={server.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
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
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-[150px] sm:max-w-none" title={server.name}>
                        {server.name}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {server.ip}:{server.port}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 hidden xl:table-cell">
                      <div className="truncate max-w-[200px]" title={server.description || ''}>
                        {server.description || '-'}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {currentPlayers}{maxPlayers > 0 ? `/${maxPlayers}` : ''}
                        </span>
                        {server.resources_count !== undefined && server.resources_count > 0 && (
                          <span className="text-xs text-gray-400">
                            {server.resources_count} ressources
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 hidden lg:table-cell">
                      <div className="truncate max-w-[150px]" title={server.tags || ''}>
                        {tags}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 hidden xl:table-cell">
                      <div className="truncate max-w-[150px]" title={discord}>
                        {discord !== '-' ? (
                          <a 
                            href={discord.startsWith('http') ? discord : `https://${discord}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {discord.replace(/^https?:\/\//, '').substring(0, 20)}...
                          </a>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 hidden 2xl:table-cell">
                      <div className="truncate max-w-[120px]" title={ownerName}>
                        {ownerName}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {onManagePlayers && (
                          <button
                            onClick={() => onManagePlayers(server)}
                            className="text-green-600 hover:text-green-900 text-xs sm:text-sm"
                            title="Gérer les joueurs"
                          >
                            Gérer
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(server)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs sm:text-sm"
                            title="Modifier"
                          >
                            Modifier
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => server.id && onDelete(server.id)}
                            className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        )}
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

