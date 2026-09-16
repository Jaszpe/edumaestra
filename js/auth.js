/* js/auth.js — login de maestra y familias */

const TEACHER_ACCOUNTS = [
  { user: "JARET AMPARO", pass: "jaret123", name: "Jaret" },
  { user: "JASS", pass: "jass123", name: "Jass" }
];

let parentSession = null;

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function showScreen(name) {
  $("#screen-login").classList.toggle("active", name === "login");
  $("#app-shell").classList.toggle("active", name === "teacher");
  $("#screen-parent").classList.toggle("active", name === "parent");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function logout() {
  clearSession();
  parentSession = null;
  showScreen("login");
  $("#teacherUser").value = "";
  $("#teacherPass").value = "";
  $("#teacherError").textContent = "";
  $("#pLoginEmail").value = "";
  $("#pLoginPass").value = "";
  $("#parentLoginError").textContent = "";
}

/* ── Login maestra ── */
function handleTeacherLogin(e) {
  e.preventDefault();
  const user = $("#teacherUser").value.trim().toUpperCase();
  const pass = $("#teacherPass").value;
  const account = TEACHER_ACCOUNTS.find(item => item.user === user && item.pass === pass);
  if (account) {
    saveSession({ role: "teacher", user: account.user, name: account.name });
    $("#teacherError").textContent = "";
    showScreen("teacher");
    renderAll();
    showToast(`¡Bienvenida, maestra ${account.name}! 🌸`);
  } else {  
    $("#teacherError").textContent = "Usuario o contraseña incorrectos 💔";
    $("#teacherPass").value = "";
  }
}

/* ── Registro de familias ── */
function fillRegisterChildren() {
  const room = $("#regClassroom").value;
  const query = $("#regChildSearch").value.trim().toLowerCase();
  const select = $("#regChild");

  if (!room) {
    select.innerHTML = `<option value="">Primero elige el salón</option>`;
    return;
  }
  const list = db.students
    .filter(s => s.classroom === room)
    .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(query));

  select.innerHTML = list.length
    ? list.map(s => `<option value="${s.id}">${escapeHTML(s.firstName)} ${escapeHTML(s.lastName)}</option>`).join("")
    : `<option value="">Sin resultados</option>`;
}

function handleParentRegister(e) {
  e.preventDefault();
  const error = $("#parentRegError");
  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim().toLowerCase();
  const pass = $("#regPass").value;
  const childId = $("#regChild").value;

  if (!name || !email || !pass) { error.textContent = "Completa todos los campos."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = "El correo no es válido."; return; }
  if (pass.length < 4) { error.textContent = "La contraseña debe tener al menos 4 caracteres."; return; }
  if (!childId) { error.textContent = "Selecciona a tu hijo/a."; return; }
  if (db.parents.some(p => p.email === email)) { error.textContent = "Ese correo ya está registrado."; return; }
  if (db.parents.some(p => p.childId === childId)) { error.textContent = "Ese estudiante ya tiene una cuenta de familia."; return; }

  const parent = { id: uid(), name, email, password: pass, childId, createdAt: todayISO() };
  db.parents.push(parent);
  saveData();

  error.textContent = "";
  $("#parentRegisterForm").reset();
  $("#parentRegisterForm").classList.add("hidden");
  $("#parentLoginForm").classList.remove("hidden");
  $("#pLoginEmail").value = email;
  showToast("¡Cuenta creada! Ahora inicia sesión 💖");
}

function handleParentLogin(e) {
  e.preventDefault();
  const email = $("#pLoginEmail").value.trim().toLowerCase();
  const pass = $("#pLoginPass").value;
  const parent = db.parents.find(p => p.email === email && p.password === pass);

  if (!parent) {
    $("#parentLoginError").textContent = "Correo o contraseña incorrectos 💔";
    return;
  }
  parentSession = { id: parent.id };
  saveSession({ role: "parent", id: parent.id });
  $("#parentLoginError").textContent = "";
  showScreen("parent");
  renderParentPortal();
  parentGoTo("inicio");
}

/* ── Arranque ── */
document.addEventListener("DOMContentLoaded", () => {
  /* Tabs del login */
  $$(".login-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".login-tab").forEach(t => t.classList.toggle("active", t === tab));
      const isTeacher = tab.dataset.role === "teacher";
      $("#teacherForm").classList.toggle("hidden", !isTeacher);
      $("#parentAuth").classList.toggle("hidden", isTeacher);
    });
  });

  $("#teacherForm").addEventListener("submit", handleTeacherLogin);
  $("#parentLoginForm").addEventListener("submit", handleParentLogin);
  $("#parentRegisterForm").addEventListener("submit", handleParentRegister);

  $("#showRegister").addEventListener("click", () => {
    $("#parentLoginForm").classList.add("hidden");
    $("#parentRegisterForm").classList.remove("hidden");
    $("#parentRegError").textContent = "";
  });
  $("#showLogin").addEventListener("click", () => {
    $("#parentRegisterForm").classList.add("hidden");
    $("#parentLoginForm").classList.remove("hidden");
    $("#parentRegError").textContent = "";
  });

  $("#regClassroom").addEventListener("change", fillRegisterChildren);
  $("#regChildSearch").addEventListener("input", fillRegisterChildren);

  $("#logoutTeacher").addEventListener("click", () => {
    if (confirm("¿Cerrar sesión de maestra?")) logout();
  });
  $("#logoutParent").addEventListener("click", () => {
    if (confirm("¿Cerrar sesión?")) logout();
  });

  /* Restaurar sesión */
  const session = getSession();
  if (session && session.role === "teacher") {
    showScreen("teacher");
  } else if (session && session.role === "parent") {
    const parent = db.parents.find(p => p.id === session.id);
    if (parent) {
      parentSession = { id: parent.id };
      showScreen("parent");
      renderParentPortal();
      parentGoTo("inicio");
    } else {
      clearSession();
    }
  }
});
