// --- Références DOM ---
const globalTimerDisplay = document.getElementById("global-timer");
const addTimerBtn = document.getElementById("add-timer");
const timersList = document.getElementById("timers-list");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const currentTimerDisplay = document.getElementById("current-timer");

const beep = document.getElementById("beep");
beep.volume = 1.0; // volume max (0 à 1)

const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");

const modal = document.getElementById("modal");
const minutesSelect = document.getElementById("minutes-select");
const secondsSelect = document.getElementById("seconds-select");
const confirmAdd = document.getElementById("confirm-add");
const cancelAdd = document.getElementById("cancel-add");

const timerNameInput = document.getElementById("timer-name");

// Remplir les menus déroulants
for (let i = 0; i <= 60; i++) {
  let optMin = document.createElement("option");
  optMin.value = i;
  optMin.textContent = i;
  minutesSelect.appendChild(optMin);

  let optSec = document.createElement("option");
  optSec.value = i;
  optSec.textContent = i;
  secondsSelect.appendChild(optSec);
}


// --- Etat ---
let timer = null;        // id de setInterval
let isRunning = false;
let timers = [];         // { duration, remaining, element }
let currentIndex = 0;

// --- Utilitaire d'affichage MM:SS ---
function format(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// --- Global Timer ---
function updateGlobalTimer() {
  const totalLeft = timers.reduce((sum, t) => sum + t.remaining, 0);
  globalTimerDisplay.textContent = format(totalLeft);

  const totalDuration = timers.reduce((sum, t) => sum + t.duration, 0);
  const elapsed = totalDuration - totalLeft;
  const percent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  progressBar.style.width = percent + "%";


}

function updateMarkers() {
  // Effacer anciens markers
  document.querySelectorAll(".progress-marker").forEach(m => m.remove());

  const totalDuration = timers.reduce((sum, t) => sum + t.duration, 0);
  if (totalDuration === 0) return;

  let cumulative = 0;
  timers.forEach((t, i) => {
    cumulative += t.duration;
    const percent = (cumulative / totalDuration) * 100;

    const marker = document.createElement("div");
    marker.className = "progress-marker";
    marker.style.left = percent + "%";
    progressContainer.appendChild(marker);
  });
  
}


// --- Crée un sous-timer ---
function addTimer(name, minutes, seconds) {
  const duration = minutes * 60 + seconds;
  if (duration <= 0) return;

  const timerDiv = document.createElement("div");
  timerDiv.className = "timer-item upcoming";

  // --- Titre du timer (ex : "Pomodoro", "Pause", etc.)
  const label = document.createElement("div");
  label.className = "title";
  label.textContent = name;

  // --- Décompte discret
  const countdown = document.createElement("div");
  countdown.className = "countdown";
  countdown.textContent = format(duration);

  // --- Bouton supprimer
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "✖";

  const timerObj = {
    name,
    duration,
    remaining: duration,
    element: countdown,
    container: timerDiv
  };

  deleteBtn.addEventListener("click", () => {
    timers = timers.filter(t => t !== timerObj);
    timerDiv.remove();
    updateGlobalTimer();

    if (currentIndex >= timers.length) {
      currentIndex = timers.length - 1;
    }
    if (timers.length === 0) {
      currentTimerDisplay.textContent = "--:--";
      document.getElementById("current-timer-title").textContent = "";
    }
  });

  timerDiv.append(label, countdown, deleteBtn);
  timersList.appendChild(timerDiv);

  timers.push(timerObj);

  if (!isRunning && timers.length === 1) {
    currentTimerDisplay.textContent = format(duration);
    document.getElementById("current-timer-title").textContent = name;
  }

  updateGlobalTimer();
  updateMarkers();
}




// --- Tick appelé chaque seconde quand ça tourne ---
function tick() {
  if (currentIndex < timers.length) {
    const current = timers[currentIndex];

    if (current.remaining > 0) {
      current.remaining--;
      currentTimerDisplay.textContent = format(current.remaining);
      document.getElementById("current-timer-title").textContent = current.name;
    }

    if (current.remaining === 0) {
      beep.play();
      current.container.classList.remove("current");
      current.container.classList.add("finished");

      currentIndex++;

      if (currentIndex < timers.length) {
        timers[currentIndex].container.classList.remove("upcoming");
        timers[currentIndex].container.classList.add("current");
        currentTimerDisplay.textContent = format(timers[currentIndex].remaining);
        document.getElementById("current-timer-title").textContent = timers[currentIndex].name;
      }
    }

    updateGlobalTimer();
  } else {
    stop();
    timers.forEach(t => {
      t.container.classList.remove("current", "upcoming");
      t.container.classList.add("finished");
    });

    #beep.currentTime = 0; // repart au début
    beep.play();
    launchConfetti();
    timers = [];
    timersList.innerHTML = "";
    currentIndex = 0;
    updateGlobalTimer();
    currentTimerDisplay.textContent = "--:--";
    document.getElementById("current-timer-title").textContent = "";
  }
}



// --- Contrôles ---
function startTimer() {
  if (!isRunning && timers.length > 0) {
    isRunning = true;

    // Appliquer les bonnes classes
    timers.forEach((t, i) => {
      t.container.classList.remove("current", "upcoming", "finished");
      if (i < currentIndex) {
        t.container.classList.add("finished");
      } else if (i === currentIndex) {
        t.container.classList.add("current");
      } else {
        t.container.classList.add("upcoming");
      }
    });

    currentTimerDisplay.textContent = format(timers[currentIndex].remaining);
    timer = setInterval(tick, 1000);
    lastTimestamp = null;
    requestAnimationFrame(animateProgress);
  }
}

// --- Listeners pour la modale ---
addTimerBtn.addEventListener("click", () => {
  timerNameInput.value = `Timer ${timers.length + 1}`;
  minutesSelect.value = 0;
  secondsSelect.value = 0;
  modal.style.display = "flex";
});

confirmAdd.addEventListener("click", () => {
  const mins = parseInt(minutesSelect.value, 10);
  const secs = parseInt(secondsSelect.value, 10);
  const name = timerNameInput.value.trim() || `Timer ${timers.length + 1}`;
  addTimer(name, mins, secs);
  modal.style.display = "none";
});

cancelAdd.addEventListener("click", () => {
  modal.style.display = "none";
});


startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// --- Init ---
updateGlobalTimer();


function stop() {
  clearInterval(timer);
  timer = null;
  isRunning = false;
}

function pauseTimer() {
  stop();
}

function resetTimer() {
  stop();
  currentIndex = 0;
  timers.forEach(t => (t.remaining = t.duration));
  timers.forEach((t, i) => {
    t.container.classList.remove("current", "upcoming", "finished");
    t.container.classList.add("upcoming");
    t.element.textContent = format(t.duration);
  });
  updateGlobalTimer();
  updateMarkers();
  currentTimerDisplay.textContent = timers.length > 0 ? format(timers[0].duration) : "--:--";
}


let lastTimestamp = null;

function animateProgress(timestamp) {
  if (!isRunning) return; // arrêter l'animation si le timer est en pause

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000; // secondes écoulées depuis le dernier frame
  lastTimestamp = timestamp;

  // Calcul du temps restant global
  const totalLeft = timers.reduce((sum, t, i) => {
    if (i < currentIndex) return sum; // déjà terminé
    if (i === currentIndex) return sum + t.remaining - delta; // timer en cours : interpolé
    return sum + t.remaining; // timers futurs
  }, 0);

  const totalDuration = timers.reduce((sum, t) => sum + t.duration, 0);
  const elapsed = totalDuration - totalLeft;
  const percent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  progressBar.style.width = percent + "%";

  requestAnimationFrame(animateProgress);
}

function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confettis = [];
  const colors = ["#FFA500", "#FFB347", "#FF8C00"]; // nuances d’orange
  const confettiCount = 600; // plus de confettis

  for (let i = 0; i < confettiCount; i++) {
    confettis.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4, // taille
      d: Math.random() * 20 + 10, // vitesse verticale
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
      swing: Math.random() * 0.04 + 0.02 // oscillation horizontale
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettis.forEach((c) => {
      ctx.beginPath();
      ctx.lineWidth = c.r / 2;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 4, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4);
      ctx.stroke();
    });
    update();
  }

  function update() {
    confettis.forEach((c) => {
      c.tiltAngle += c.tiltAngleIncrement;
      c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2; 
      c.x += Math.sin(c.tiltAngle) * 2 + Math.sin(c.tiltAngle * 2) * c.swing * 20;
      c.tilt = Math.sin(c.tiltAngle) * 15;

      if (c.y > canvas.height) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
        c.tilt = Math.random() * 10 - 10;
      }
    });
  }

  let animation = setInterval(draw, 20);

  setTimeout(() => {
    clearInterval(animation);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 13000); // confettis pendant 13000 secondes
}


