const $ = id => document.getElementById(id);
const api = window.launcher;

const btnLogin = $('btn-login');
const btnPlay = $('btn-play');
const btnLogout = $('btn-logout');
const statusEl = $('status');
const fill = $('progress-fill');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
}

function showAccount(account) {
  const avatar = $('avatar');
  const connected = Boolean(account);
  $('account-name').textContent = connected ? account.name : 'Aucun compte connecté';
  if (connected) avatar.src = `https://mc-heads.net/avatar/${account.uuid}/48`;
  avatar.hidden = !connected;
  btnLogout.hidden = !connected;
  btnLogin.hidden = connected;
  btnPlay.hidden = !connected;
}

function cleanError(e) {
  return String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
}

function resetPlay() {
  btnPlay.disabled = false;
  btnPlay.textContent = 'Jouer';
  fill.style.width = '0';
}

async function init() {
  const cfg = await api.getConfig();
  $('mc-version').textContent = cfg.minecraftVersion;
  $('server-address').textContent = cfg.serverAddress;
  const ram = $('ram');
  ram.min = cfg.ramMin;
  ram.max = cfg.ramMax;
  ram.value = cfg.ram;
  $('ram-value').textContent = cfg.ram;
  ram.addEventListener('input', () => { $('ram-value').textContent = ram.value; });
  ram.addEventListener('change', () => api.setRam(Number(ram.value)));

  setStatus('Vérification du compte…');
  showAccount(await api.getAccount());
  setStatus('Prêt.');
}

btnLogin.addEventListener('click', async () => {
  btnLogin.disabled = true;
  setStatus('Connexion en cours…');
  try {
    showAccount(await api.login());
    setStatus('Connecté.');
  } catch (e) {
    setStatus(cleanError(e), true);
  }
  btnLogin.disabled = false;
});

btnLogout.addEventListener('click', async () => {
  await api.logout();
  showAccount(null);
  setStatus('Déconnecté.');
});

btnPlay.addEventListener('click', async () => {
  btnPlay.disabled = true;
  btnPlay.textContent = 'Lancement…';
  try {
    await api.launch();
  } catch (e) {
    setStatus(cleanError(e), true);
    resetPlay();
  }
});

api.on('status', text => setStatus(text));
api.on('progress', ({ done, total, label }) => {
  const pct = total ? Math.min(100, (done / total) * 100) : 0;
  fill.style.width = `${pct}%`;
  setStatus(`${label} : ${Math.round(pct)} %`);
});
api.on('closed', () => { resetPlay(); setStatus('Jeu fermé.'); });
api.on('error', msg => { resetPlay(); setStatus(msg, true); });

$('btn-min').addEventListener('click', () => api.minimize());
$('btn-close').addEventListener('click', () => api.close());
$('btn-folder').addEventListener('click', () => api.openFolder());

init();
