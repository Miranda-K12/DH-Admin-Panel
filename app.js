const MOCK_LOANS = [
  {
    id: "A-77801",
    borrower: "ირაკლი გიორგობიანი",
    amount: 12000,
    status: "FORWARDED_FOR_FINAL_DECISION",
    type: "MANUAL",
    updated: "2025-12-13",
  },
  {
    id: "A-77802",
    borrower: "ანა ქავთარაძე",
    amount: 7000,
    status: "APPROVE",
    type: "AUTO",
    updated: "2025-12-12",
  },
  {
    id: "A-77803",
    borrower: "გიორგი მაისურაძე",
    amount: 15000,
    status: "REJECT",
    type: "AUTO",
    updated: "2025-12-11",
  },
  {
    id: "A-77804",
    borrower: "ნინო მჭედლიძე",
    amount: 8000,
    status: "PARTIAL_APPROVE",
    type: "MANUAL",
    updated: "2025-12-10",
  },
];

function statusPill(status) {
  const cls =
    status === "APPROVE" ? "ok" : status === "REJECT" ? "bad" : "warn";
  return `<span class="pill ${cls}">${status}</span>`;
}
function typePill(t) {
  return `<span class="pill">${t === "AUTO" ? "AUTO" : "MANUAL"}</span>`;
}

