const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Launch, Microsoft } = require('minecraft-java-core');
const config = require('./config');

let win;
const gameDir = path.join(app.getPath('appData'), '.pax-imperia-rp');
const accountFile = path.join(app.getPath('userData'), 'account.json');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

// ---------- Petits utilitaires ----------
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function sha1(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}
function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

// ---------- Fenêtre ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    resizable: false,
    frame: false,
    backgroundColor: '#230C1D',
    title: config.serverName,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.on('window:minimize', () => win.minimize());
ipcMain.on('window:close', () => win.close());
ipcMain.on('open:folder', () => {
  fs.mkdirSync(gameDir, { recursive: true });
  shell.openPath(gameDir);
});

// ---------- Réglages ----------
ipcMain.handle('config:get', () => ({
  serverName: config.serverName,
  serverAddress: config.serverAddress,
  minecraftVersion: config.minecraftVersion,
  ramMin: config.ramMin,
  ramMax: config.ramMax,
  ram: readJson(settingsFile, {}).ram || config.ramDefault
}));
ipcMain.handle('settings:ram', (_e, ram) => {
  const s = readJson(settingsFile, {});
  s.ram = ram;
  writeJson(settingsFile, s);
});

// ---------- Compte Microsoft ----------
ipcMain.handle('account:get', async () => {
  const saved = readJson(accountFile, null);
  if (!saved) return null;
  try {
    const refreshed = await new Microsoft(config.azureClientId).refresh(saved);
    if (!refreshed || refreshed.error) return null;
    writeJson(accountFile, refreshed);
    return { name: refreshed.name, uuid: refreshed.uuid };
  } catch {
    return null;
  }
});

ipcMain.handle('account:login', async () => {
  const account = await new Microsoft(config.azureClientId).getAuth('electron');
  if (!account || account.error) {
    throw new Error('La connexion Microsoft a échoué ou a été annulée.');
  }
  writeJson(accountFile, account);
  return { name: account.name, uuid: account.uuid };
});

ipcMain.handle('account:logout', () => {
  if (fs.existsSync(accountFile)) fs.unlinkSync(accountFile);
});

// ---------- Synchronisation des mods ----------
// Le launcher garde le dossier mods identique à mods.json :
// il télécharge les mods manquants ou modifiés et supprime tous les autres.
async function syncMods() {
  send('status', 'Vérification de la liste des mods…');
  const res = await fetch(`${config.modsManifestUrl}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Impossible de récupérer mods.json (erreur ${res.status}).`);
  const manifest = await res.json();
  const mods = manifest.mods || [];

  const modsDir = path.join(gameDir, 'mods');
  fs.mkdirSync(modsDir, { recursive: true });

  const wanted = new Set(mods.map(m => m.name));
  for (const file of fs.readdirSync(modsDir)) {
    if (!wanted.has(file)) {
      fs.rmSync(path.join(modsDir, file), { recursive: true, force: true });
    }
  }

  let done = 0;
  for (const mod of mods) {
    done++;
    const dest = path.join(modsDir, mod.name);
    if (fs.existsSync(dest) && (!mod.sha1 || sha1(fs.readFileSync(dest)) === mod.sha1)) {
      send('progress', { done, total: mods.length, label: 'Mods' });
      continue;
    }
    send('status', `Téléchargement de ${mod.name}`);
    const r = await fetch(mod.url);
    if (!r.ok) throw new Error(`Téléchargement impossible : ${mod.name} (erreur ${r.status}).`);
    const buffer = Buffer.from(await r.arrayBuffer());
    if (mod.sha1 && sha1(buffer) !== mod.sha1) {
      throw new Error(`Le fichier ${mod.name} est corrompu. Relance le launcher.`);
    }
    fs.writeFileSync(dest, buffer);
    send('progress', { done, total: mods.length, label: 'Mods' });
  }
}

// ---------- Lancement du jeu ----------
ipcMain.handle('game:launch', async () => {
  const account = readJson(accountFile, null);
  if (!account) throw new Error('Connecte-toi avec ton compte Microsoft avant de jouer.');

  await syncMods();

  const ram = readJson(settingsFile, {}).ram || config.ramDefault;
  const launcher = new Launch();
  let started = false;

  launcher.on('progress', (progress, size) => {
    send('progress', { done: progress, total: size, label: 'Minecraft' });
  });
  launcher.on('check', (progress, size) => {
    send('progress', { done: progress, total: size, label: 'Vérification' });
  });
  launcher.on('extract', () => send('status', 'Extraction des fichiers…'));
  launcher.on('patch', () => send('status', 'Installation de NeoForge…'));
  launcher.on('data', line => {
    if (!started) {
      started = true;
      send('status', 'Le jeu est lancé. Bon jeu !');
      setTimeout(() => win && win.hide(), 3000);
    }
    process.stdout.write(line);
  });
  launcher.on('close', () => {
    if (win) win.show();
    send('closed');
  });
  launcher.on('error', err => {
    if (win) win.show();
    send('error', (err && (err.message || err.error)) || String(err));
  });

  send('status', 'Préparation de Minecraft…');
  await launcher.Launch({
    authenticator: account,
    timeout: 10000,
    path: gameDir,
    version: config.minecraftVersion,
    detached: false,
    downloadFileMultiple: 10,
    loader: { type: 'neoforge', build: config.neoforgeVersion, enable: true },
    verify: false,
    ignored: ['mods', 'config', 'options.txt', 'saves', 'screenshots', 'resourcepacks', 'shaderpacks'],
    java: { path: null, version: null, type: 'jre' },
    JVM_ARGS: [],
    GAME_ARGS: ['--quickPlayMultiplayer', config.serverAddress],
    memory: { min: `${config.ramMin}G`, max: `${ram}G` }
  });
});
