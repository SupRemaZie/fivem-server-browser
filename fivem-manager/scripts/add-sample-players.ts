import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

// Noms de joueurs de test
const samplePlayerNames = [
  'John_Doe',
  'Jane_Smith',
  'Mike_Johnson',
  'Sarah_Williams',
  'David_Brown',
  'Emily_Davis',
  'Chris_Wilson',
  'Jessica_Martinez',
  'Ryan_Anderson',
  'Amanda_Taylor',
  'Kevin_Thomas',
  'Lisa_Jackson',
  'Daniel_White',
  'Michelle_Harris',
  'James_Martin',
  'Jennifer_Garcia',
  'Robert_Rodriguez',
  'Nicole_Lewis',
  'William_Walker',
  'Stephanie_Hall'
]

async function addSamplePlayers() {
  // Chemin vers la base de données
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'fivem-manager.db')

  console.log('Connexion à la base de données:', dbPath)

  const db = new Database(dbPath)

  try {
    // Récupérer tous les serveurs
    const servers = db.prepare('SELECT id, name FROM servers').all() as Array<{ id: number; name: string }>

    if (servers.length === 0) {
      console.log('Aucun serveur trouvé dans la base de données.')
      return
    }

    console.log(`Trouvé ${servers.length} serveur(s):`)
    servers.forEach(server => {
      console.log(`  - ${server.name} (ID: ${server.id})`)
    })

    // Pour chaque serveur, ajouter des joueurs
    const insertPlayer = db.prepare('INSERT INTO players (name, server_id, is_banned, is_whitelisted) VALUES (?, ?, ?, ?)')

    let totalAdded = 0

    for (const server of servers) {
      // Ajouter 5-10 joueurs aléatoires par serveur
      const numPlayers = Math.floor(Math.random() * 6) + 5 // Entre 5 et 10 joueurs
      const shuffledNames = [...samplePlayerNames].sort(() => Math.random() - 0.5)

      console.log(`\nAjout de ${numPlayers} joueurs au serveur "${server.name}"...`)

      for (let i = 0; i < numPlayers && i < shuffledNames.length; i++) {
        const name = shuffledNames[i]
        // 10% de chance d'être banni, 20% de chance d'être whitelisté
        const isBanned = Math.random() < 0.1 ? 1 : 0
        const isWhitelisted = Math.random() < 0.2 ? 1 : 0

        try {
          insertPlayer.run(name, server.id, isBanned, isWhitelisted)
          console.log(`  ✓ ${name}${isBanned ? ' (BANNI)' : ''}${isWhitelisted ? ' (WHITELIST)' : ''}`)
          totalAdded++
        } catch (error) {
          console.error(`  ✗ Erreur lors de l'ajout de ${name}:`, error)
        }
      }
    }

    console.log(`\n✅ Total: ${totalAdded} joueur(s) ajouté(s) avec succès!`)
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    db.close()
  }
}

// Exécuter le script
if (require.main === module) {
  // Si exécuté directement, initialiser Electron app
  app.whenReady().then(() => {
    addSamplePlayers().then(() => {
      app.quit()
    })
  })
}

export { addSamplePlayers }

