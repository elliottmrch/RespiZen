/* ==========================================================
   RESPIZEN — Script principal
   Application de cohérence cardiaque

   Organisation :
   1. Références aux éléments du DOM
   2. Changement de mode (Cercle / Tube)
   3. Contrôle de la durée du souffle
   4. Contrôle de la durée de session
   5. Chronomètre (compte à rebours)
   6. Gestion de l'interface (mode repos / mode session)
   7. Démarrage et arrêt de la session
   8. Texte de respiration (INSPIREZ / EXPIREZ)
   9. Panneau paramètres (couleurs, thème, langue)
   10. Traductions
   11. Sidebar mobile
   ========================================================== */


/* =============================================
   1. RÉFÉRENCES AUX ÉLÉMENTS DU DOM
   ============================================= */

// Bouton principal Start/Stop (desktop)
const button = document.getElementById('actionButton');

// Bouton Start/Stop flottant (mobile)
const mobileButton = document.getElementById('mobileActionButton');

// Éléments de visualisation
const circle = document.querySelector('.circle');
const guideCircle = document.querySelector('.guide-circle');
const tubeBall = document.querySelector('.tube-ball');

// Sélecteur de mode (en haut, desktop)
const modeCircleBtn = document.getElementById('modeCircle');
const modeTubeBtn = document.getElementById('modeTube');
const circleMode = document.getElementById('circleMode');
const tubeMode = document.getElementById('tubeMode');
const modeSelector = document.getElementById('modeSelector');

// Infos de session affichées en haut pendant une session
const sessionInfoTop = document.getElementById('sessionInfo');
const countdownDisplayTop = document.getElementById('countdownDisplayTop');
const cycleDisplayTop = document.getElementById('cycleDisplayTop');

// Cartes de contrôle en bas (desktop, masquées pendant la session)
const sessionControl = document.getElementById('sessionControl');
const breathControl = document.getElementById('breathControl');

// Contrôles de durée du souffle (desktop)
const breathSlider = document.getElementById('breathSlider');
const breathValue = document.getElementById('breathValue');
const breathMinus = document.getElementById('breathMinus');
const breathPlus = document.getElementById('breathPlus');

// Contrôles de durée de session (desktop)
const sessionSlider = document.getElementById('sessionSlider');
const sessionValue = document.getElementById('sessionValue');
const sessionMinus = document.getElementById('sessionMinus');
const sessionPlus = document.getElementById('sessionPlus');

// Texte INSPIREZ / EXPIREZ
const breathText = document.getElementById('breathText');

// Panneau paramètres
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

// Sidebar mobile
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarModeCircle = document.getElementById('sidebarModeCircle');
const sidebarModeTube = document.getElementById('sidebarModeTube');
const sidebarSessionSlider = document.getElementById('sidebarSessionSlider');
const sidebarSessionValue = document.getElementById('sidebarSessionValue');
const sidebarBreathSlider = document.getElementById('sidebarBreathSlider');
const sidebarBreathValue = document.getElementById('sidebarBreathValue');

// État de l'application
let isRunning = false;           // La session est-elle en cours ?
let currentMode = 'circle';      // Mode actif : 'circle' ou 'tube'
let sessionDuration = 5;         // Durée de la session en minutes (0 = infini)
let currentLang = 'fr';          // Langue active
let countdownInterval = null;    // Référence au setInterval du chrono
let breathTextInterval = null;   // Référence au setInterval du texte de respiration


/* =============================================
   2. CHANGEMENT DE MODE (Cercle / Tube)
   ============================================= */

/**
 * Change le mode de visualisation.
 * Impossible de changer pendant une session en cours.
 * Synchronise les boutons desktop ET sidebar.
 */
