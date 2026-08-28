const STORAGE_KEY = "intern-tracker-data-v1";
const COLS = ["office","program","euRequired","visa","link","appsOpen","deadline","status","notes"];

function keyOf(catName, companyName) { return catName + "::" + companyName; }

async function fetchSeed() {
  const res = await fetch("companies.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("seed fetch failed: " + res.status);
  return res.json();
}

// Fold new categories/companies from companies.json into the browser's saved
// copy without touching rows the user has already edited. Rows the user deleted
// are remembered in `deleted` so they don't come back on the next load.
function mergeSeed(saved, seed) {
  const gone = new Set(saved.deleted || []);
  const byName = new Map(saved.categories.map(c => [c.name, c]));
  let added = 0;

  seed.categories.forEach(seedCat => {
    const fresh = seedCat.companies.filter(x => !gone.has(keyOf(seedCat.name, x.company)));
    const existing = byName.get(seedCat.name);

    if (!existing) {
      saved.categories.push(Object.assign({}, seedCat, { companies: fresh }));
      added += fresh.length;
      return;
    }

    const have = new Set(existing.companies.map(x => x.company));
    fresh.forEach(x => {
      if (have.has(x.company)) return;
      existing.companies.push(Object.assign({}, x));
      added++;
    });
    if (!existing.blurb && seedCat.blurb) existing.blurb = seedCat.blurb;
  });

  return added;
}

let MERGED_COUNT = 0;

async function loadData() {
  let saved = null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { saved = JSON.parse(raw); } catch (e) { saved = null; }
  }
  if (!saved || !Array.isArray(saved.categories)) return fetchSeed();

  try {
    MERGED_COUNT = mergeSeed(saved, await fetchSeed());
    if (MERGED_COUNT) saveData(saved);
  } catch (e) {
    // Offline or seed unavailable — carry on with the saved copy.
  }
  return saved;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const ind = document.getElementById("save-indicator");
  ind.textContent = "saved " + new Date().toLocaleTimeString();
  ind.style.opacity = "1";
}

function tagClass(val) {
  if (!val) return "check";
  const v = val.toLowerCase();
  if (v === "no" || v.startsWith("n/a")) return "no";
  if (v === "yes") return "yes";
  return "check";
}

function renderEuCell(company, td) {
  td.innerHTML = "";
  const sel = document.createElement("select");
  sel.className = "status-select";
  ["check","no","yes"].forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v === "check" ? "Check" : v === "no" ? "No" : "Yes";
    if ((company.euRequired || "check") === v) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener("change", () => {
    company.euRequired = sel.value;
    persist();
  });
  const tag = document.createElement("span");
  tag.className = "tag " + tagClass(company.euRequired);
  tag.textContent = sel.options[sel.selectedIndex].textContent;
  td.appendChild(sel);
}

let DATA = null;

function persist() { saveData(DATA); }

// Only ever produce http(s) links — keeps a pasted "javascript:" URL from
// becoming a clickable script.
function safeHref(raw) {
  const text = (raw || "").trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : "https://" + text;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch (e) {
    return null;
  }
}

