const Database = require('better-sqlite3')
const path = require('path')
const os = require('os')

function resetDatabase() {
  // Chemin vers la base de données (utiliser le même chemin que dans db.ts)
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

  try {
    const db = new Database(dbPath)

    // Compter les données avant suppression
    const serversCount = db.prepare('SELECT COUNT(*) as count FROM servers').get().count
    const playersCount = db.prepare('SELECT COUNT(*) as count FROM players').get().count

    console.log(`\nDonnées actuelles:`)
    console.log(`  - Serveurs: ${serversCount}`)
    console.log(`  - Joueurs: ${playersCount}`)

    if (serversCount === 0 && playersCount === 0) {
      console.log('\nLa base de données est déjà vide.')
      db.close()
      return
    }

    // Supprimer toutes les données
    console.log('\nSuppression des données...')

    // Supprimer les joueurs (cascade supprimera automatiquement les relations)
    db.prepare('DELETE FROM players').run()
    console.log('  ✓ Joueurs supprimés')

    // Supprimer les serveurs
    db.prepare('DELETE FROM servers').run()
    console.log('  ✓ Serveurs supprimés')

    // Réinitialiser les séquences AUTOINCREMENT
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('servers', 'players')").run()
    console.log('  ✓ Séquences réinitialisées')

    console.log('\n✅ Base de données réinitialisée avec succès!')
    console.log('La base de données est maintenant vide.')

    db.close()
  } catch (error) {
    if (error.code === 'SQLITE_CANTOPEN' || error.message.includes('no such file')) {
      console.log("La base de données n'existe pas encore. Rien à réinitialiser.")
    } else {
      console.error('Erreur lors de la réinitialisation:', error)
      process.exit(1)
    }
  }
}

// Exécuter le script
if (require.main === module) {
  resetDatabase()
}

module.exports = { resetDatabase }