function switchMode(mode) {
    if (isRunning) return;

    currentMode = mode;

    // Met à jour les boutons desktop (actif / inactif)
    modeCircleBtn.classList.toggle('active', mode === 'circle');
    modeTubeBtn.classList.toggle('active', mode === 'tube');

    // Met à jour les boutons sidebar
    sidebarModeCircle.classList.toggle('active', mode === 'circle');
    sidebarModeTube.classList.toggle('active', mode === 'tube');

    // Affiche le bon conteneur de visualisation
    circleMode.classList.toggle('active', mode === 'circle');
    tubeMode.classList.toggle('active', mode === 'tube');
}

// Boutons de mode desktop
modeCircleBtn.addEventListener('click', () => switchMode('circle'));
modeTubeBtn.addEventListener('click', () => switchMode('tube'));

// Boutons de mode sidebar
sidebarModeCircle.addEventListener('click', () => switchMode('circle'));
sidebarModeTube.addEventListener('click', () => switchMode('tube'));

// Quand l'animation d'entrée du cercle est finie, on retire la classe pour ne pas bloquer
circle.addEventListener('animationend', (e) => {
    if (e.animationName === 'slideDown') {
        circle.classList.remove('slide-in');
    }
});


/* =============================================
   3. CONTRÔLE DE LA DURÉE DU SOUFFLE
   ============================================= */

/**
 * Met à jour la durée du souffle.
 * La durée totale d'un cycle = valeur × 2 (inspiration + expiration).
 * Synchronise les affichages desktop ET sidebar.
 */
function updateBreathDuration(value) {
    const totalDuration = value * 2;
    circle.style.setProperty('--breath-duration', `${totalDuration}s`);
    tubeBall.style.setProperty('--breath-duration', `${totalDuration}s`);

    // Synchroniser les deux affichages
    breathValue.textContent = `${value}s`;
    sidebarBreathValue.textContent = `${value}s`;

    // Synchroniser les deux sliders
    breathSlider.value = value;
    sidebarBreathSlider.value = value;
}

// Desktop
breathSlider.addEventListener('input', (e) => updateBreathDuration(e.target.value));
breathMinus.addEventListener('click', () => {
    const val = parseInt(breathSlider.value);
    if (val > parseInt(breathSlider.min)) updateBreathDuration(val - 1);
});
breathPlus.addEventListener('click', () => {
    const val = parseInt(breathSlider.value);
    if (val < parseInt(breathSlider.max)) updateBreathDuration(val + 1);
});

// Sidebar
sidebarBreathSlider.addEventListener('input', (e) => updateBreathDuration(e.target.value));
document.querySelector('.sidebar-breath-minus').addEventListener('click', () => {
    const val = parseInt(sidebarBreathSlider.value);
    if (val > parseInt(sidebarBreathSlider.min)) updateBreathDuration(val - 1);
});
document.querySelector('.sidebar-breath-plus').addEventListener('click', () => {
    const val = parseInt(sidebarBreathSlider.value);
    if (val < parseInt(sidebarBreathSlider.max)) updateBreathDuration(val + 1);
});


/* =============================================
   4. CONTRÔLE DE LA DURÉE DE SESSION
   ============================================= */

/**
 * Met à jour l'affichage de la durée de session.
 * Si la valeur est 0, ça signifie "mode infini" (pas de limite de temps).
 * Synchronise les affichages desktop ET sidebar.
 */
function updateSessionDisplay(minutes) {
    const t = translations[currentLang];
    sessionDuration = parseInt(minutes);

    const displayText = sessionDuration === 0 ? t.infinite : `${sessionDuration} min`;

    // Synchroniser les deux affichages
    sessionValue.textContent = displayText;
    sidebarSessionValue.textContent = displayText;

    // Synchroniser les deux sliders
    sessionSlider.value = minutes;
    sidebarSessionSlider.value = minutes;
}

// Desktop
sessionSlider.addEventListener('input', (e) => updateSessionDisplay(e.target.value));
sessionMinus.addEventListener('click', () => {
    const val = parseInt(sessionSlider.value);
    if (val > parseInt(sessionSlider.min)) updateSessionDisplay(val - 1);
});
sessionPlus.addEventListener('click', () => {
    const val = parseInt(sessionSlider.value);
    if (val < parseInt(sessionSlider.max)) updateSessionDisplay(val + 1);
});