function buildLinkCell(company, td) {
  td.contentEditable = "true";
  td.textContent = "";
  const href = safeHref(company.link);
  if (href) {
    const a = document.createElement("a");
    a.className = "link";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = company.link.replace(/^https?:\/\//, "");
    td.appendChild(a);
  } else if (company.link) {
    td.textContent = company.link;
  }
  td.addEventListener("blur", () => {
    const text = td.innerText.trim();
    company.link = text;
    persist();
  });
  td.addEventListener("focus", () => {
    td.innerText = company.link || "";
  });
}

function slugify(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";
}

// Jump links across the top. Rebuilt with the table so added/removed rows keep
// their counts honest.
function renderNav(entries) {
  const nav = document.getElementById("cat-nav");
  nav.innerHTML = "";
  entries.forEach(({ id, name, count }) => {
    const a = document.createElement("a");
    a.className = "cat-nav-link";
    a.href = "#" + id;
    a.textContent = name;
    const n = document.createElement("span");
    n.className = "cat-nav-count";
    n.textContent = count;
    a.appendChild(n);
    nav.appendChild(a);
  });
}

function render() {
  const root = document.getElementById("categories");
  root.innerHTML = "";
  const navEntries = [];
  const usedIds = new Set();
  DATA.categories.forEach(cat => {
    const section = document.createElement("section");
    section.className = "category";

    let id = slugify(cat.name);
    while (usedIds.has(id)) id += "-x";
    usedIds.add(id);
    section.id = id;
    navEntries.push({ id, name: cat.name || "Untitled", count: cat.companies.length });

    const head = document.createElement("div");
    head.className = "category-head";
    const heading = document.createElement("h2");
    heading.textContent = cat.name || "";
    const blurb = document.createElement("p");
    blurb.textContent = cat.blurb || "";
    head.append(heading, blurb);
    section.appendChild(head);

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr>
        <th>Company</th><th>Region</th><th>Office / Country</th><th>Program</th>
        <th>EU citizenship?</th><th>Visa sponsorship</th><th>Careers link</th>
        <th>Apps open</th><th>Deadline</th><th>Status</th><th>Notes</th><th></th>
      </tr></thead>`;
    const tbody = document.createElement("tbody");

    cat.companies.forEach((company, compIdx) => {
      const tr = document.createElement("tr");

      const companyTd = document.createElement("td");
      companyTd.className = "company";
      companyTd.contentEditable = "true";
      companyTd.textContent = company.company || "";
      companyTd.addEventListener("blur", () => { company.company = companyTd.textContent.trim(); persist(); });
      tr.appendChild(companyTd);

      const regionTd = document.createElement("td");
      regionTd.contentEditable = "true";
      regionTd.textContent = company.region || "";
      regionTd.addEventListener("blur", () => { company.region = regionTd.textContent.trim(); persist(); });
      tr.appendChild(regionTd);

      ["office","program"].forEach(field => {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = company[field] || "";
        td.addEventListener("blur", () => { company[field] = td.textContent.trim(); persist(); });
        tr.appendChild(td);
      });

      const euTd = document.createElement("td");
      renderEuCell(company, euTd);
      tr.appendChild(euTd);

      const visaTd = document.createElement("td");
      visaTd.contentEditable = "true";
      visaTd.textContent = company.visa || "";
      visaTd.addEventListener("blur", () => { company.visa = visaTd.textContent.trim(); persist(); });
      tr.appendChild(visaTd);

      const linkTd = document.createElement("td");
      buildLinkCell(company, linkTd);
      tr.appendChild(linkTd);

      ["appsOpen","deadline"].forEach(field => {
        const td = document.createElement("td");
        td.contentEditable = "true";
        td.textContent = company[field] || "";
        td.addEventListener("blur", () => { company[field] = td.textContent.trim(); persist(); });
        tr.appendChild(td);
      });

      const statusTd = document.createElement("td");
      const statusSel = document.createElement("select");
      statusSel.className = "status-select";
      ["not started","researching","applied","interview","offer","rejected/closed"].forEach(v => {
        const opt = document.createElement("option");
        opt.value = v; opt.textContent = v;
        if ((company.status || "not started") === v) opt.selected = true;
        statusSel.appendChild(opt);
      });
      statusSel.addEventListener("change", () => { company.status = statusSel.value; persist(); });
      statusTd.appendChild(statusSel);
      tr.appendChild(statusTd);

      const notesTd = document.createElement("td");
      notesTd.contentEditable = "true";
      notesTd.style.minWidth = "220px";
      notesTd.textContent = company.notes || "";
      notesTd.addEventListener("blur", () => { company.notes = notesTd.textContent.trim(); persist(); });
      tr.appendChild(notesTd);

      const removeTd = document.createElement("td");
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "✕";
      removeBtn.title = "Remove row";
      removeBtn.addEventListener("click", () => {
        const removed = cat.companies.splice(compIdx, 1)[0];
        if (removed) {
          // Remember it, so the next merge from companies.json doesn't re-add it.
          DATA.deleted = DATA.deleted || [];
          const k = keyOf(cat.name, removed.company);
          if (DATA.deleted.indexOf(k) === -1) DATA.deleted.push(k);
        }
        persist();
        render();
      });
      removeTd.appendChild(removeBtn);
      tr.appendChild(removeTd);

      // Enter commits the cell instead of dropping a newline into it.
      tr.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        cell.addEventListener("keydown", e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); cell.blur(); }
        });
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    scroll.appendChild(table);
    section.appendChild(scroll);

    const addBtn = document.createElement("button");
    addBtn.className = "add-company";
    addBtn.textContent = "+ Add company";
    addBtn.title = "Add a blank row to " + (cat.name || "this category");
    addBtn.addEventListener("click", () => addCompanyTo(cat, id));
    section.appendChild(addBtn);

    root.appendChild(section);
  });

  renderNav(navEntries);
  applyPendingFocus();
}

function blankCompany() {
  return {
    company: "", region: "", office: "", program: "",
    euRequired: "check", visa: "", link: "", appsOpen: "", deadline: "",
    status: "not started", notes: ""
  };
}

// Set just before a re-render to put the cursor in a specific new row.
let FOCUS_AFTER_RENDER = null;

function addCompanyTo(cat, sectionId) {
  cat.companies.push(blankCompany());
  FOCUS_AFTER_RENDER = sectionId;
  persist();
  render();
}

function applyPendingFocus() {
  if (!FOCUS_AFTER_RENDER) return;
  const section = document.getElementById(FOCUS_AFTER_RENDER);
  FOCUS_AFTER_RENDER = null;
  if (!section) return;
  const cell = section.querySelector("tbody tr:last-child td.company");
  if (!cell) return;
  cell.scrollIntoView({ block: "center", behavior: "smooth" });
  cell.focus();
}

function exportCSV() {
  const rows = [["Category","Company","Region","Office","Program","EU citizenship?","Visa","Link","Apps open","Deadline","Status","Notes"]];
  DATA.categories.forEach(cat => {
    cat.companies.forEach(c => {
      rows.push([cat.name, c.company, c.region, c.office, c.program, c.euRequired, c.visa, c.link, c.appsOpen, c.deadline, c.status, c.notes]);
    });
  });
  const csv = rows.map(r => r.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "internship-tracker.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function init() {
  DATA = await loadData();
  render();

  if (MERGED_COUNT) {
    const ind = document.getElementById("save-indicator");
    ind.textContent = "+" + MERGED_COUNT + " new from the list";
    ind.style.opacity = "1";
  }
  document.getElementById("export-csv").addEventListener("click", exportCSV);
  document.getElementById("reset-data").addEventListener("click", async () => {
    if (!confirm("Reset all data to the original defaults? This discards your edits.")) return;
    localStorage.removeItem(STORAGE_KEY);
    DATA = await fetchSeed();   // clears the deleted-row list along with everything else
    render();
    persist();
  });
}

init();
