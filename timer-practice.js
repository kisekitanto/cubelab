const PRACTICE_SECTIONS = ["Cross", "F2L", "OLL", "PLL", "Last layer"];
const practiceState = {
  enabled: false,
  focus: false,
  inspection: 0,
  sectionIndex: 0,
  sectionTimes: [],
  startedAt: 0,
  running: false,
  countdown: false,
  countdownStartedAt: 0,
  tickFrame: 0
};

function ensurePracticeState() {
  if (typeof T !== "undefined" && !T.practice) {
    T.practice = practiceState;
  }
}

function parsePracticeSelections() {
  ensurePracticeState();
  const inspection = document.getElementById("inspection-time");
  if (inspection) practiceState.inspection = Number(inspection.value || 0);
}

function updatePracticeFocusBody() {
  const shouldFocus = tab === "timer" && practiceState.focus;
  document.body.setAttribute("data-timer-focus", shouldFocus ? "on" : "off");
}

function startPracticeRun() {
  if (tab !== "timer") return;
  practiceState.running = true;
  practiceState.sectionIndex = 0;
  practiceState.sectionTimes = [];
  practiceState.startedAt = performance.now();
  T.s = "run";
  T.t0 = practiceState.startedAt;
  $('#hint').textContent = "Hold to mark " + PRACTICE_SECTIONS[0];
  $('#tm').textContent = "0.00";
  cancelAnimationFrame(practiceState.tickFrame);
  const tick = () => {
    if (!practiceState.running || tab !== "timer") return;
    const elapsed = performance.now() - practiceState.startedAt;
    $('#tm').textContent = fmt(elapsed);
    practiceState.tickFrame = requestAnimationFrame(tick);
  };
  practiceState.tickFrame = requestAnimationFrame(tick);
  syncTimerPracticeUI();
}

function completePracticeSolve() {
  cancelAnimationFrame(practiceState.tickFrame);
  practiceState.running = false;
  practiceState.sectionIndex = 0;
  T.s = "wait";
  $('#hint').textContent = "Practice solve complete";
  syncTimerPracticeUI();
}

function recordPracticeSection() {
  if (!practiceState.running) return;
  const elapsed = performance.now() - practiceState.startedAt;
  practiceState.sectionTimes[practiceState.sectionIndex] = {
    name: PRACTICE_SECTIONS[practiceState.sectionIndex],
    time: elapsed
  };
  practiceState.sectionIndex += 1;

  if (practiceState.sectionIndex >= PRACTICE_SECTIONS.length) {
    $('#tm').textContent = fmt(elapsed);
    completePracticeSolve();
    return;
  }

  practiceState.startedAt = performance.now();
  T.t0 = practiceState.startedAt;
  T.s = "run";
  $('#hint').textContent = "Next: " + PRACTICE_SECTIONS[practiceState.sectionIndex];
  $('#tm').textContent = "0.00";
  syncTimerPracticeUI();
}

function syncTimerPracticeUI() {
  if (tab !== "timer") {
    updatePracticeFocusBody();
    return;
  }

  const scc = document.getElementById("scc");
  if (!scc) return;

  let controls = scc.querySelector(".timer-practice-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.className = "timer-practice-controls";
    const first = scc.querySelector("#stg");
    if (first) scc.insertBefore(controls, first);
    else scc.appendChild(controls);
  }

  let summary = scc.querySelector(".timer-practice-summary");
  if (!summary) {
    summary = document.createElement("div");
    summary.className = "timer-practice-summary";
    const first = scc.querySelector("#stg");
    if (first) scc.insertBefore(summary, first);
    else scc.appendChild(summary);
  }

  let status = scc.querySelector(".timer-practice-status");
  if (!status) {
    status = document.createElement("div");
    status.className = "timer-practice-status";
    const first = scc.querySelector("#stg");
    if (first) scc.insertBefore(status, first);
    else scc.appendChild(status);
  }

  const btnPractice = document.createElement("button");
  btnPractice.id = "timer-practice-toggle";
  btnPractice.className = practiceState.enabled ? "on" : "";
  btnPractice.type = "button";
  btnPractice.textContent = practiceState.enabled ? "Practice split on" : "Practice split";

  const btnFocus = document.createElement("button");
  btnFocus.id = "timer-focus-toggle";
  btnFocus.className = practiceState.focus ? "on" : "";
  btnFocus.type = "button";
  btnFocus.textContent = practiceState.focus ? "Focus on" : "Focus mode";

  const inspection = document.createElement("select");
  inspection.id = "inspection-time";
  inspection.innerHTML = [
    '<option value="0">None</option>',
    '<option value="5">5s</option>',
    '<option value="15">15s</option>'
  ].join("");
  inspection.value = String(practiceState.inspection || 0);

  const label = document.createElement("label");
  label.textContent = "Inspection";
  label.appendChild(inspection);

  controls.innerHTML = "";
  controls.appendChild(label);
  controls.appendChild(btnPractice);
  controls.appendChild(btnFocus);

  summary.innerHTML = PRACTICE_SECTIONS.map((name, index) => {
    const time = practiceState.sectionTimes[index];
    const active = practiceState.running && practiceState.sectionIndex === index ? " active" : "";
    return `<div class="timer-practice-item${active}"><span>${name}</span><strong>${time ? fmt(time.time) : "—"}</strong></div>`;
  }).join("");

  status.textContent = practiceState.enabled
    ? (practiceState.running ? "Split timer running" : "Split timer ready")
    : "Standard timer";

  updatePracticeFocusBody();
}

