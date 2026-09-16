/* js/storage.js — datos, utilidades y semilla demo */

const DB_KEY = "edumaestra_data_v2";
const SESSION_KEY = "edumaestra_session_v2";
const NEWS_KEY_PREFIX = "edumaestra_news_hidden_";

const CLASSROOMS = ["3 años", "4 años", "5 años"];
const AREAS = ["Comunicación", "Matemática", "Personal Social", "Ciencia y Tecnología"];
const LEVELS = ["AD", "A", "B", "C"];
const LEVEL_LABEL = { AD: "Logro destacado", A: "Logro esperado", B: "En proceso", C: "En inicio" };
const ATT_STATUS = ["Presente", "Ausente", "Tardanza", "Justificado"];

const CRITERIA = {
  "Comunicación": [
    "Se expresa oralmente con claridad",
    "Comprende cuentos y relatos breves",
    "Escribe su nombre con apoyo",
    "Participa en diálogos grupales"
  ],
  "Matemática": [
    "Cuenta hasta 20 objetos",
    "Reconoce figuras geométricas",
    "Clasifica por color y tamaño",
    "Resuelve problemas sencillos de cantidad"
  ],
  "Personal Social": [
    "Comparte con sus compañeros",
    "Respeta las normas del aula",
    "Reconoce y expresa sus emociones",
    "Colabora en las actividades grupales"
  ],
  "Ciencia y Tecnología": [
    "Explora su entorno con curiosidad",
    "Identifica seres vivos de su ambiente",
    "Realiza experimentos simples",
    "Cuida las plantas y animales"
  ]
};

/* ── Utilidades ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO() { return toISO(new Date()); }

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ── Aleatoriedad determinista ── */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ── Datos por defecto ── */
const defaultData = {
  seeded: true,
  students: [],
  attendance: [],
  evaluations: [],
  incidents: [],
  parents: [],
  settings: {
    teacherName: "Jaret Amparo",
    schoolName: "I.E. Los Pequeños",
    accentColor: "#ff6fa5"
  }
};

/* ── Semilla demo: 30 alumnos por salón ── */
const NAMES_BOY = ["Mateo","Liam","Thiago","Emiliano","Diego","Sebastián","Alejandro","Andrés","Adrián","Joaquín","Santiago","Gabriel","Nicolás","Daniel","Rodrigo","Bruno","Álvaro","Facundo","Gonzalo","Iker","Luca","Máximo","Renato","Tomás","Valentino","Aarón","Benjamín","Cristóbal","Eduardo","Fabián"];
const NAMES_GIRL = ["Sofía","Valentina","Camila","Isabella","Luciana","María","Emilia","Antonella","Aitana","Paula","Micaela","Fernanda","Daniela","Ximena","Renata","Zoe","Abril","Catalina","Delfina","Elena","Florencia","Guadalupe","Ivanna","Julieta","Kiara","Lía","Martina","Noelia","Oriana","Pía"];
const SURNAMES = ["Quispe","Flores","Mamani","Huamán","Condori","Chávez","Ramos","Rojas","Vásquez","Sánchez","Castillo","Mendoza","Álvarez","Torres","Ramírez","Gutiérrez","Paredes","Espinoza","Salazar","Cárdenas","Villanueva","Palomino","Yupanqui","Navarro","Delgado","Herrera","Campos","Suárez","Bravo","Ríos"];
const GUARDIAN_NAMES = ["Rosa","Carmen","Julia","Martha","Lucía","Ana","Silvia","Patricia","Gloria","Elena","Marisol","Nancy","Yolanda","Vilma","Jessica","Carlos","Luis","José","Pedro","Jorge","Miguel","Raúl","Víctor","Juan","Alberto","Marco","Percy","Wilder","Elmer","Edwin"];
const AVATAR_BOY = ["🦁","🐯","🐻","🦊","🐨","🐼","🐵","🐸","🦖","🐬"];
const AVATAR_GIRL = ["🦄","🐰","🐱","🐶","🐨","🐼","🐧","🦋","🌸","🐣"];

function lastSchoolDays(n) {
  const days = [];
  const d = new Date();
  while (days.length < n) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(toISO(d));
    d.setDate(d.getDate() - 1);
  }
  return days.reverse();
}

