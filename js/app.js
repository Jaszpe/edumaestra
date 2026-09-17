/* js/app.js — panel de la maestra */

const sectionInfo = {
  inicio: ["Inicio", "Resumen de tu gestión educativa"],
  estudiantes: ["Estudiantes", "Lista y datos de tus estudiantes"],
  asistencia: ["Asistencia", "Control diario de asistencia y tardanzas"],
  evaluaciones: ["Evaluaciones", "Competencias, criterios y calificaciones"],
  incidencias: ["Incidencias", "Registro de situaciones y observaciones"],
  reportes: ["Reportes", "Resumen de asistencia y registros"],
  configuracion: ["Configuración", "Personaliza EduMaestra"]
};

let classroomFilter = "Todos";
let currentSection = "inicio";

/* ── Utilidades UI ── */
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function celebrate() {
  const emojis = ["🌸", "⭐", "🎉", "💖", "🌈", "✨", "🎈"];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement("span");
    el.className = "confetti";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 14 + Math.random() * 20 + "px";
    el.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

function animateNumber(el, value) {
  const start = Number(String(el.textContent).replace(/\D/g, "")) || 0;
  const duration = 600;
  const t0 = performance.now();
  function step(t) {
    const p = Math.min((t - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (value - start) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function goTo(section) {
  currentSection = section;
  $$(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.section === section));
  $$(".page-section").forEach(s => s.classList.toggle("active", s.id === section));
  const info = sectionInfo[section];
  $("#pageTitle").textContent = info[0];
  $("#pageSubtitle").textContent = info[1];
  $("#sidebar").classList.remove("open");
  renderAll();
}

function filteredStudents() {
  return db.students.filter(s => classroomFilter === "Todos" || s.classroom === classroomFilter);
}

function syncClassroomControls() {
  $$("#studentChips .chip, #evalChips .chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.room === classroomFilter);
  });
  const attendanceClass = $("#attendanceClass");
  if (attendanceClass && attendanceClass.value !== classroomFilter) attendanceClass.value = classroomFilter;
}

function setClassroomFilter(room) {
  classroomFilter = room || "Todos";
  syncClassroomControls();
  renderAll();
}

/* ── Modal ── */
function openModal(title, html, onSubmit) {
  $("#modalTitle").textContent = title;
  $("#modalForm").innerHTML = `
    <div class="modal-form">
      ${html}
      <div class="modal-actions">
        <button type="button" class="secondary-modal" id="cancelModal">Cancelar</button>
        <button type="submit" class="primary-btn">Guardar 🌸</button>
      </div>
    </div>`;
  $("#modal").classList.remove("hidden");
  $("#cancelModal").onclick = closeModal;
  $("#modalForm").onsubmit = e => {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  };
}

function closeModal() {
  $("#modal").classList.add("hidden");
  $("#modalForm").innerHTML = "";
}

/* ── Estudiantes ── */
function renderStudents() {
  const query = ($("#studentSearch").value || "").toLowerCase().trim();
  const list = filteredStudents()
    .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(query));

  $("#studentCount").textContent = `${list.length} estudiante(s)`;

  $("#studentsTable").innerHTML = list.length
    ? list.map(s => `
      <tr>
        <td class="avatar-cell">${s.avatar || "🧒"}</td>
        <td><strong>${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}</strong></td>
        <td><span class="tag">${escapeHTML(s.classroom)}</span></td>
        <td>${formatDate(s.birthDate)}</td>
        <td>${escapeHTML(s.guardian || "—")}</td>
        <td>${escapeHTML(s.phone || "—")}</td>
        <td>
          <button class="action-btn" data-edit-student="${s.id}" title="Editar estudiante" aria-label="Editar ${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}">✏️</button>
          <button class="action-btn delete-btn" data-delete-student="${s.id}" title="Eliminar" aria-label="Eliminar ${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}">🗑️</button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="7"><div class="empty-state">No hay estudiantes con ese filtro 🌸</div></td></tr>`;
}

function studentFormHTML(student = {}) {
  const minBirthDate = minBirthDateForMaxAge(6);
  const maxBirthDate = dateForAge(2);
  return `
    <label class="modal-form-field">Nombres<input name="firstName" value="${escapeHTML(student.firstName || "")}" required></label>
    <label class="modal-form-field">Apellidos<input name="lastName" value="${escapeHTML(student.lastName || "")}" required></label>
    <label class="modal-form-field">Salón
      <select name="classroom">${CLASSROOMS.map(c => `<option ${student.classroom === c ? "selected" : ""}>${c}</option>`).join("")}</select>
    </label>
    <label class="modal-form-field">Fecha de nacimiento<input name="birthDate" type="date" min="${minBirthDate}" max="${maxBirthDate}" value="${escapeHTML(student.birthDate || "")}" required></label>
    <label class="modal-form-field">Padre / apoderado<input name="guardian" value="${escapeHTML(student.guardian || "")}"></label>
    <label class="modal-form-field">Teléfono<input name="phone" inputmode="tel" value="${escapeHTML(student.phone || "")}"></label>
    <label class="modal-form-field">Género
      <select name="gender"><option value="F" ${student.gender !== "M" ? "selected" : ""}>Niña</option><option value="M" ${student.gender === "M" ? "selected" : ""}>Niño</option></select>
    </label>
  `;
}

function studentPayloadFromForm(form, existing = {}) {
  const gender = form.get("gender");
  const avatars = gender === "M"
    ? ["🦁","🐯","🐻","🦊","🐨","🐼","🐵","🐸","🦖","🐬"]
    : ["🦄","🐰","🐱","🐶","🐨","🐼","🐧","🦋","🌸","🐣"];

  return {
    ...existing,
    firstName: form.get("firstName").trim(),
    lastName: form.get("lastName").trim(),
    classroom: form.get("classroom"),
    birthDate: form.get("birthDate"),
    guardian: form.get("guardian").trim(),
    phone: form.get("phone").trim(),
    gender,
    avatar: existing.avatar && existing.gender === gender
      ? existing.avatar
      : avatars[Math.floor(Math.random() * avatars.length)]
  };
}

function addStudent() {
  openModal("Nuevo estudiante 👧", studentFormHTML(), form => {
    if (!isAgeInRange(form.get("birthDate"), 2, 6)) {
      showToast("Edad inválida: el estudiante debe tener entre 2 y 6 años.");
      return;
    }
    db.students.push({
      id: uid(),
      ...studentPayloadFromForm(form)
    });
    saveData(); closeModal(); renderAll(); celebrate(); showToast("¡Estudiante registrado! 🎉");
  });
}

function editStudent(id) {
  const index = db.students.findIndex(s => s.id === id);
  if (index < 0) return;
  const student = db.students[index];
  openModal("Editar estudiante ✏️", studentFormHTML(student), form => {
    if (!isAgeInRange(form.get("birthDate"), 2, 6)) {
      showToast("Edad inválida: el estudiante debe tener entre 2 y 6 años.");
      return;
    }
    db.students[index] = studentPayloadFromForm(form, student);
    saveData(); closeModal(); renderAll(); showToast("Datos del estudiante actualizados.");
  });
}

/* ── Asistencia ── */
function renderAttendance() {
  const date = $("#attendanceDate").value || todayISO();
  $("#attendanceDate").value = date;
  const room = $("#attendanceClass").value || classroomFilter;
  classroomFilter = room;
  syncClassroomControls();
  const students = filteredStudents();

  $("#attendanceCount").textContent = `${students.length} estudiantes · ${room}`;

  $("#attendanceTable").innerHTML = students.length
    ? students.map(s => {
        const existing = db.attendance.find(a => a.date === date && a.studentId === s.id);
        const status = existing?.status || "Presente";
        return `<tr>
          <td>${s.avatar || "🧒"} ${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}</td>
          <td>
            <select class="status-select attendance-status" data-student="${s.id}">
              ${ATT_STATUS.map(x => `<option ${x === status ? "selected" : ""}>${x}</option>`).join("")}
            </select>
          </td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="2"><div class="empty-state">No hay estudiantes en este salón.</div></td></tr>`;
}

function saveAttendance() {
  const date = $("#attendanceDate").value;
  const selects = $$(".attendance-status");
  if (!selects.length) { showToast("No hay estudiantes para registrar."); return; }

  selects.forEach(select => {
    const studentId = select.dataset.student;
    const index = db.attendance.findIndex(a => a.date === date && a.studentId === studentId);
    const record = { id: index >= 0 ? db.attendance[index].id : uid(), date, studentId, status: select.value };
    if (index >= 0) db.attendance[index] = record;
    else db.attendance.push(record);
  });
  saveData(); renderAll(); celebrate(); showToast("¡Asistencia guardada! 💖");
}

/* ── Evaluaciones ── */
function renderEvaluations() {
  const list = db.evaluations
    .filter(e => {
      if (classroomFilter === "Todos") return true;
      const s = studentById(e.studentId);
      return s && s.classroom === classroomFilter;
    })
    .slice()
    .reverse()
    .slice(0, 200);

  $("#evaluationsTable").innerHTML = list.length
    ? list.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${escapeHTML(studentName(e.studentId))}</td>
        <td>${escapeHTML(e.area)}</td>
        <td>${escapeHTML(e.criterion)}</td>
        <td><span class="level level-${e.level}">${e.level}</span></td>
      </tr>`).join("")
    : `<tr><td colspan="5"><div class="empty-state">No hay evaluaciones registradas.</div></td></tr>`;
}

function addEvaluation() {
  if (!db.students.length) { alert("Primero registra al menos un estudiante."); return; }
  openModal("Nueva evaluación 📝", `
    <label class="modal-form-field">Estudiante
      <select name="studentId" required>
        ${CLASSROOMS.map(room => {
          const list = db.students.filter(s => s.classroom === room);
          if (!list.length) return "";
          return `<optgroup label="${room}">${list.map(s =>
            `<option value="${s.id}">${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}</option>`).join("")}</optgroup>`;
        }).join("")}
      </select>
    </label>
    <label class="modal-form-field">Fecha<input name="date" type="date" value="${todayISO()}" required></label>
    <label class="modal-form-field">Área / competencia
      <select name="area">${AREAS.map(a => `<option>${a}</option>`).join("")}</select>
    </label>
    <label class="modal-form-field">Criterio de evaluación<textarea name="criterion" rows="3" required></textarea></label>
    <label class="modal-form-field">Nivel
      <select name="level">${LEVELS.map(l => `<option value="${l}">${l} — ${LEVEL_LABEL[l]}</option>`).join("")}</select>
    </label>
  `, form => {
    db.evaluations.push({
      id: uid(),
      studentId: form.get("studentId"),
      date: form.get("date"),
      area: form.get("area"),
      criterion: form.get("criterion").trim(),
      level: form.get("level")
    });
    saveData(); closeModal(); renderAll(); celebrate(); showToast("¡Evaluación registrada! 🌟");
  });
}

/* ── Incidencias ── */
function renderIncidents() {
  const studentIds = new Set(filteredStudents().map(s => s.id));
  const list = db.incidents
    .filter(i => classroomFilter === "Todos" || studentIds.has(i.studentId))
    .slice()
    .reverse()
    .slice(0, 100);
  $("#incidentsTable").innerHTML = list.length
    ? list.map(i => `
      <tr>
        <td>${formatDate(i.date)}</td>
        <td>${escapeHTML(studentName(i.studentId))}</td>
        <td><span class="tag">${escapeHTML(i.type)}</span></td>
        <td>${escapeHTML(i.description)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4"><div class="empty-state">No hay incidencias registradas 🎉</div></td></tr>`;
}

function addIncident() {
  if (!db.students.length) { alert("Primero registra al menos un estudiante."); return; }
  openModal("Nueva incidencia ⚠️", `
    <label class="modal-form-field">Estudiante
      <select name="studentId">
        ${CLASSROOMS.map(room => {
          const list = db.students.filter(s => s.classroom === room);
          if (!list.length) return "";
          return `<optgroup label="${room}">${list.map(s =>
            `<option value="${s.id}">${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}</option>`).join("")}</optgroup>`;
        }).join("")}
      </select>
    </label>
    <label class="modal-form-field">Fecha<input name="date" type="date" value="${todayISO()}"></label>
    <label class="modal-form-field">Tipo
      <select name="type">
        <option>Conducta</option><option>Convivencia</option><option>Salud</option>
        <option>Académica</option><option>Otra</option>
      </select>
    </label>
    <label class="modal-form-field">Descripción<textarea name="description" rows="4" required></textarea></label>
  `, form => {
    db.incidents.push({
      id: uid(),
      studentId: form.get("studentId"),
      date: form.get("date"),
      type: form.get("type"),
      description: form.get("description").trim()
    });
    saveData(); closeModal(); renderAll(); showToast("Incidencia registrada.");
  });
}

/* ── Dashboard ── */
function renderDashboard() {
  const teacherName = db.settings.teacherName || "Jaret Amparo";
  const schoolName = db.settings.schoolName || "Educación Inicial";
  const firstName = teacherName.split(" ")[0] || "maestra";

  $("#teacherChipName").textContent = teacherName;
  $("#schoolChipName").textContent = schoolName;
  $("#welcomeTitle").textContent = `Hola, maestra ${firstName} 👋`;
  $("#welcomeSubtitle").textContent = `${schoolName} · salas de 3, 4 y 5 años.`;

  const students = filteredStudents();
  const studentIds = new Set(students.map(s => s.id));
  const attendance = db.attendance.filter(a => classroomFilter === "Todos" || studentIds.has(a.studentId));
  const evaluations = db.evaluations.filter(e => classroomFilter === "Todos" || studentIds.has(e.studentId));
  const incidents = db.incidents.filter(i => classroomFilter === "Todos" || studentIds.has(i.studentId));
  const families = db.parents.filter(p => classroomFilter === "Todos" || studentIds.has(p.childId));
  const scopeLabel = classroomFilter === "Todos" ? "3 salones de inicial" : `salón de ${classroomFilter}`;

  animateNumber($("#statStudents"), students.length);
  animateNumber($("#statAttendance"), attendance.length);
  animateNumber($("#statEvaluations"), evaluations.length);
  animateNumber($("#statIncidents"), incidents.length);

  $("#today").textContent = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date());

  /* Tarjetas por salón */
  const emojis = { "3 años": "🧸", "4 años": "🎨", "5 años": "🚀" };
  const classes = { "3 años": "r3", "4 años": "r4", "5 años": "r5" };
  $("#roomsGrid").innerHTML = CLASSROOMS.map(room => {
    const total = db.students.filter(s => s.classroom === room).length;
    return `<div class="room-card ${classes[room]}" data-room-card="${room}">
      <h4>${room}</h4>
      <p>${total} estudiantes</p>
      <span class="room-emoji">${emojis[room]}</span>
    </div>`;
  }).join("");

  /* Resumen */
  const present = attendance.filter(a => a.status === "Presente").length;
  const absent = attendance.filter(a => a.status === "Ausente").length;
  const late = attendance.filter(a => a.status === "Tardanza").length;
  const total = attendance.length || 1;
  const rate = Math.round(((present + late) / total) * 100);

  $("#homeSummary").innerHTML = students.length
    ? `<div class="mini-list">
        <div class="mini-item"><span class="mi-emoji">👩‍🎓</span><div class="mi-body"><strong>${students.length} estudiantes</strong><small>en ${scopeLabel}</small></div></div>
        <div class="mini-item"><span class="mi-emoji">✅</span><div class="mi-body"><strong>${rate}% de asistencia</strong><small>${present} presentes · ${late} tardanzas · ${absent} ausencias</small></div></div>
        <div class="mini-item"><span class="mi-emoji">📝</span><div class="mi-body"><strong>${evaluations.length} evaluaciones</strong><small>registradas en total</small></div></div>
        <div class="mini-item"><span class="mi-emoji">👨‍👩‍👧</span><div class="mi-body"><strong>${families.length} familias</strong><small>con cuenta en el portal</small></div></div>
      </div>`
    : `<div class="empty-state">Empieza registrando tu primer estudiante 🌸</div>`;

  $("#reportPresent").textContent = present;
  $("#reportAbsent").textContent = absent;
  $("#reportLate").textContent = late;
  $("#reportRate").textContent = rate + "%";
}

function renderAreaReport() {
  const students = filteredStudents();
  const studentIds = new Set(students.map(s => s.id));
  const evaluations = db.evaluations.filter(e => classroomFilter === "Todos" || studentIds.has(e.studentId));
  const scope = classroomFilter === "Todos" ? "Todos los salones" : `Salón ${classroomFilter}`;
  const scoreByLevel = { AD: 100, A: 80, B: 55, C: 30 };

  $("#areaReportScope").textContent = scope;

  if (!evaluations.length) {
    $("#areaInsight").innerHTML = `<div class="empty-state">Todavía no hay evaluaciones para este filtro.</div>`;
    $("#areaBars").innerHTML = "";
    return;
  }

  const rows = AREAS.map(area => {
    const areaEvals = evaluations.filter(e => e.area === area);
    const total = areaEvals.length;
    const average = total
      ? Math.round(areaEvals.reduce((sum, e) => sum + (scoreByLevel[e.level] || 0), 0) / total)
      : 0;
    const needsSupport = areaEvals.filter(e => e.level === "B" || e.level === "C").length;
    return { area, total, average, needsSupport };
  });

  const withData = rows.filter(row => row.total > 0);
  const weakest = withData.slice().sort((a, b) => a.average - b.average || b.needsSupport - a.needsSupport)[0];
  const strongest = withData.slice().sort((a, b) => b.average - a.average)[0];

  $("#areaInsight").innerHTML = weakest
    ? `<div class="mini-list">
        <div class="mini-item">
          <span class="mi-emoji">🔎</span>
          <div class="mi-body"><strong>Área para observar: ${escapeHTML(weakest.area)}</strong><small>${weakest.average}% de avance promedio · ${weakest.needsSupport} registro(s) en B/C</small></div>
        </div>
        <div class="mini-item">
          <span class="mi-emoji">🌟</span>
          <div class="mi-body"><strong>Área más fuerte: ${escapeHTML(strongest.area)}</strong><small>${strongest.average}% de avance promedio</small></div>
        </div>
      </div>`
    : `<div class="empty-state">Todavía no hay evaluaciones por área.</div>`;

  $("#areaBars").innerHTML = rows.map(row => {
    const color = row.average >= 80 ? "mint" : row.average >= 60 ? "lav" : row.average >= 40 ? "sun" : "pink";
    const detail = row.total ? `${row.total} evaluación(es) · ${row.needsSupport} en B/C` : "Sin evaluaciones";
    return `<div class="bar-row">
      <div class="bar-top"><span>${escapeHTML(row.area)}</span><span>${row.average}%</span></div>
      <div class="bar-track"><div class="bar-fill ${color}" style="width:${row.average}%"></div></div>
      <small class="muted">${detail}</small>
    </div>`;
  }).join("");
}

/* ── Configuración ── */
function renderSettings() {
  $("#teacherName").value = db.settings.teacherName || "";
  $("#schoolName").value = db.settings.schoolName || "";
  $("#accentColor").value = db.settings.accentColor || "#ff6fa5";
  document.documentElement.style.setProperty("--primary", db.settings.accentColor || "#ff6fa5");
}

function renderAll() {
  syncClassroomControls();
  renderDashboard();
  renderStudents();
  renderAttendance();
  renderEvaluations();
  renderIncidents();
  renderAreaReport();
  renderSettings();
}

/* ── Arranque del panel maestra ── */
document.addEventListener("DOMContentLoaded", () => {
  $$(".nav-item").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.section)));
  $$("[data-go]").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.go)));

  $("#menuToggle").onclick = () => $("#sidebar").classList.toggle("open");
  $("#closeModal").onclick = closeModal;
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });

  /* Filtros por salón */
  $("#studentChips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    setClassroomFilter(chip.dataset.room);
  });

  $("#evalChips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    setClassroomFilter(chip.dataset.room);
  });

  $("#roomsGrid").addEventListener("click", e => {
    const card = e.target.closest("[data-room-card]");
    if (!card) return;
    setClassroomFilter(card.dataset.roomCard);
    goTo("estudiantes");
  });

  /* Estudiantes */
  $("#newStudentBtn").onclick = addStudent;
  $("#studentSearch").oninput = renderStudents;

  $("#studentsTable").addEventListener("click", e => {
    const editBtn = e.target.closest("[data-edit-student]");
    if (editBtn) {
      editStudent(editBtn.dataset.editStudent);
      return;
    }

    const btn = e.target.closest("[data-delete-student]");
    if (!btn) return;
    const id = btn.dataset.deleteStudent;
    if (!confirm("¿Eliminar este estudiante y todos sus registros?")) return;
    db.students = db.students.filter(s => s.id !== id);
    db.attendance = db.attendance.filter(a => a.studentId !== id);
    db.evaluations = db.evaluations.filter(a => a.studentId !== id);
    db.incidents = db.incidents.filter(a => a.studentId !== id);
    saveData(); renderAll(); showToast("Estudiante eliminado.");
  });

  /* Asistencia */
  $("#attendanceDate").value = todayISO();
  $("#attendanceDate").onchange = renderAttendance;
  $("#attendanceClass").onchange = () => setClassroomFilter($("#attendanceClass").value);
  $("#saveAttendance").onclick = saveAttendance;

  /* Evaluaciones e incidencias */
  $("#newEvaluationBtn").onclick = addEvaluation;
  $("#newIncidentBtn").onclick = addIncident;

  /* Configuración */
  $("#saveSettings").onclick = () => {
    db.settings.teacherName = $("#teacherName").value.trim();
    db.settings.schoolName = $("#schoolName").value.trim();
    db.settings.accentColor = $("#accentColor").value;
    saveData(); renderSettings(); showToast("Configuración guardada 🌸");
  };

  $("#regenDemo").onclick = () => {
    if (!confirm("Esto reemplazará todos los datos actuales por 90 alumnos de demostración. ¿Continuar?")) return;
    regenerateDemo(); renderAll(); celebrate(); showToast("¡Datos de demostración generados! 🎲");
  };

  $("#clearData").onclick = () => {
    if (!confirm("Esto eliminará TODOS los datos guardados en este navegador. ¿Continuar?")) return;
    resetData(); location.reload();
  };

  renderAll();
});
