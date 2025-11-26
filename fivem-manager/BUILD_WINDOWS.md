# Build pour Windows

## Build portable (sans installateur)

Pour créer un build portable Windows (dossier `win-unpacked` avec l'exécutable) :

```bash
npm run build:win
```

Le résultat se trouve dans `dist/win-unpacked/fivem-manager.exe`. Vous pouvez distribuer tout le dossier `win-unpacked` tel quel.

## Build avec installateur NSIS

Pour créer un installateur Windows (.exe), vous avez deux options :

### Option 1 : Sur Windows

Si vous êtes sur Windows, exécutez simplement :

```bash
npm run build:win:installer
```

Cela créera un fichier `fivem-manager-1.0.0-setup.exe` dans le dossier `dist/`.

### Option 2 : Sur Linux avec Wine

Si vous êtes sur Linux, vous devez installer Wine pour créer l'installateur :

```bash
# Sur Arch Linux
sudo pacman -S wine

# Sur Ubuntu/Debian
sudo apt-get install wine

# Puis créer l'installateur
npm run build:win:installer
```

## Distribution

### Version portable

1. Compressez le dossier `dist/win-unpacked/` en ZIP
2. Distribuez le fichier ZIP
3. Les utilisateurs devront extraire le ZIP et lancer `fivem-manager.exe`

### Version installateur

1. Distribuez le fichier `dist/fivem-manager-1.0.0-setup.exe`
2. Les utilisateurs peuvent installer l'application comme n'importe quelle application Windows

## Notes

- Le build portable fonctionne sans installation
- L'installateur nécessite Wine sur Linux ou être sur Windows
- La signature de code est désactivée (l'application peut afficher un avertissement Windows Defender)

