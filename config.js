// ============================================================
//  CONFIGURATION DU LAUNCHER — c'est le seul fichier à modifier
// ============================================================
module.exports = {
  serverName: 'Pax Imperia RP',

  // Adresse du serveur (connexion automatique au lancement du jeu)
  serverAddress: 'eu-1.magmanode.com:26849',

  // Version de Minecraft et de NeoForge
  minecraftVersion: '1.21.1',
  // Mets la même version de NeoForge que sur ton serveur (ex. '21.1.77'),
  // ou 'latest' pour prendre la dernière version pour 1.21.1.248
  neoforgeVersion: '1.21.1.248',

  // Lien "raw" vers ton fichier mods.json sur GitHub.
  // Remplace TON-PSEUDO et TON-DEPOT par les tiens.
  modsManifestUrl: 'https://raw.githubusercontent.com/slavamelitopol/Launcher-Pax-Imperia/main/mods.json',

  // ID d'application Azure pour la connexion Microsoft.
  // Laisse vide pour utiliser l'ID par défaut de la bibliothèque.
  // Si la connexion échoue, crée ton propre ID (voir README).
  azureClientId: '',

  // Mémoire (en Go)
  ramMin: 4,
  ramDefault: 8,
  ramMax: 14
};
