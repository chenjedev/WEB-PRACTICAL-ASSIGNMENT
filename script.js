const students = [];

const studentForm = document.getElementById("studentForm");
const performanceForm = document.getElementById("performanceForm");
const studentTableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const detailsBox = document.getElementById("detailsBox");
const formMsg = document.getElementById("formMsg");
const perfMsg = document.getElementById("perfMsg");
const searchInput = document.getElementById("searchInput");
const filterForm = document.getElementById("filterForm");

function showMessage(target, text, type) {
  target.textContent = text;
  target.className = `message ${type === "ok" ? "good" : "bad"}`;
}

function normalizeId(id) {
  return id.trim().toUpperCase();
}

function findStudentById(id) {
  const normalized = normalizeId(id);
  return students.find((s) => s.id === normalized);
}

function calculateFormAverage(record) {
  const values = Object.values(record.subjects);
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

function calculateOverallAverage(student) {
  if (!student.performance.length) return null;
  let total = 0;
  let count = 0;
  student.performance.forEach((r) => {
    const values = Object.values(r.subjects);
    values.forEach((v) => {
      total += v;
      count += 1;
    });
  });
  return count ? total / count : null;
}

function validateScore(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

function renderStudents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const formFilter = filterForm.value;

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm) ||
      s.name.toLowerCase().includes(searchTerm);
    const matchesForm = !formFilter || String(s.form) === formFilter;
    return matchesSearch && matchesForm;
  });

  studentTableBody.innerHTML = "";

  filtered.forEach((student) => {
    const avg = calculateOverallAverage(student);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>Form ${student.form}</td>
      <td>${avg === null ? "N/A" : avg.toFixed(2)}%</td>
      <td>
        <div class="actions">
          <button class="btn-sm btn-ok" data-action="view" data-id="${student.id}">View</button>
          <button class="btn-sm" data-action="prefill" data-id="${student.id}">Add Result</button>
          <button class="btn-sm" data-action="promote" data-id="${student.id}">Promote</button>
          <button class="btn-sm btn-danger" data-action="delete" data-id="${student.id}">Delete</button>
        </div>
      </td>
    `;
    studentTableBody.appendChild(tr);
  });

  emptyState.style.display = filtered.length ? "none" : "block";
}

function renderStudentDetails(student) {
  if (!student) {
    detailsBox.className = "muted";
    detailsBox.textContent = "Student not found.";
    return;
  }

  const performances = [...student.performance].sort((a, b) => a.form - b.form);
  const rows = performances.length
    ? performances.map((p) => {
        const avg = calculateFormAverage(p);
        return `
          <tr>
            <td>Form ${p.form}</td>
            <td>${p.subjects.math}</td>
            <td>${p.subjects.english}</td>
            <td>${p.subjects.science}</td>
            <td>${p.subjects.social}</td>
            <td>${avg.toFixed(2)}%</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" class="muted">No performance records yet.</td></tr>`;

  detailsBox.className = "";
  detailsBox.innerHTML = `
    <p><strong>ID:</strong> ${student.id}</p>
    <p><strong>Name:</strong> ${student.name}</p>
    <p><strong>Gender:</strong> ${student.gender}</p>
    <p><strong>Age:</strong> ${student.age}</p>
    <p><strong>Current Form:</strong> Form ${student.form}</p>
    <p><strong>Overall Average:</strong> ${
      calculateOverallAverage(student) === null
        ? "N/A"
        : calculateOverallAverage(student).toFixed(2) + "%"
    }</p>
    <h3>Performance by Form</h3>
    <table>
      <thead>
        <tr>
          <th>Form</th>
          <th>Mathematics</th>
          <th>English</th>
          <th>Science</th>
          <th>Social Studies</th>
          <th>Average</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

studentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const id = normalizeId(document.getElementById("studentId").value);
  const gender = document.getElementById("gender").value;
  const age = Number(document.getElementById("age").value);
  const form = Number(document.getElementById("formLevel").value);

  if (!name || !id || !gender || !Number.isFinite(age) || !form) {
    showMessage(formMsg, "Please complete all registration fields.", "bad");
    return;
  }

  if (age < 10 || age > 25) {
    showMessage(formMsg, "Age must be between 10 and 25.", "bad");
    return;
  }

  if (findStudentById(id)) {
    showMessage(formMsg, `Student ID ${id} already exists.`, "bad");
    return;
  }

  const student = {
    id,
    name,
    gender,
    age,
    form,
    performance: []
  };

  students.push(student);
  showMessage(formMsg, `Student ${name} (${id}) registered successfully.`, "ok");
  studentForm.reset();
  renderStudents();
});

performanceForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const studentId = normalizeId(document.getElementById("perfStudentId").value);
  const form = Number(document.getElementById("perfForm").value);
  const math = Number(document.getElementById("math").value);
  const english = Number(document.getElementById("english").value);
  const science = Number(document.getElementById("science").value);
  const social = Number(document.getElementById("social").value);

  const student = findStudentById(studentId);
  if (!student) {
    showMessage(perfMsg, `Student ID ${studentId} was not found.`, "bad");
    return;
  }

  if (!form || ![math, english, science, social].every(validateScore)) {
    showMessage(perfMsg, "Enter valid scores from 0 to 100 for all subjects.", "bad");
    return;
  }

  const payload = {
    form,
    subjects: { math, english, science, social }
  };

  const existing = student.performance.find((p) => p.form === form);
  if (existing) {
    existing.subjects = payload.subjects;
    showMessage(perfMsg, `Updated Form ${form} performance for ${student.name}.`, "ok");
  } else {
    student.performance.push(payload);
    showMessage(perfMsg, `Added Form ${form} performance for ${student.name}.`, "ok");
  }

  performanceForm.reset();
  renderStudents();
  renderStudentDetails(student);
});

studentTableBody.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = target.dataset.id;
  const action = target.dataset.action;
  const student = findStudentById(id);
  if (!student) return;

  if (action === "view") {
    renderStudentDetails(student);
  }

  if (action === "prefill") {
    document.getElementById("perfStudentId").value = student.id;
    document.getElementById("perfForm").value = String(student.form);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  if (action === "promote") {
    if (student.form >= 4) {
      alert(`${student.name} is already in Form 4.`);
      return;
    }
    student.form += 1;
    renderStudents();
    renderStudentDetails(student);
  }

  if (action === "delete") {
    const ok = confirm(`Delete ${student.name} (${student.id})?`);
    if (!ok) return;
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx >= 0) students.splice(idx, 1);
    renderStudents();
    detailsBox.className = "muted";
    detailsBox.textContent = "Select \"View\" from the student list to see full details.";
  }
});

searchInput.addEventListener("input", renderStudents);
filterForm.addEventListener("change", renderStudents);

renderStudents();