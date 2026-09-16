/* js/app.js — panel de la maestra */

const sectionInfo = {
  inicio: ["Inicio", "Resumen de tu gestión educativa"],
  estudiantes: ["Estudiantes", "Lista y datos de tus estudiantes"],
  asistencia: ["Asistencia", "Control diario de asistencia y tardanzas"],
  evaluaciones: ["Evaluaciones", "Competencias, criterios y calificaciones"],
  incidencias: ["Incidencias", "Registro de situaciones y observaciones"],
  reportes: ["Reportes", "Resumen y exportación de información"],
  configuracion: ["Configuración", "Personaliza EduMaestra"]
};

let studentFilter = "Todos";
let evalFilter = "Todos";
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
  const list = db.students
    .filter(s => studentFilter === "Todos" || s.classroom === studentFilter)
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
  return `
    <label class="modal-form-field">Nombres<input name="firstName" value="${escapeHTML(student.firstName || "")}" required></label>
    <label class="modal-form-field">Apellidos<input name="lastName" value="${escapeHTML(student.lastName || "")}" required></label>
    <label class="modal-form-field">Salón
      <select name="classroom">${CLASSROOMS.map(c => `<option ${student.classroom === c ? "selected" : ""}>${c}</option>`).join("")}</select>
    </label>
    <label class="modal-form-field">Fecha de nacimiento<input name="birthDate" type="date" value="${escapeHTML(student.birthDate || "")}"></label>
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
    db.students[index] = studentPayloadFromForm(form, student);
    saveData(); closeModal(); renderAll(); showToast("Datos del estudiante actualizados.");
  });
}

/* ── Asistencia ── */
function renderAttendance() {
  const date = $("#attendanceDate").value || todayISO();
  $("#attendanceDate").value = date;
  const room = $("#attendanceClass").value;
  const students = db.students.filter(s => s.classroom === room);

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
      if (evalFilter === "Todos") return true;
      const s = studentById(e.studentId);
      return s && s.classroom === evalFilter;
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
  const list = db.incidents.slice().reverse().slice(0, 100);
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

  animateNumber($("#statStudents"), db.students.length);
  animateNumber($("#statAttendance"), db.attendance.length);
  animateNumber($("#statEvaluations"), db.evaluations.length);
  animateNumber($("#statIncidents"), db.incidents.length);

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
  const present = db.attendance.filter(a => a.status === "Presente").length;
  const absent = db.attendance.filter(a => a.status === "Ausente").length;
  const late = db.attendance.filter(a => a.status === "Tardanza").length;
  const total = db.attendance.length || 1;
  const rate = Math.round(((present + late) / total) * 100);

  $("#homeSummary").innerHTML = db.students.length
    ? `<div class="mini-list">
        <div class="mini-item"><span class="mi-emoji">👩‍🎓</span><div class="mi-body"><strong>${db.students.length} estudiantes</strong><small>en 3 salones de inicial</small></div></div>
        <div class="mini-item"><span class="mi-emoji">✅</span><div class="mi-body"><strong>${rate}% de asistencia</strong><small>${present} presentes · ${late} tardanzas · ${absent} ausencias</small></div></div>
        <div class="mini-item"><span class="mi-emoji">📝</span><div class="mi-body"><strong>${db.evaluations.length} evaluaciones</strong><small>registradas en total</small></div></div>
        <div class="mini-item"><span class="mi-emoji">👨‍👩‍👧</span><div class="mi-body"><strong>${db.parents.length} familias</strong><small>con cuenta en el portal</small></div></div>
      </div>`
    : `<div class="empty-state">Empieza registrando tu primer estudiante 🌸</div>`;

  $("#reportPresent").textContent = present;
  $("#reportAbsent").textContent = absent;
  $("#reportLate").textContent = late;
  $("#reportRate").textContent = rate + "%";
}

/* ── Configuración ── */
function renderSettings() {
  $("#teacherName").value = db.settings.teacherName || "";
  $("#schoolName").value = db.settings.schoolName || "";
  $("#accentColor").value = db.settings.accentColor || "#ff6fa5";
  document.documentElement.style.setProperty("--primary", db.settings.accentColor || "#ff6fa5");
}

function renderAll() {
  renderDashboard();
  renderStudents();
  renderAttendance();
  renderEvaluations();
  renderIncidents();
  renderSettings();
}

/* ── Exportaciones ── */
function exportStudentsCSV() {
  const header = ["Nombres", "Apellidos", "Salón", "Fecha nacimiento", "Apoderado", "Teléfono"];
  const rows = db.students.map(s => [s.firstName, s.lastName, s.classroom, s.birthDate, s.guardian, s.phone]);
  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `edumaestra_estudiantes_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("CSV exportado 📊");
}

function exportEvaluationsCSV() {
  const header = ["Fecha", "Estudiante", "Salón", "Área", "Criterio", "Nivel"];
  const rows = db.evaluations.map(e => {
    const s = studentById(e.studentId);
    return [e.date, studentName(e.studentId), s?.classroom || "", e.area, e.criterion, e.level];
  });
  const csv = [header, ...rows]
    .map(row => row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `edumaestra_evaluaciones_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("CSV exportado 📝");
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
    studentFilter = chip.dataset.room;
    $$("#studentChips .chip").forEach(c => c.classList.toggle("active", c === chip));
    renderStudents();
  });

  $("#evalChips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    evalFilter = chip.dataset.room;
    $$("#evalChips .chip").forEach(c => c.classList.toggle("active", c === chip));
    renderEvaluations();
  });

  $("#roomsGrid").addEventListener("click", e => {
    const card = e.target.closest("[data-room-card]");
    if (!card) return;
    studentFilter = card.dataset.roomCard;
    $$("#studentChips .chip").forEach(c => c.classList.toggle("active", c.dataset.room === studentFilter));
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
  $("#attendanceClass").onchange = renderAttendance;
  $("#saveAttendance").onclick = saveAttendance;

  /* Evaluaciones e incidencias */
  $("#newEvaluationBtn").onclick = addEvaluation;
  $("#newIncidentBtn").onclick = addIncident;

  /* Respaldos */
  $("#exportBackup").onclick = exportBackup;
  $("#exportBackup2").onclick = exportBackup;
  $("#exportStudentsCsv").onclick = exportStudentsCSV;
  $("#exportEvaluationsCsv").onclick = exportEvaluationsCSV;
  $("#printReport").onclick = () => window.print();
  $("#importBackup").onchange = e => e.target.files[0] && importBackup(e.target.files[0]);

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