function resetPracticeMode() {
  practiceState.enabled = false;
  practiceState.focus = false;
  practiceState.running = false;
  practiceState.countdown = false;
  practiceState.sectionIndex = 0;
  practiceState.sectionTimes = [];
  practiceState.startedAt = 0;
  practiceState.countdownStartedAt = 0;
  document.body.setAttribute("data-timer-focus", "off");
}

function handlePracticeKeydown(event) {
  if (tab !== "timer" || !practiceState.enabled || event.code !== "Space") return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (!practiceState.running && !practiceState.countdown) {
    if (practiceState.inspection > 0) {
      practiceState.countdown = true;
      practiceState.countdownStartedAt = performance.now();
      T.s = "inspect";
      $('#tm').textContent = String(practiceState.inspection);
      $('#hint').textContent = "Inspection - hold to begin solve";
      return;
    }
    startPracticeRun();
  }
}

function handlePracticeKeyup(event) {
  if (tab !== "timer" || !practiceState.enabled || event.code !== "Space") return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (practiceState.countdown) {
    const elapsed = performance.now() - practiceState.countdownStartedAt;
    practiceState.countdown = false;
    if (elapsed >= practiceState.inspection * 1000) {
      startPracticeRun();
    } else {
      T.s = "idle";
      $('#tm').textContent = "0.00";
      $('#hint').textContent = "Hold to start";
    }
    return;
  }

  if (practiceState.running) {
    recordPracticeSection();
  }
}

function handlePracticePointerDown(event) {
  if (tab !== "timer" || !practiceState.enabled || !event.target.closest("#tz")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handlePracticeKeydown({ code: "Space", preventDefault() {}, stopImmediatePropagation() {} });
}

function handlePracticePointerUp(event) {
  if (tab !== "timer" || !practiceState.enabled || !event.target.closest("#tz")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handlePracticeKeyup({ code: "Space", preventDefault() {}, stopImmediatePropagation() {} });
}

document.addEventListener("click", (event) => {
  const practiceToggle = event.target.closest("#timer-practice-toggle");
  if (practiceToggle) {
    practiceState.enabled = !practiceState.enabled;
    if (!practiceState.enabled) {
      practiceState.running = false;
      practiceState.countdown = false;
      practiceState.sectionIndex = 0;
      practiceState.sectionTimes = [];
      T.s = "idle";
      $('#tm').textContent = "0.00";
      $('#hint').textContent = "Hold Space (or tap and hold)";
    }
    syncTimerPracticeUI();
    updatePracticeFocusBody();
    return;
  }

  const focusToggle = event.target.closest("#timer-focus-toggle");
  if (focusToggle) {
    practiceState.focus = !practiceState.focus;
    updatePracticeFocusBody();
    syncTimerPracticeUI();
    return;
  }
});

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "inspection-time") {
    practiceState.inspection = Number(event.target.value || 0);
    syncTimerPracticeUI();
  }
});

document.addEventListener("keydown", handlePracticeKeydown);
document.addEventListener("keyup", handlePracticeKeyup);
document.addEventListener("pointerdown", handlePracticePointerDown);
document.addEventListener("pointerup", handlePracticePointerUp);

const observer = new MutationObserver(() => {
  ensurePracticeState();
  if (tab === "timer") {
    syncTimerPracticeUI();
    updatePracticeFocusBody();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

syncTimerPracticeUI();
updatePracticeFocusBody();