function createSeedData() {
  const rnd = mulberry32(20250915);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const students = [];
  const now = new Date();

  CLASSROOMS.forEach((room, idx) => {
    const boys = shuffle(NAMES_BOY).slice(0, 15).map(n => ({ n, g: "M" }));
    const girls = shuffle(NAMES_GIRL).slice(0, 15).map(n => ({ n, g: "F" }));
    const roster = shuffle([...boys, ...girls]);

    roster.forEach(child => {
      const age = idx + 3;
      const birthYear = now.getFullYear() - age;
      const birthMonth = 1 + Math.floor(rnd() * 12);
      const birthDay = 1 + Math.floor(rnd() * 28);
      const surname1 = pick(SURNAMES);
      const surname2 = pick(SURNAMES);
      students.push({
        id: uid(),
        firstName: child.n,
        lastName: `${surname1} ${surname2}`,
        classroom: room,
        birthDate: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
        guardian: `${pick(GUARDIAN_NAMES)} ${surname1}`,
        phone: "9" + Math.floor(10000000 + rnd() * 89999999),
        gender: child.g,
        avatar: child.g === "M" ? pick(AVATAR_BOY) : pick(AVATAR_GIRL)
      });
    });
  });

  /* Asistencias de los últimos 10 días hábiles */
  const days = lastSchoolDays(10);
  const attendance = [];
  days.forEach(date => {
    students.forEach(s => {
      const r = rnd();
      let status = "Presente";
      if (r < 0.07) status = "Ausente";
      else if (r < 0.14) status = "Tardanza";
      else if (r < 0.18) status = "Justificado";
      attendance.push({ id: uid(), date, studentId: s.id, status });
    });
  });

  /* Evaluaciones: una por área */
  const evaluations = [];
  students.forEach(s => {
    AREAS.forEach(area => {
      const r = rnd();
      let level = "A";
      if (r < 0.25) level = "AD";
      else if (r < 0.70) level = "A";
      else if (r < 0.92) level = "B";
      else level = "C";
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(rnd() * 45));
      evaluations.push({
        id: uid(),
        studentId: s.id,
        date: toISO(d),
        area,
        criterion: pick(CRITERIA[area]),
        level
      });
    });
  });

  /* Incidencias demo */
  const incidents = [];
  const types = ["Conducta", "Convivencia", "Salud", "Académica", "Otra"];
  for (let i = 0; i < 12; i++) {
    const s = pick(students);
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(rnd() * 30));
    incidents.push({
      id: uid(),
      studentId: s.id,
      date: toISO(d),
      type: pick(types),
      description: "Observación registrada durante la jornada escolar."
    });
  }

  return {
    seeded: true,
    students,
    attendance,
    evaluations,
    incidents,
    parents: [],
    settings: { ...defaultData.settings }
  };
}

/* ── Persistencia ── */
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved && saved.seeded) return { ...defaultData, ...saved };
  } catch (e) { /* ignorar */ }

  const seeded = createSeedData();
  try { localStorage.setItem(DB_KEY, JSON.stringify(seeded)); } catch (e) {}
  return seeded;
}

let db = loadData();

function saveData() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    alert("No se pudo guardar: el almacenamiento del navegador está lleno.");
  }
}

function resetData() {
  db = { ...defaultData, students: [], attendance: [], evaluations: [], incidents: [], parents: [] };
  saveData();
}

function regenerateDemo() {
  db = createSeedData();
  saveData();
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportBackup() {
  downloadJSON(`edumaestra_backup_${todayISO()}.json`, db);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || !Array.isArray(imported.students)) throw new Error("Formato inválido");
      db = { ...defaultData, ...imported, seeded: true };
      saveData();
      location.reload();
    } catch (e) {
      alert("El archivo no parece ser un respaldo válido de EduMaestra.");
    }
  };
  reader.readAsText(file);
}

/* ── Búsquedas ── */
function studentName(id) {
  const s = db.students.find(x => x.id === id);
  return s ? `${s.firstName} ${s.lastName}` : "—";
}

function studentById(id) {
  return db.students.find(x => x.id === id);
}
