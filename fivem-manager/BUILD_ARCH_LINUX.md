# Build Windows depuis Arch Linux

## Situation actuelle

Vous avez déjà un **build portable fonctionnel** dans `dist/win-unpacked/fivem-manager.exe` qui peut être distribué tel quel.

## Options de distribution

### Option 1 : Version portable (Recommandée - Déjà disponible)

Le build portable est **déjà créé** et fonctionne sans Wine :

```bash
# Le build est déjà dans :
dist/win-unpacked/fivem-manager.exe
```

**Pour distribuer :**
1. Compressez le dossier `dist/win-unpacked/` en ZIP
2. Distribuez le fichier ZIP
3. Les utilisateurs Windows extraient et lancent `fivem-manager.exe`

**Avantages :**
- ✅ Pas besoin de Wine
- ✅ Pas besoin d'installateur
- ✅ Application portable (peut être copiée sur clé USB)
- ✅ Déjà fonctionnel

### Option 2 : Installateur Windows (.exe)

Si vous voulez créer un installateur Windows depuis Arch Linux, vous devez installer Wine :

```bash
# Installer Wine sur Arch Linux
sudo pacman -S wine wine-mono wine-gecko

# Initialiser Wine (première fois seulement)
winecfg
# Dans la fenêtre qui s'ouvre, fermez-la simplement

# Créer l'installateur
npm run build:win:installer
```

Cela créera un fichier `dist/fivem-manager-1.0.0-setup.exe` qui est un installateur Windows classique.

## Recommandation

Pour Arch Linux, je recommande d'utiliser la **version portable** qui est déjà disponible. Elle fonctionne parfaitement et ne nécessite pas Wine.

Si vous avez vraiment besoin d'un installateur, vous pouvez :
1. Installer Wine (comme indiqué ci-dessus)
2. Ou transférer le dossier `dist/win-unpacked/` sur une machine Windows et créer l'installateur là-bas avec `npm run build:win:installer`

## Vérification du build actuel

```bash
# Vérifier que l'exécutable existe
ls -lh dist/win-unpacked/fivem-manager.exe

# Taille du dossier
du -sh dist/win-unpacked/
```

Le build portable est **prêt à être distribué** ! 🎉