// Sidebar
sidebarSessionSlider.addEventListener('input', (e) => updateSessionDisplay(e.target.value));
document.querySelector('.sidebar-session-minus').addEventListener('click', () => {
    const val = parseInt(sidebarSessionSlider.value);
    if (val > parseInt(sidebarSessionSlider.min)) updateSessionDisplay(val - 1);
});
document.querySelector('.sidebar-session-plus').addEventListener('click', () => {
    const val = parseInt(sidebarSessionSlider.value);
    if (val < parseInt(sidebarSessionSlider.max)) updateSessionDisplay(val + 1);
});


/* =============================================
   5. CHRONOMÈTRE (compte à rebours)
   ============================================= */

/**
 * Démarre le compte à rebours de la session.
 * En mode infini (durée = 0), affiche simplement "∞".
 */
function startTimer() {
    if (sessionDuration === 0) {
        countdownDisplayTop.textContent = '∞';
        cycleDisplayTop.textContent = '';
        return;
    }

    let timeLeft = sessionDuration * 60; // Conversion en secondes
    updateTimerDisplay(timeLeft);

    countdownInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);

        if (timeLeft <= 0) {
            stopSession();
        }
    }, 1000);
}

/**
 * Met à jour l'affichage du chrono et du nombre de cycles restants.
 */
function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    countdownDisplayTop.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;

    // Calcul du nombre de cycles restants
    const cycleDuration = parseInt(breathSlider.value) * 2;
    const cyclesLeft = Math.ceil(seconds / cycleDuration);
    cycleDisplayTop.textContent = `${cyclesLeft} cycle${cyclesLeft > 1 ? 's' : ''}`;
}


/* =============================================
   6. GESTION DE L'INTERFACE
   ============================================= */

/**
 * Passe l'interface en mode "session en cours" :
 * - Cache le sélecteur de mode et les contrôles du bas
 * - Affiche le chrono et les cycles en haut
 * - Cache le bouton hamburger (pas de réglages pendant la session)
 */
function showRunningUI() {
    modeSelector.classList.add('hidden');
    sessionInfoTop.classList.add('visible');
    sessionControl.classList.add('hidden');
    breathControl.classList.add('hidden');
    menuBtn.style.opacity = '0';
    menuBtn.style.pointerEvents = 'none';
}

/**
 * Remet l'interface en mode "repos" :
 * - Réaffiche le sélecteur de mode et les contrôles
 * - Cache le chrono
 * - Réaffiche le bouton hamburger
 */
function showIdleUI() {
    modeSelector.classList.remove('hidden');
    sessionInfoTop.classList.remove('visible');
    sessionControl.classList.remove('hidden');
    breathControl.classList.remove('hidden');
    menuBtn.style.opacity = '';
    menuBtn.style.pointerEvents = '';
}


/* =============================================
   7. DÉMARRAGE ET ARRÊT DE SESSION
   ============================================= */

/**
 * Met à jour le texte et le style des deux boutons Start/Stop
 * (desktop et mobile) en même temps.
 */
function updateButtons(running) {
    const t = translations[currentLang];
    const icon = running ? 'fa-stop' : 'fa-play';
    const text = running ? t.stop : t.start;
    const html = `<i class="fa-solid ${icon}"></i> <span>${text}</span>`;

    // Desktop
    button.innerHTML = html;
    button.classList.toggle('stop', running);

    // Mobile
    mobileButton.innerHTML = html;
    mobileButton.classList.toggle('stop', running);
}

/** Démarre une session de respiration. */
function startSession() {
    isRunning = true;
    updateButtons(true);

    // Fermer la sidebar si elle est ouverte
    closeSidebar();

    // Lance l'animation du mode actif
    if (currentMode === 'circle') {
        circle.classList.add('breathing');
        guideCircle.classList.add('active');
    } else {
        tubeBall.classList.add('breathing');
    }

    showRunningUI();
    startTimer();
    startBreathText();
}