function renderLoanTable(mode) {
  const tbody = document.getElementById("loanRows");
  const filterStatus = document.getElementById("filterStatus");
  const filterType = document.getElementById("filterType");
  const search = document.getElementById("search");

  function apply() {
    const s = (search?.value || "").toLowerCase().trim();
    const st = filterStatus?.value || "";
    const ty = filterType?.value || "";

    let rows = MOCK_LOANS.slice();

    // main view can be “manual + recent”
    if (mode === "main") rows = rows.filter((x) => x.type === "MANUAL" || true);

    if (st) rows = rows.filter((x) => x.status === st);
    if (ty) rows = rows.filter((x) => x.type === ty);
    if (s)
      rows = rows.filter(
        (x) =>
          x.id.toLowerCase().includes(s) || x.borrower.toLowerCase().includes(s)
      );

    tbody.innerHTML = rows
      .map(
        (l) => `
      <tr class="rowlink" data-id="${l.id}">
        <td>${l.id}</td>
        <td>${l.borrower}</td>
        <td>${l.amount.toLocaleString()} ₾</td>
        <td>${statusPill(l.status)}</td>
        <td>${typePill(l.type)}</td>
        <td>${l.updated}</td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll("tr").forEach((tr) => {
      tr.addEventListener(
        "click",
        () => (location.href = `detail.html?id=${tr.dataset.id}`)
      );
    });
  }

  [filterStatus, filterType, search].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", apply);
    el.addEventListener("change", apply);
  });

  apply();
}

function renderStats() {
  // mock aggregation
  const total = MOCK_LOANS.length;
  const counts = {
    APPROVE: 0,
    REJECT: 0,
    PARTIAL_APPROVE: 0,
    CONDITIONAL_APPROVE: 0,
    OTHER: 0,
  };
  let auto = 0,
    manual = 0;

  MOCK_LOANS.forEach((l) => {
    if (l.type === "AUTO") auto++;
    else manual++;
    if (counts[l.status] !== undefined) counts[l.status]++;
    else counts.OTHER++;
  });

  const kpis = document.getElementById("kpis");
  kpis.innerHTML = [
    { l: "Total processed", v: total },
    { l: "APPROVE", v: counts.APPROVE },
    { l: "REJECT", v: counts.REJECT },
    { l: "PARTIAL_APPROVE", v: counts.PARTIAL_APPROVE },
    { l: "CONDITIONAL_APPROVE", v: counts.CONDITIONAL_APPROVE },
    { l: "Auto vs Manual", v: `${auto}/${manual}` },
  ]
    .map(
      (x) =>
        `<div class="kpi"><div class="v">${x.v}</div><div class="l">${x.l}</div></div>`
    )
    .join("");

  // simple SVG “diagrams”
  document.getElementById("lineChart").innerHTML = svgLine([
    4, 7, 5, 9, 8, 10, 12,
  ]);
  document.getElementById("barChart").innerHTML = svgBars([
    { label: "APP", value: counts.APPROVE },
    { label: "REJ", value: counts.REJECT },
    { label: "PAR", value: counts.PARTIAL_APPROVE },
    { label: "CON", value: counts.CONDITIONAL_APPROVE },
  ]);
  document.getElementById("donutChart").innerHTML = svgDonut(auto, manual);

  document.getElementById("apply")?.addEventListener("click", () => {
    // demo: just re-render
    renderStats();
  });
}

function renderDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "A-77801";
  const loan = MOCK_LOANS.find((x) => x.id === id) || MOCK_LOANS[0];

  const readOnly = loan.type === "AUTO"; // ✅ AC: auto-completed read-only

  const el = document.getElementById("detailCard");
  el.innerHTML = `
    <div class="card-head">
      <h2>Loan Detail • ${loan.id}</h2>
      <div>${
        readOnly
          ? `<span class="pill">READ-ONLY (AUTO)</span>`
          : `<span class="pill">MANUAL (ACTIONS ENABLED)</span>`
      }</div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>Applicant</h3>
        <p><b>Name:</b> ${loan.borrower}</p>
        <p><b>Amount:</b> ${loan.amount.toLocaleString()} ₾</p>
        <p><b>Status:</b> ${statusPill(loan.status)}</p>
        <p><b>Type:</b> ${typePill(loan.type)}</p>
      </div>

      <div class="card">
        <h3>Actions</h3>
        ${
          readOnly
            ? `
          <p class="muted">Auto processed applications are read-only for Department Head.</p>
        `
            : `
          <label class="muted"><input type="checkbox" id="authOk"> Authorization confirmed</label>
          <div style="height:8px"></div>
          <select id="headDecision" class="control-select">
            <option value="">Choose decision</option>
            <option>APPROVE</option><option>REJECT</option>
            <option>PARTIAL_APPROVE</option><option>CONDITIONAL_APPROVE</option>
          </select>
          <div style="height:8px"></div>
          <textarea id="auditNote" class="rm-comment" placeholder="Audit trail note (required)"></textarea>
          <div style="height:8px"></div>
          <button class="btn primary" id="applyDecision">Apply Decision</button>
          <div style="height:10px"></div>
          <div class="success-msg hidden" id="headSuccess">✅ Action recorded (demo)</div>
        `
        }
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <h3>Audit Trail</h3>
      <p class="muted">Demo UI: audit entries appear here.</p>
      <ul>
        <li>2025-12-13 11:06 — Forwarded to RM</li>
        <li>2025-12-13 11:20 — RM decision saved</li>
      </ul>
    </div>
  `;

  if (!readOnly) {
    document.getElementById("applyDecision").addEventListener("click", () => {
      const authOk = document.getElementById("authOk").checked;
      const dec = document.getElementById("headDecision").value;
      const note = document.getElementById("auditNote").value.trim();

      if (!authOk) return alert("Authorization is required (demo)");
      if (!dec) return alert("Choose decision");
      if (!note) return alert("Audit note is required");

      const msg = document.getElementById("headSuccess");
      msg.classList.remove("hidden");
      msg.textContent = "✅ Action recorded + audit trail updated (demo)";
    });
  }
}

// ---------- SVG “diagram” helpers (pure UI) ----------
function svgLine(points) {
  const w = 520,
    h = 170,
    p = 18;
  const max = Math.max(...points, 1);
  const step = (w - 2 * p) / (points.length - 1);
  const d = points
    .map((v, i) => {
      const x = p + i * step;
      const y = h - p - (v / max) * (h - 2 * p);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return `
  <svg viewBox="0 0 ${w} ${h}" width="100%" height="180" role="img" aria-label="line chart">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="2" />
    ${points
      .map((v, i) => {
        const x = p + i * step;
        const y = h - p - (v / max) * (h - 2 * p);
        return `<circle cx="${x}" cy="${y}" r="3" fill="currentColor" />`;
      })
      .join("")}
  </svg>`;
}

function svgBars(items) {
  const w = 520,
    h = 170,
    p = 18;
  const max = Math.max(...items.map((x) => x.value), 1);
  const bw = (w - 2 * p) / items.length - 12;
  return `
  <svg viewBox="0 0 ${w} ${h}" width="100%" height="180" role="img" aria-label="bar chart">
    ${items
      .map((it, i) => {
        const x = p + i * ((w - 2 * p) / items.length) + 6;
        const barH = (it.value / max) * (h - 2 * p);
        const y = h - p - barH;
        return `
        <rect x="${x}" y="${y}" width="${bw}" height="${barH}" fill="currentColor" opacity="0.18"></rect>
        <text x="${x + bw / 2}" y="${
          h - 4
        }" font-size="12" text-anchor="middle" fill="currentColor">${
          it.label
        }</text>
        <text x="${x + bw / 2}" y="${
          y - 6
        }" font-size="12" text-anchor="middle" fill="currentColor">${
          it.value
        }</text>
      `;
      })
      .join("")}
  </svg>`;
}

function svgDonut(a, b) {
  const total = a + b || 1;
  const aPct = a / total;
  const r = 54,
    cx = 90,
    cy = 80;
  const C = 2 * Math.PI * r;
  const aLen = C * aPct;
  return `
  <svg viewBox="0 0 260 170" width="100%" height="180" role="img" aria-label="donut chart">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="14" opacity="0.12"></circle>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="14"
      stroke-dasharray="${aLen} ${
    C - aLen
  }" transform="rotate(-90 ${cx} ${cy})"></circle>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="currentColor">
      ${a}/${b}
    </text>
    <text x="170" y="70" font-size="13" fill="currentColor">Auto: ${a}</text>
    <text x="170" y="95" font-size="13" fill="currentColor">Manual: ${b}</text>
  </svg>`;
}
