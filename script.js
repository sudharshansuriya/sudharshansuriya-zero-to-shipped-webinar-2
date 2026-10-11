// ---- Skill list to check against ----

const ALL_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL",
  "Git", "Docker", "AWS", "HTML", "CSS", "REST APIs",
  "PostgreSQL", "MongoDB", "CI/CD", "Jest", "Linux", "Agile",
];

// ---- Elements ----

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const chooseBtn = document.getElementById("choose-btn");
const dropzoneHint = document.getElementById("dropzone-hint");

const stateUpload = document.getElementById("state-upload");
const stateParsing = document.getElementById("state-parsing");
const stateResults = document.getElementById("state-results");

const parseFile = document.getElementById("parse-file");
const parseFill = document.getElementById("parse-fill");
const parseLabel = document.getElementById("parse-label");

const resultsFile = document.getElementById("results-file");
const gauge = document.querySelector(".gauge");
const scoreEl = document.getElementById("score");
const presentChips = document.getElementById("present-chips");
const missingChips = document.getElementById("missing-chips");
const resetBtn = document.getElementById("reset-btn");

// ---- Helpers ----

function showState(name) {
  stateUpload.classList.toggle("hidden", name !== "upload");
  stateParsing.classList.toggle("hidden", name !== "parsing");
  stateResults.classList.toggle("hidden", name !== "results");
}

function makeChip(label, kind) {
  const chip = document.createElement("span");
  chip.className = `chip chip-${kind}`;
  chip.textContent = label;
  return chip;
}

function renderSkills(present, missing) {
  presentChips.innerHTML = "";
  missingChips.innerHTML = "";

  present.forEach((skill) => presentChips.appendChild(makeChip(skill, "present")));
  if (!present.length) {
    presentChips.appendChild(makeChip("none detected", "missing"));
  }

  missing.forEach((skill) => missingChips.appendChild(makeChip(skill, "missing")));
  if (!missing.length) {
    missingChips.appendChild(makeChip("none — great coverage", "present"));
  }
}

function renderScore(score) {
  // conic-gradient takes degrees: 0% = 0deg, 100% = 360deg
  const deg = Math.round((score / 100) * 360);
  gauge.style.background = `conic-gradient(var(--accent) ${deg}deg, var(--surface-2) ${deg}deg)`;
  scoreEl.textContent = score;
}

// ---- Mock parse (no real backend) ----

// Picks a deterministic-looking score + which skills were "found",
// based on the filename, so the same file always gets the same result.
function mockParse(fileName) {
  let seed = [...fileName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const score = 40 + Math.floor(rand() * 51); // 40–90

  const present = ALL_SKILLS.filter(() => rand() > 0.4);
  const missing = ALL_SKILLS.filter((s) => !present.includes(s));

  return { score, present, missing };
}

// ---- Flow ----

function handleFile(file) {
  if (!file) return;

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    dropzoneHint.textContent = "That's not a PDF — please choose a .pdf file.";
    dropzoneHint.classList.add("dropzone-error");
    return;
  }
  dropzoneHint.textContent = "PDF only, max ~10 MB";
  dropzoneHint.classList.remove("dropzone-error");

  // 1. switch to the "parsing" state and fake an upload
  showState("parsing");
  parseFile.textContent = file.name;
  parseLabel.textContent = "Uploading…";
  parseFill.style.width = "0%";

  let progress = 0;
  const tick = setInterval(() => {
    progress += 10 + Math.random() * 15;
    parseFill.style.width = `${Math.min(progress, 100)}%`;

    if (progress >= 50 && progress < 80) parseLabel.textContent = "Extracting skills…";
    if (progress >= 80 && progress < 100) parseLabel.textContent = "Scoring…";

    if (progress >= 100) {
      clearInterval(tick);

      const { score, present, missing } = mockParse(file.name);
      renderSkills(present, missing);
      renderScore(score);
      resultsFile.textContent = file.name;

      parseLabel.textContent = "Done";
      setTimeout(() => showState("results"), 400);
    }
  }, 200);
}

// ---- Events ----

chooseBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  handleFile(fileInput.files[0]);
  fileInput.value = ""; // allow re-choosing the same file
});

// Drag & drop
["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  })
);

["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
  })
);

dropzone.addEventListener("drop", (e) => {
  handleFile(e.dataTransfer.files[0]);
});

resetBtn.addEventListener("click", () => {
  showState("upload");
});