/** Arrête la session en cours et remet tout à zéro. */
function stopSession() {
    isRunning = false;
    updateButtons(false);

    // Stoppe les animations des deux modes
    circle.classList.remove('breathing');
    guideCircle.classList.remove('active');
    tubeBall.classList.remove('breathing');

    // Réinitialise le chrono
    clearInterval(countdownInterval);
    countdownDisplayTop.textContent = '';
    cycleDisplayTop.textContent = '';

    showIdleUI();
    stopBreathText();
}

/** Bascule entre Start et Stop. */
function toggleSession() {
    isRunning ? stopSession() : startSession();
}

// Clic sur le bouton Start / Stop (desktop ET mobile)
button.addEventListener('click', toggleSession);
mobileButton.addEventListener('click', toggleSession);


/* =============================================
   8. TEXTE DE RESPIRATION (INSPIREZ / EXPIREZ)
   ============================================= */

/** Affiche et alterne le texte "INSPIREZ" / "EXPIREZ" pendant la session. */
function startBreathText() {
    const breathDurationSec = parseInt(breathSlider.value);
    const t = translations[currentLang];

    breathText.textContent = t.inspire;
    breathText.classList.add('visible');
    let isInspire = true;

    breathTextInterval = setInterval(() => {
        isInspire = !isInspire;
        breathText.textContent = isInspire ? t.inspire : t.expire;
    }, breathDurationSec * 1000);
}

/** Cache le texte de respiration et arrête l'alternance. */
function stopBreathText() {
    clearInterval(breathTextInterval);
    breathText.classList.remove('visible');
    breathText.textContent = '';
}


/* =============================================
   9. PANNEAU PARAMÈTRES
   ============================================= */

// Ouvrir / fermer le panneau en cliquant sur le bouton ⚙
settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
});

// Fermer le panneau si on clique en dehors
document.addEventListener('click', (e) => {
    const isClickInside = settingsPanel.contains(e.target) || settingsBtn.contains(e.target);
    if (!isClickInside) {
        settingsPanel.classList.remove('open');
    }
});

/* ---- Couleur d'accent ---- */

// Correspondance entre le nom de la couleur et son code hex
const colorMap = {
    yellow: '#FFD700',
    green: '#4CAF50',
    blue: '#2196F3',
    red: '#f44336',
    purple: '#9C27B0',
    pink: '#E91E63'
};

const colorDots = document.querySelectorAll('.color-dot');

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        // Désactive tous les points, active celui cliqué
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');

        const color = colorMap[dot.dataset.color];

        // Met à jour les variables CSS sur body (là où elles sont déclarées)
        // Tous les éléments qui utilisent var(--accent-color) changent automatiquement
        document.body.style.setProperty('--accent-color', color);
        document.body.style.setProperty('--accent-glow', `${color}4D`); // 4D = ~30% opacité en hex
    });
});

/* ---- Thème (sombre / clair) ---- */

const themeBtns = document.querySelectorAll('.theme-btn');

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Ajoute ou retire la classe 'light' sur le body
        if (btn.dataset.theme === 'light') {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    });
});


/* =============================================
   10. TRADUCTIONS
   ============================================= */

