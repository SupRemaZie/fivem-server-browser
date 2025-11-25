const Database = require('better-sqlite3')
const path = require('path')
const os = require('os')

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

function addSamplePlayers() {
  // Chemin vers la base de données (utiliser le même chemin que dans db.ts)
  // Sur Linux: ~/.config/fivem-manager/fivem-manager.db
  // Sur Windows: %APPDATA%/fivem-manager/fivem-manager.db
  // Sur macOS: ~/Library/Application Support/fivem-manager/fivem-manager.db
  const platform = process.platform
  let userDataPath
  
  if (platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA || os.homedir(), 'fivem-manager')
  } else if (platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'fivem-manager')
  } else {
    userDataPath = path.join(os.homedir(), '.config', 'fivem-manager')
  }
  
  const dbPath = path.join(userDataPath, 'fivem-manager.db')

  console.log('Connexion à la base de données:', dbPath)

  const db = new Database(dbPath)

  try {
    // Récupérer tous les serveurs
    const servers = db.prepare('SELECT id, name FROM servers').all()

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
          const status = []
          if (isBanned) status.push('BANNI')
          if (isWhitelisted) status.push('WHITELIST')
          console.log(`  ✓ ${name}${status.length > 0 ? ' (' + status.join(', ') + ')' : ''}`)
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

// Script simple qui peut être exécuté directement avec node
if (require.main === module) {
  addSamplePlayers()
}

module.exports = { addSamplePlayers }

