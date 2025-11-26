# Tests

Ce dossier contient tous les fichiers de test du projet.

## Structure

La structure des tests suit la structure du code source pour faciliter la correspondance entre les tests et le code testé :

```
tests/
└── main/
    └── utils/
        └── cfxApi.test.ts
```

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests avec couverture de code
npm run test:coverage
```

## Configuration

Les tests sont configurés via `vitest.config.ts` à la racine du projet. La configuration inclut :
- Recherche de fichiers `**/*.{test,spec}.{ts,tsx}`
- Environnement Node.js
- Couverture de code avec V8