const translations = {
    fr: {
        circle: 'Cercle', tube: 'Tube',
        sessionDuration: 'Durée Session',
        breathDuration: 'Durée Souffle',
        start: 'Start', stop: 'Stop',
        inspire: 'INSPIREZ', expire: 'EXPIREZ',
        settings: 'Paramètres', color: 'Couleur',
        language: 'Langue', theme: 'Thème',
        infinite: 'Infini', sidebarTitle: 'Réglages',
        mode: 'Mode'
    },
    en: {
        circle: 'Circle', tube: 'Tube',
        sessionDuration: 'Session Duration',
        breathDuration: 'Breath Duration',
        start: 'Start', stop: 'Stop',
        inspire: 'BREATHE IN', expire: 'BREATHE OUT',
        settings: 'Settings', color: 'Color',
        language: 'Language', theme: 'Theme',
        infinite: 'Infinite', sidebarTitle: 'Settings',
        mode: 'Mode'
    },
    es: {
        circle: 'Círculo', tube: 'Tubo',
        sessionDuration: 'Duración Sesión',
        breathDuration: 'Duración Soplo',
        start: 'Iniciar', stop: 'Parar',
        inspire: 'INSPIRAR', expire: 'EXPIRAR',
        settings: 'Ajustes', color: 'Color',
        language: 'Idioma', theme: 'Tema',
        infinite: 'Infinito', sidebarTitle: 'Ajustes',
        mode: 'Modo'
    },
    zh: {
        circle: '圆圈', tube: '管',
        sessionDuration: '时长',
        breathDuration: '呼吸时长',
        start: '开始', stop: '停止',
        inspire: '吸气', expire: '呼气',
        settings: '设置', color: '颜色',
        language: '语言', theme: '主题',
        infinite: '无限', sidebarTitle: '设置',
        mode: '模式'
    }
};

/**
 * Applique les traductions à tous les textes de l'interface.
 * Met à jour le desktop, la sidebar et le panneau paramètres.
 */
function applyTranslations(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Boutons de mode (desktop)
    modeCircleBtn.querySelector('span').textContent = t.circle;
    modeTubeBtn.querySelector('span').textContent = t.tube;

    // Boutons de mode (sidebar)
    sidebarModeCircle.querySelector('span').textContent = t.circle;
    sidebarModeTube.querySelector('span').textContent = t.tube;

    // Labels des contrôles du bas (desktop)
    document.querySelector('#sessionControl label span').textContent = t.sessionDuration;
    document.querySelector('#breathControl label span').textContent = t.breathDuration;

    // Labels de la sidebar
    const sidebarLabels = sidebar.querySelectorAll('.sidebar-section label span');
    if (sidebarLabels[0]) sidebarLabels[0].textContent = t.mode;
    if (sidebarLabels[1]) sidebarLabels[1].textContent = t.sessionDuration;
    if (sidebarLabels[2]) sidebarLabels[2].textContent = t.breathDuration;

    // Titre de la sidebar
    document.getElementById('sidebarTitle').textContent = t.sidebarTitle;

    // Label du mode sidebar
    document.getElementById('sidebarModeLabel').textContent = t.mode;

    // Boutons Start / Stop (desktop + mobile)
    updateButtons(isRunning);

    // Panneau paramètres
    document.getElementById('settingsTitle').innerHTML = `<i class="fa-solid fa-sliders"></i> ${t.settings}`;
    document.getElementById('colorLabel').innerHTML = `<i class="fa-solid fa-palette"></i> ${t.color}`;
    document.getElementById('themeLabel').innerHTML = `<i class="fa-solid fa-circle-half-stroke"></i> ${t.theme}`;
    document.getElementById('langLabel').innerHTML = `<i class="fa-solid fa-globe"></i> ${t.language}`;

    // "Infini" dans l'affichage de la durée de session
    if (sessionDuration === 0) {
        sessionValue.textContent = t.infinite;
        sidebarSessionValue.textContent = t.infinite;
    }
}

// Gestion des clics sur les boutons de langue
const langBtns = document.querySelectorAll('.lang-btn');

langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyTranslations(btn.dataset.lang);
    });
});


/* =============================================
   11. SIDEBAR MOBILE
   ============================================= */

/** Ouvre la sidebar et affiche le fond sombre. */
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
}

/** Ferme la sidebar et cache le fond sombre. */
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
}

// Bouton hamburger → ouvre la sidebar
menuBtn.addEventListener('click', openSidebar);

// Bouton × dans la sidebar → ferme
sidebarClose.addEventListener('click', closeSidebar);

// Clic sur le fond sombre → ferme la sidebar
sidebarOverlay.addEventListener('click', closeSidebar);


/* =============================================
   INITIALISATION AU CHARGEMENT
   ============================================= */

updateBreathDuration(breathSlider.value);
updateSessionDisplay(sessionSlider.value);
