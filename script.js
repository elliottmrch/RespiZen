/* ==========================================================
   RESPIZEN — Script principal
   
   1. Références aux éléments du DOM
   2. Changement de mode (Cercle / Tube)
   3. Durée du souffle (synchro desktop ↔ sidebar)
   4. Durée de session (synchro desktop ↔ sidebar)
   5. Chronomètre
   6. Gestion de l'interface (repos / session)
   7. Démarrage et arrêt
   8. Texte de respiration
   9. Panneau paramètres
   10. Traductions
   11. Sidebar mobile
   ========================================================== */


/* =============================================
   1. RÉFÉRENCES AUX ÉLÉMENTS DU DOM
   ============================================= */

// Boutons Start/Stop
const button = document.getElementById('actionButton');
const mobileButton = document.getElementById('mobileActionButton');

// Visualisation
const circle = document.querySelector('.circle');
const guideCircle = document.querySelector('.guide-circle');
const tubeBall = document.querySelector('.tube-ball');

// Mode (desktop top bar)
const modeCircleBtn = document.getElementById('modeCircle');
const modeTubeBtn = document.getElementById('modeTube');
const circleMode = document.getElementById('circleMode');
const tubeMode = document.getElementById('tubeMode');
const modeSelector = document.getElementById('modeSelector');

// Session info (haut)
const sessionInfoTop = document.getElementById('sessionInfo');
const countdownDisplayTop = document.getElementById('countdownDisplayTop');
const cycleDisplayTop = document.getElementById('cycleDisplayTop');

// Contrôles desktop (bas)
const sessionControl = document.getElementById('sessionControl');
const breathControl = document.getElementById('breathControl');
const breathSlider = document.getElementById('breathSlider');
const breathValue = document.getElementById('breathValue');
const breathMinus = document.getElementById('breathMinus');
const breathPlus = document.getElementById('breathPlus');
const sessionSlider = document.getElementById('sessionSlider');
const sessionValue = document.getElementById('sessionValue');
const sessionMinus = document.getElementById('sessionMinus');
const sessionPlus = document.getElementById('sessionPlus');

// Texte de respiration
const breathText = document.getElementById('breathText');

// Paramètres
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

// Sidebar
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarSessionSlider = document.getElementById('sidebarSessionSlider');
const sidebarSessionValue = document.getElementById('sidebarSessionValue');
const sidebarBreathSlider = document.getElementById('sidebarBreathSlider');
const sidebarBreathValue = document.getElementById('sidebarBreathValue');

// État global
let isRunning = false;
let currentMode = 'circle';
let sessionDuration = 5;
let currentLang = 'fr';
let countdownInterval = null;
let breathTextInterval = null;


/* =============================================
   2. CHANGEMENT DE MODE
   ============================================= */

function switchMode(mode) {
    if (isRunning) return;
    currentMode = mode;

    modeCircleBtn.classList.toggle('active', mode === 'circle');
    modeTubeBtn.classList.toggle('active', mode === 'tube');
    circleMode.classList.toggle('active', mode === 'circle');
    tubeMode.classList.toggle('active', mode === 'tube');
}

modeCircleBtn.addEventListener('click', () => switchMode('circle'));
modeTubeBtn.addEventListener('click', () => switchMode('tube'));

circle.addEventListener('animationend', (e) => {
    if (e.animationName === 'slideDown') circle.classList.remove('slide-in');
});


/* =============================================
   3. DURÉE DU SOUFFLE (synchro desktop ↔ sidebar)
   ============================================= */

function updateBreathDuration(value) {
    const v = parseInt(value);
    const totalDuration = v * 2;
    circle.style.setProperty('--breath-duration', `${totalDuration}s`);
    tubeBall.style.setProperty('--breath-duration', `${totalDuration}s`);

    // Synchro des deux affichages
    breathValue.textContent = `${v}s`;
    sidebarBreathValue.textContent = `${v}s`;
    breathSlider.value = v;
    sidebarBreathSlider.value = v;
}

// Desktop
breathSlider.addEventListener('input', (e) => updateBreathDuration(e.target.value));
breathMinus.addEventListener('click', () => {
    const v = parseInt(breathSlider.value);
    if (v > parseInt(breathSlider.min)) updateBreathDuration(v - 1);
});
breathPlus.addEventListener('click', () => {
    const v = parseInt(breathSlider.value);
    if (v < parseInt(breathSlider.max)) updateBreathDuration(v + 1);
});

