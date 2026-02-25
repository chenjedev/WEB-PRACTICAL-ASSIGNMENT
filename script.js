const students = [];

// DOM Elements
const studentForm = document.getElementById("studentForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");
const editOldIdField = document.getElementById("editOldId");

const performanceForm = document.getElementById("performanceForm");
const studentTableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const detailsBox = document.getElementById("detailsBox");
const formMsg = document.getElementById("formMsg");
const perfMsg = document.getElementById("perfMsg");
const searchInput = document.getElementById("searchInput");
const filterForm = document.getElementById("filterForm");

// Utility Functions
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
    values.forEach((v) => { total += v; count += 1; });
  });
  return count ? total / count : null;
}

function validateScore(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

// Rendering Function
function renderStudents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const formFilter = filterForm.value;

  const filtered = students.filter((s) => {
    const matchesSearch = s.id.toLowerCase().includes(searchTerm) || s.name.toLowerCase().includes(searchTerm);
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
          <button class="btn-sm" data-action="view" data-id="${student.id}">View</button>
          <button class="btn-sm" data-action="edit" data-id="${student.id}">Edit</button>
          <button class="btn-sm" data-action="prefill" data-id="${student.id}">Add Result</button>
          <button class="btn-sm" data-action="promote" data-id="${student.id}">Promote</button>
          <button class="btn-sm" data-action="delete" data-id="${student.id}">Delete</button>
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
        return `<tr><td>Form ${p.form}</td><td>${p.subjects.math}</td><td>${p.subjects.physics}</td><td>${p.subjects.chemistry}</td><td>${p.subjects.biology}</td><td>${avg.toFixed(2)}%</td></tr>`;
      }).join("")
    : `<tr><td colspan="6" class="muted">No science results recorded yet.</td></tr>`;

  detailsBox.className = "";
  detailsBox.innerHTML = `
    <div style="border-left: 4px solid var(--primary); padding-left: 15px;">
        <p><strong>ID:</strong> ${student.id}</p>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Current Level:</strong> Form ${student.form}</p>
        <p><strong>Overall Average:</strong> ${calculateOverallAverage(student) === null ? "N/A" : calculateOverallAverage(student).toFixed(2) + "%"}</p>
    </div>
    <h3 style="margin: 20px 0 10px 0; font-size: 1rem;">Academic Science Record</h3>
    <div class="table-responsive">
      <table>
        <thead><tr><th>Form</th><th>Math</th><th>Phys</th><th>Chem</th><th>Bio</th><th>Avg</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Event Listeners
studentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const id = normalizeId(document.getElementById("studentId").value);
  const gender = document.getElementById("gender").value;
  const age = Number(document.getElementById("age").value);
  const form = Number(document.getElementById("formLevel").value);
  const oldId = editOldIdField.value;

  if (!name || !id || !gender || !Number.isFinite(age) || !form) {
    showMessage(formMsg, "Please complete all fields.", "bad");
    return;
  }

  if (oldId) {
    // EDIT MODE
    const studentIdx = students.findIndex(s => s.id === oldId);
    if (id !== oldId && findStudentById(id)) {
        showMessage(formMsg, "New ID already exists.", "bad");
        return;
    }
    students[studentIdx] = { ...students[studentIdx], name, id, gender, age, form };
    showMessage(formMsg, "Student details updated.", "ok");
    resetForm();
  } else {
    // REGISTER MODE
    if (findStudentById(id)) {
      showMessage(formMsg, "ID already exists.", "bad");
      return;
    }
    students.push({ id, name, gender, age, form, performance: [] });
    showMessage(formMsg, `Registered ${name}.`, "ok");
    studentForm.reset();
  }
  renderStudents();
});

function resetForm() {
    studentForm.reset();
    editOldIdField.value = "";
    formTitle.textContent = "Student Registration";
    submitBtn.textContent = "Register Student";
    cancelEdit.style.display = "none";
}

cancelEdit.addEventListener("click", resetForm);

studentTableBody.addEventListener("click", (e) => {
  const target = e.target;
  const id = target.dataset.id;
  const action = target.dataset.action;
  const student = findStudentById(id);
  if (!student) return;

  if (action === "view") renderStudentDetails(student);
  
  if (action === "edit") {
    // Fill the registration form with student data
    document.getElementById("name").value = student.name;
    document.getElementById("studentId").value = student.id;
    document.getElementById("gender").value = student.gender;
    document.getElementById("age").value = student.age;
    document.getElementById("formLevel").value = student.form;
    
    // Change UI to Edit Mode
    editOldIdField.value = student.id;
    formTitle.textContent = "Edit Student Details";
    submitBtn.textContent = "Save Changes";
    cancelEdit.style.display = "block";
    
    document.querySelector('.registration-area').scrollIntoView({behavior: 'smooth'});
  }

  if (action === "prefill") {
    document.getElementById("perfStudentId").value = student.id;
    document.getElementById("perfForm").value = String(student.form);
    document.querySelector('.performance-area').scrollIntoView({behavior: 'smooth'});
  }
  
  if (action === "promote") {
    if (student.form < 4) {
      student.form += 1;
      renderStudents();
      renderStudentDetails(student);
    }
  }
  
  if (action === "delete") {
    if (confirm(`Delete ${student.name}?`)) {
      const idx = students.findIndex((s) => s.id === student.id);
      students.splice(idx, 1);
      renderStudents();
    }
  }
});

performanceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const studentId = normalizeId(document.getElementById("perfStudentId").value);
  const form = Number(document.getElementById("perfForm").value);
  const math = Number(document.getElementById("math").value);
  const physics = Number(document.getElementById("physics").value);
  const chemistry = Number(document.getElementById("chemistry").value);
  const biology = Number(document.getElementById("biology").value);

  const student = findStudentById(studentId);
  if (!student) { showMessage(perfMsg, "Student not found.", "bad"); return; }
  if (!form || ![math, physics, chemistry, biology].every(validateScore)) {
    showMessage(perfMsg, "Invalid scores.", "bad"); return;
  }

  const existing = student.performance.find((p) => p.form === form);
  const subjects = { math, physics, chemistry, biology };
  if (existing) { existing.subjects = subjects; } 
  else { student.performance.push({ form, subjects }); }

  showMessage(perfMsg, "Results updated.", "ok");
  performanceForm.reset();
  renderStudents();
  renderStudentDetails(student);
});

searchInput.addEventListener("input", renderStudents);
filterForm.addEventListener("change", renderStudents);