/* js/parent.js — portal de familias */

let currentPTab = "inicio";

/* ── EDUNOTICIAS ── */
function newsError(img) {
  if (img.dataset.fallback) {
    const fb = img.dataset.fallback;
    img.removeAttribute("data-fallback");
    img.src = fb;
  } else {
    img.classList.add("broken");
  }
}

function isNewsHidden(parentId) {
  return localStorage.getItem(NEWS_KEY_PREFIX + parentId) === "1";
}

function setNewsHidden(parentId, hidden) {
  if (hidden) localStorage.setItem(NEWS_KEY_PREFIX + parentId, "1");
  else localStorage.removeItem(NEWS_KEY_PREFIX + parentId);
}

function refreshNewsVisibility(parentId) {
  const hidden = isNewsHidden(parentId);
  const box = $("#newsBox");
  box.classList.toggle("hidden", hidden);
  $("#reopenNews").classList.toggle("hidden", !hidden);
}

/* ── Navegación de pestañas ── */
function parentGoTo(tab) {
  currentPTab = tab;
  $$(".ptab").forEach(b => b.classList.toggle("active", b.dataset.ptab === tab));
  $$(".p-section").forEach(s => s.classList.toggle("active", s.id === "p-" + tab));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── Render principal ── */
function renderParentPortal() {
  if (!parentSession) return;
  const parent = db.parents.find(p => p.id === parentSession.id);
  if (!parent) { logout(); return; }

  const child = studentById(parent.childId);
  const childPill = $("#pChildPill");
  const hero = $("#childHero");

  if (!child) {
    childPill.textContent = "";
    hero.innerHTML = `<div class="empty-state">No encontramos los datos de tu hijo/a. Contacta a la maestra 🌸</div>`;
    return;
  }

  childPill.textContent = `👧 ${child.firstName} · ${child.classroom}`;

  const age = child.birthDate
    ? Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  hero.innerHTML = `
    <div class="child-avatar">${child.avatar || "🧒"}</div>
    <div>
      <h2>¡Hola! Soy ${escapeHTML(child.firstName)} ${escapeHTML(child.lastName)}</h2>
      <p>Salón de ${escapeHTML(child.classroom)}${age !== null ? ` · ${age} añitos` : ""}</p>
      <div class="child-tags">
        <span class="tag">🌸 Educación Inicial</span>
        <span class="tag">👩‍🏫 Jaret Amparo</span>
        <span class="tag">🎓 ${escapeHTML(db.settings.schoolName || "I.E. Los Pequeños")}</span>
      </div>
    </div>`;

  const att = db.attendance.filter(a => a.studentId === child.id);
  const present = att.filter(a => a.status === "Presente").length;
  const absent = att.filter(a => a.status === "Ausente").length;
  const late = att.filter(a => a.status === "Tardanza").length;
  const just = att.filter(a => a.status === "Justificado").length;
  const rate = att.length ? Math.round(((present + late) / att.length) * 100) : 0;

  const evals = db.evaluations.filter(e => e.studentId === child.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const incidents = db.incidents.filter(i => i.studentId === child.id);

  const levelCount = { AD: 0, A: 0, B: 0, C: 0 };
  evals.forEach(e => { if (levelCount[e.level] !== undefined) levelCount[e.level]++; });
  const topLevel = Object.entries(levelCount).sort((a, b) => b[1] - a[1])[0];

  /* Tarjetas resumen */
  animateNumber($("#pEvals"), evals.length);
  animateNumber($("#pIncidents"), incidents.length);
  $("#pRate").textContent = rate + "%";
  $("#pLevel").textContent = topLevel && topLevel[1] > 0 ? topLevel[0] : "—";

  /* Últimas evaluaciones */
  $("#pLatestEvals").innerHTML = evals.length
    ? evals.slice(0, 5).map(e => `
      <div class="mini-item">
        <span class="mi-emoji">📝</span>
        <div class="mi-body">
          <strong>${escapeHTML(e.area)}</strong>
          <small>${escapeHTML(e.criterion)} · ${formatDate(e.date)}</small>
        </div>
        <span class="level level-${e.level}">${e.level}</span>
      </div>`).join("")
    : `<div class="empty-state">Todavía no hay evaluaciones registradas 🌸</div>`;

  /* Tabla de notas */
  $("#pEvalTable").innerHTML = evals.length
    ? evals.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${escapeHTML(e.area)}</td>
        <td>${escapeHTML(e.criterion)}</td>
        <td><span class="level level-${e.level}">${e.level} · ${LEVEL_LABEL[e.level]}</span></td>
      </tr>`).join("")
    : `<tr><td colspan="4"><div class="empty-state">Sin evaluaciones registradas.</div></td></tr>`;

  /* Asistencia */
  $("#pPresent").textContent = present;
  $("#pAbsent").textContent = absent;
  $("#pLate").textContent = late;
  $("#pJust").textContent = just;

  const sortedAtt = att.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const statusEmoji = { Presente: "🟢", Ausente: "🔴", Tardanza: "🟡", Justificado: "🔵" };
  $("#pAttTable").innerHTML = sortedAtt.length
    ? sortedAtt.slice(0, 40).map(a => `
      <tr>
        <td>${formatDate(a.date)}</td>
        <td>${statusEmoji[a.status] || "⚪"} ${a.status}</td>
      </tr>`).join("")
    : `<tr><td colspan="2"><div class="empty-state">Sin registros de asistencia.</div></td></tr>`;

  /* Barras de niveles */
  const totalEvals = evals.length || 1;
  $("#pLevelBars").innerHTML = LEVELS.map(l => {
    const pct = Math.round((levelCount[l] / totalEvals) * 100);
    return `<div class="bar-row">
      <div class="bar-top"><span>${l} · ${LEVEL_LABEL[l]}</span><span>${levelCount[l]} (${pct}%)</span></div>
      <div class="bar-track"><div class="bar-fill ${l === "AD" ? "mint" : l === "A" ? "lav" : l === "B" ? "sun" : "pink"}" data-w="${pct}"></div></div>
    </div>`;
  }).join("");

  /* Barras de asistencia */
  const totalAtt = att.length || 1;
  const attRows = [
    ["Presente", present, "mint"],
    ["Tardanza", late, "sun"],
    ["Justificado", just, "lav"],
    ["Ausente", absent, "pink"]
  ];
  $("#pAttBars").innerHTML = attRows.map(([label, value, color]) => {
    const pct = Math.round((value / totalAtt) * 100);
    return `<div class="bar-row">
      <div class="bar-top"><span>${label}</span><span>${value} (${pct}%)</span></div>
      <div class="bar-track"><div class="bar-fill ${color}" data-w="${pct}"></div></div>
    </div>`;
  }).join("");

  /* Animación de barras */
  requestAnimationFrame(() => {
    $$(".bar-fill").forEach(bar => { bar.style.width = bar.dataset.w + "%"; });
  });

  /* EDUNOTICIAS */
  refreshNewsVisibility(parent.id);
}

/* ── Arranque del portal familia ── */
document.addEventListener("DOMContentLoaded", () => {
  $$(".ptab").forEach(tab => {
    tab.addEventListener("click", () => parentGoTo(tab.dataset.ptab));
  });

  $("#closeNews").addEventListener("click", () => {
    if (!parentSession) return;
    const box = $("#newsBox");
    box.classList.add("closing");
    setTimeout(() => {
      setNewsHidden(parentSession.id, true);
      box.classList.remove("closing");
      refreshNewsVisibility(parentSession.id);
      showToast("Puedes verla de nuevo cuando quieras 📰");
    }, 340);
  });

  $("#reopenNews").addEventListener("click", () => {
    if (!parentSession) return;
    setNewsHidden(parentSession.id, false);
    refreshNewsVisibility(parentSession.id);
    $("#newsBox").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#printParentReport").addEventListener("click", () => window.print());
});