// Sidebar
sidebarBreathSlider.addEventListener('input', (e) => updateBreathDuration(e.target.value));
document.querySelector('.sidebar-breath-minus').addEventListener('click', () => {
    const v = parseInt(sidebarBreathSlider.value);
    if (v > parseInt(sidebarBreathSlider.min)) updateBreathDuration(v - 1);
});
document.querySelector('.sidebar-breath-plus').addEventListener('click', () => {
    const v = parseInt(sidebarBreathSlider.value);
    if (v < parseInt(sidebarBreathSlider.max)) updateBreathDuration(v + 1);
});


/* =============================================
   4. DURÉE DE SESSION (synchro desktop ↔ sidebar)
   ============================================= */

function updateSessionDisplay(minutes) {
    const t = translations[currentLang];
    sessionDuration = parseInt(minutes);
    const text = sessionDuration === 0 ? t.infinite : `${sessionDuration} min`;

    sessionValue.textContent = text;
    sidebarSessionValue.textContent = text;
    sessionSlider.value = minutes;
    sidebarSessionSlider.value = minutes;
}

// Desktop
sessionSlider.addEventListener('input', (e) => updateSessionDisplay(e.target.value));
sessionMinus.addEventListener('click', () => {
    const v = parseInt(sessionSlider.value);
    if (v > parseInt(sessionSlider.min)) updateSessionDisplay(v - 1);
});
sessionPlus.addEventListener('click', () => {
    const v = parseInt(sessionSlider.value);
    if (v < parseInt(sessionSlider.max)) updateSessionDisplay(v + 1);
});

// Sidebar
sidebarSessionSlider.addEventListener('input', (e) => updateSessionDisplay(e.target.value));
document.querySelector('.sidebar-session-minus').addEventListener('click', () => {
    const v = parseInt(sidebarSessionSlider.value);
    if (v > parseInt(sidebarSessionSlider.min)) updateSessionDisplay(v - 1);
});
document.querySelector('.sidebar-session-plus').addEventListener('click', () => {
    const v = parseInt(sidebarSessionSlider.value);
    if (v < parseInt(sidebarSessionSlider.max)) updateSessionDisplay(v + 1);
});


/* =============================================
   5. CHRONOMÈTRE
   ============================================= */

function startTimer() {
    if (sessionDuration === 0) {
        countdownDisplayTop.textContent = '∞';
        cycleDisplayTop.textContent = '';
        return;
    }

    let timeLeft = sessionDuration * 60;
    updateTimerDisplay(timeLeft);

    countdownInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        if (timeLeft <= 0) stopSession();
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    countdownDisplayTop.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;

    const cycleDuration = parseInt(breathSlider.value) * 2;
    const cyclesLeft = Math.ceil(seconds / cycleDuration);
    cycleDisplayTop.textContent = `${cyclesLeft} cycle${cyclesLeft > 1 ? 's' : ''}`;
}


/* =============================================
   6. GESTION DE L'INTERFACE
   ============================================= */

function showRunningUI() {
    modeSelector.classList.add('hidden');
    sessionInfoTop.classList.add('visible');
    sessionControl.classList.add('hidden');
    breathControl.classList.add('hidden');
    menuBtn.style.opacity = '0';
    menuBtn.style.pointerEvents = 'none';
}

function showIdleUI() {
    modeSelector.classList.remove('hidden');
    sessionInfoTop.classList.remove('visible');
    sessionControl.classList.remove('hidden');
    breathControl.classList.remove('hidden');
    menuBtn.style.opacity = '';
    menuBtn.style.pointerEvents = '';
}


/* =============================================
   7. DÉMARRAGE ET ARRÊT
   ============================================= */

function updateButtons(running) {
    const t = translations[currentLang];
    const icon = running ? 'fa-stop' : 'fa-play';
    const text = running ? t.stop : t.start;
    const html = `<i class="fa-solid ${icon}"></i> <span>${text}</span>`;

    button.innerHTML = html;
    button.classList.toggle('stop', running);
    mobileButton.innerHTML = html;
    mobileButton.classList.toggle('stop', running);
}

function startSession() {
    isRunning = true;
    updateButtons(true);
    closeSidebar();

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

function stopSession() {
    isRunning = false;
    updateButtons(false);

    circle.classList.remove('breathing');
    guideCircle.classList.remove('active');
    tubeBall.classList.remove('breathing');

    clearInterval(countdownInterval);
    countdownDisplayTop.textContent = '';
    cycleDisplayTop.textContent = '';

    showIdleUI();
    stopBreathText();
}

function toggleSession() {
    isRunning ? stopSession() : startSession();
}

button.addEventListener('click', toggleSession);
mobileButton.addEventListener('click', toggleSession);


/* =============================================
   8. TEXTE DE RESPIRATION
   ============================================= */

function startBreathText() {
    const dur = parseInt(breathSlider.value);
    const t = translations[currentLang];

    breathText.textContent = t.inspire;
    breathText.classList.add('visible');
    let isInspire = true;

    breathTextInterval = setInterval(() => {
        isInspire = !isInspire;
        breathText.textContent = isInspire ? t.inspire : t.expire;
    }, dur * 1000);
}

function stopBreathText() {
    clearInterval(breathTextInterval);
    breathText.classList.remove('visible');
    breathText.textContent = '';
}


/* =============================================
   9. PANNEAU PARAMÈTRES
   ============================================= */

settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('open'));

