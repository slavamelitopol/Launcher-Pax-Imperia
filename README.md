# Launcher Pax Imperia RP

Launcher Minecraft 1.21.1 NeoForge pour le serveur Pax Imperia RP.
Il gère la connexion Microsoft, installe NeoForge, synchronise les mods
depuis GitHub et connecte directement le joueur au serveur.

## 1. Mettre le projet sur GitHub

Crée un dépôt (par exemple `pax-imperia-launcher`) et envoie tous ces fichiers dedans.

## 2. Configurer

Ouvre `config.js` et remplace `TON-PSEUDO/TON-DEPOT` par ton pseudo GitHub et le nom du dépôt.
Mets aussi la version exacte de NeoForge de ton serveur dans `neoforgeVersion`.

## 3. Héberger les mods

1. Sur GitHub, va dans **Releases > Create a new release**, tag `mods`, et glisse tous les `.jar` de ton modpack (sans espaces dans les noms).
2. Sur ton PC, installe Node.js puis lance :
   `node tools/generer-mods-json.js C:\chemin\vers\tes\mods https://github.com/TON-PSEUDO/TON-DEPOT/releases/download/mods/`
3. Envoie le `mods.json` généré sur GitHub (il remplace l'exemple).

Pour ajouter ou retirer un mod plus tard : modifie la release, régénère `mods.json`, renvoie-le. Les joueurs sont mis à jour au prochain lancement, sans réinstaller le launcher.

Tout mod présent chez un joueur mais absent de `mods.json` est supprimé au lancement.

## 4. Compiler le launcher (automatique)

Sur GitHub, onglet **Actions > Compiler le launcher > Run workflow**.
Au bout de quelques minutes, l'installateur `.exe` est téléchargeable dans les « Artifacts ».

Pour publier une version officielle : crée un tag `v1.0.0`. L'installateur est alors attaché à une Release que tu peux partager à tes joueurs.

## 5. Tester en local (facultatif)

    npm install
    npm start

## Connexion Microsoft

Par défaut le launcher utilise l'identifiant d'application fourni par la bibliothèque `minecraft-java-core`.
Si la connexion échoue, crée ta propre application sur le portail Azure (App registrations),
puis colle son « Application (client) ID » dans `azureClientId` de `config.js`.
Microsoft peut demander une validation avant qu'une nouvelle application puisse accéder à Minecraft.

## Limite importante

Le launcher contrôle les mods de ceux qui l'utilisent, mais un joueur peut toujours
rejoindre le serveur avec un autre launcher. Pour l'empêcher, il faut une vérification
côté serveur (un mod NeoForge dédié).
