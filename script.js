const STORAGE_KEY = "intern-tracker-data-v1";
const COLS = ["office","program","euRequired","visa","link","appsOpen","deadline","status","notes"];

async function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  const res = await fetch("companies.json");
  return res.json();
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

function render() {
  const root = document.getElementById("categories");
  root.innerHTML = "";
  DATA.categories.forEach(cat => {
    const section = document.createElement("section");
    section.className = "category";

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
        cat.companies.splice(compIdx, 1);
        persist();
        render();
      });
      removeTd.appendChild(removeBtn);
      tr.appendChild(removeTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    scroll.appendChild(table);
    section.appendChild(scroll);
    root.appendChild(section);
  });
}

function addRow() {
  if (!DATA.categories.length) return;
  const catName = prompt(
    "Which category?\n" + DATA.categories.map((c,i) => `${i+1}. ${c.name}`).join("\n"),
    "1"
  );
  const idx = parseInt(catName, 10) - 1;
  const cat = DATA.categories[idx] || DATA.categories[0];
  cat.companies.push({
    company: "New company", region: "", office: "", program: "",
    euRequired: "check", visa: "", link: "", appsOpen: "", deadline: "",
    status: "not started", notes: ""
  });
  persist();
  render();
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

  document.getElementById("add-row").addEventListener("click", addRow);
  document.getElementById("export-csv").addEventListener("click", exportCSV);
  document.getElementById("reset-data").addEventListener("click", async () => {
    if (!confirm("Reset all data to the original defaults? This discards your edits.")) return;
    localStorage.removeItem(STORAGE_KEY);
    const res = await fetch("companies.json");
    DATA = await res.json();
    render();
    persist();
  });
}

init();