document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('open');
    }
});

// Couleurs
const colorMap = {
    yellow: '#FFD700', green: '#4CAF50', blue: '#2196F3',
    red: '#f44336', purple: '#9C27B0', pink: '#E91E63'
};

const colorDots = document.querySelectorAll('.color-dot');
colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = colorMap[dot.dataset.color];
        document.body.style.setProperty('--accent-color', color);
        document.body.style.setProperty('--accent-glow', `${color}4D`);
    });
});

// Thème
const themeBtns = document.querySelectorAll('.theme-btn');
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.classList.toggle('light', btn.dataset.theme === 'light');
    });
});


/* =============================================
   10. TRADUCTIONS
   ============================================= */

const translations = {
    fr: {
        circle: 'Cercle', tube: 'Tube',
        sessionDuration: 'Durée Session', breathDuration: 'Durée Souffle',
        start: 'Start', stop: 'Stop',
        inspire: 'INSPIREZ', expire: 'EXPIREZ',
        settings: 'Paramètres', color: 'Couleur',
        language: 'Langue', theme: 'Thème',
        infinite: 'Infini', sidebarTitle: 'Réglages'
    },
    en: {
        circle: 'Circle', tube: 'Tube',
        sessionDuration: 'Session Duration', breathDuration: 'Breath Duration',
        start: 'Start', stop: 'Stop',
        inspire: 'BREATHE IN', expire: 'BREATHE OUT',
        settings: 'Settings', color: 'Color',
        language: 'Language', theme: 'Theme',
        infinite: 'Infinite', sidebarTitle: 'Settings'
    },
    es: {
        circle: 'Círculo', tube: 'Tubo',
        sessionDuration: 'Duración Sesión', breathDuration: 'Duración Soplo',
        start: 'Iniciar', stop: 'Parar',
        inspire: 'INSPIRAR', expire: 'EXPIRAR',
        settings: 'Ajustes', color: 'Color',
        language: 'Idioma', theme: 'Tema',
        infinite: 'Infinito', sidebarTitle: 'Ajustes'
    },
    zh: {
        circle: '圆圈', tube: '管',
        sessionDuration: '时长', breathDuration: '呼吸时长',
        start: '开始', stop: '停止',
        inspire: '吸气', expire: '呼气',
        settings: '设置', color: '颜色',
        language: '语言', theme: '主题',
        infinite: '无限', sidebarTitle: '设置'
    }
};

function applyTranslations(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Boutons de mode
    modeCircleBtn.querySelector('span').textContent = t.circle;
    modeTubeBtn.querySelector('span').textContent = t.tube;

    // Labels desktop
    document.querySelector('#sessionControl label span').textContent = t.sessionDuration;
    document.querySelector('#breathControl label span').textContent = t.breathDuration;

    // Labels sidebar
    document.querySelector('.sidebar-label-session').textContent = t.sessionDuration;
    document.querySelector('.sidebar-label-breath').textContent = t.breathDuration;

    // Titre sidebar
    document.getElementById('sidebarTitle').textContent = t.sidebarTitle;

    // Boutons Start/Stop
    updateButtons(isRunning);

    // Panneau paramètres
    document.getElementById('settingsTitle').innerHTML = `<i class="fa-solid fa-sliders"></i> ${t.settings}`;
    document.getElementById('colorLabel').innerHTML = `<i class="fa-solid fa-palette"></i> ${t.color}`;
    document.getElementById('themeLabel').innerHTML = `<i class="fa-solid fa-circle-half-stroke"></i> ${t.theme}`;
    document.getElementById('langLabel').innerHTML = `<i class="fa-solid fa-globe"></i> ${t.language}`;

    // Infini
    if (sessionDuration === 0) {
        sessionValue.textContent = t.infinite;
        sidebarSessionValue.textContent = t.infinite;
    }
}

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

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
}

menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);


/* =============================================
   INITIALISATION
   ============================================= */

updateBreathDuration(breathSlider.value);
updateSessionDisplay(sessionSlider.value);
