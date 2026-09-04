/**
 * Online Quiz System - Admin JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('admin-dashboard.html')) {
        initAdminDashboard();
    } else if (path.includes('manage-users.html')) {
        initManageUsersPage();
    } else if (path.includes('manage-subjects.html')) {
        initManageSubjectsPage();
    } else if (path.includes('manage-question-bank.html')) {
        initManageQuestionBankPage();
    }
});

/* ==========================================================================
   Admin Dashboard
   ========================================================================== */

let adminSubjectChart = null;
let adminTrendsChart = null;

async function initAdminDashboard() {
    try {
        const response = await apiGet('admin/dashboard-stats.php');
        if (response.success) {
            const data = response.data;

            // Populate counts
            document.getElementById('stat-total-teachers').textContent = data.total_teachers;
            document.getElementById('stat-total-students').textContent = data.total_students;
            document.getElementById('stat-total-quizzes').textContent = data.total_quizzes;
            document.getElementById('stat-total-attempts').textContent = data.total_attempts;
            document.getElementById('stat-total-subjects').textContent = data.total_subjects;
            document.getElementById('stat-total-bank').textContent = data.total_bank_questions;

            // Render lists
            renderTopStudents(data.top_students);
            renderRecentActivity(data.recent_activity);

            // Render charts
            renderAdminCharts(data.quizzes_by_subject, data.monthly_trends);
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Failed to load dashboard stats: ' + error.message, 'danger');
    }
}

function renderTopStudents(students) {
    const container = document.getElementById('top-students-list');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = `<div class="text-center py-3 text-muted">No student attempts recorded yet.</div>`;
        return;
    }

    container.innerHTML = '';
    students.forEach((stu, idx) => {
        const rank = idx + 1;
        const badgeColor = rank === 1 ? 'bg-warning text-dark' : rank === 2 ? 'bg-secondary' : rank === 3 ? 'bg-bronze' : 'bg-light text-dark';
        const badgeStyle = rank === 3 ? 'background-color: #cd7f32; color: #fff;' : '';

        const itemHTML = `
            <div class="d-flex align-items-center mb-3 pb-2 border-bottom">
                <span class="badge ${badgeColor} rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; font-weight: 700; ${badgeStyle}">
                    ${rank}
                </span>
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-700">${escapeHtml(stu.name)}</h6>
                    <small class="text-muted font-monospace fs-12">${escapeHtml(stu.university_email)}</small>
                </div>
                <div class="text-end">
                    <span class="fw-800 text-success">${parseFloat(stu.avg_percentage).toFixed(1)}%</span>
                    <br><small class="text-muted fs-11">${stu.total_attempts} attempts</small>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });
}

function renderRecentActivity(activities) {
    const tbody = document.getElementById('recent-activity-tbody');
    if (!tbody) return;

    if (activities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No recent quiz activity.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    activities.forEach(act => {
        const date = new Date(act.submitted_at).toLocaleString();
        const scoreClass = parseFloat(act.percentage) >= 50 ? 'text-success' : 'text-danger';

        const tr = `
            <tr>
                <td class="fw-700">${escapeHtml(act.student_name)}</td>
                <td>${escapeHtml(act.quiz_title)}</td>
                <td class="fw-700">${act.score}/${act.total_questions}</td>
                <td class="fw-700 ${scoreClass}">${act.percentage}%</td>
                <td class="fs-13 text-muted">${date}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function renderAdminCharts(subjectData, trendsData) {
    const subjectCanvas = document.getElementById('chart-admin-subjects');
    const trendsCanvas = document.getElementById('chart-admin-trends');

    if (subjectCanvas) {
        if (adminSubjectChart) adminSubjectChart.destroy();
        adminSubjectChart = new Chart(subjectCanvas, {
            type: 'doughnut',
            data: {
                labels: subjectData.map(d => d.subject_name),
                datasets: [{
                    data: subjectData.map(d => d.quiz_count),
                    backgroundColor: [
                        '#0D6EFD', '#198754', '#DC3545', '#FFC107', 
                        '#0B1F3A', '#6F42C1', '#FD7E14', '#20C997'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    if (trendsCanvas) {
        if (adminTrendsChart) adminTrendsChart.destroy();
        adminTrendsChart = new Chart(trendsCanvas, {
            type: 'line',
            data: {
                labels: trendsData.map(d => d.month),
                datasets: [{
                    label: 'Attempts per Month',
                    data: trendsData.map(d => d.attempts),
                    borderColor: '#0D6EFD',
                    backgroundColor: 'rgba(13, 110, 253, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
}

/* ==========================================================================
   Manage Users Page
   ========================================================================== */

let allTeachers = [];
let allStudents = [];

async function initManageUsersPage() {
    const searchInput = document.getElementById('search-users');
    const roleFilter = document.getElementById('filter-role');
    const statusFilter = document.getElementById('filter-status');

    await loadUsers();

    if (searchInput) searchInput.addEventListener('input', renderUsersList);
    if (roleFilter) roleFilter.addEventListener('change', renderUsersList);
    if (statusFilter) statusFilter.addEventListener('change', renderUsersList);
}

async function loadUsers() {
    try {
        const response = await apiGet('admin/get-users.php');
        if (response.success) {
            allTeachers = response.data.teachers;
            allStudents = response.data.students;
            renderUsersList();
        }
    } catch (e) {
        showToast('Failed to load users: ' + e.message, 'danger');
    }
}

function renderUsersList() {
    const teachersTbody = document.getElementById('teachers-tbody');
    const studentsTbody = document.getElementById('students-tbody');

    const searchVal = document.getElementById('search-users')?.value.toLowerCase().trim() || '';
    const roleVal = document.getElementById('filter-role')?.value || 'all';
    const statusVal = document.getElementById('filter-status')?.value || 'all';

    // Show/hide sections depending on role selection
    const teacherSection = document.getElementById('teachers-section');
    const studentSection = document.getElementById('students-section');

    if (teacherSection) teacherSection.style.display = (roleVal === 'all' || roleVal === 'teacher') ? 'block' : 'none';
    if (studentSection) studentSection.style.display = (roleVal === 'all' || roleVal === 'student') ? 'block' : 'none';

    // Filter Teachers
    if (teachersTbody && (roleVal === 'all' || roleVal === 'teacher')) {
        const filteredTeachers = allTeachers.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
            const matchesStatus = statusVal === 'all' || u.status === statusVal;
            return matchesSearch && matchesStatus;
        });

        teachersTbody.innerHTML = '';
        if (filteredTeachers.length === 0) {
            teachersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No teachers found.</td></tr>`;
        } else {
            filteredTeachers.forEach(t => {
                const statusBadge = t.status === 'active' 
                    ? `<span class="badge bg-success rounded-pill px-3">Active</span>`
                    : `<span class="badge bg-danger rounded-pill px-3">Blocked</span>`;

                const actionButton = t.status === 'active'
                    ? `<button onclick="updateUserStatus(${t.id}, 'teacher', 'block')" class="btn btn-outline-warning btn-sm me-1 fw-600">Block</button>`
                    : `<button onclick="updateUserStatus(${t.id}, 'teacher', 'unblock')" class="btn btn-outline-success btn-sm me-1 fw-600">Unblock</button>`;

                const tr = `
                    <tr>
                        <td class="fw-700">${escapeHtml(t.name)}</td>
                        <td class="font-monospace fs-13">${escapeHtml(t.email)}</td>
                        <td>${statusBadge}</td>
                        <td class="fs-13 text-muted">${new Date(t.created_at).toLocaleDateString()}</td>
                        <td>
                            ${actionButton}
                            <button onclick="deleteUser(${t.id}, 'teacher')" class="btn btn-outline-danger btn-sm fw-600">Delete</button>
                        </td>
                    </tr>
                `;
                teachersTbody.insertAdjacentHTML('beforeend', tr);
            });
        }
    }

    // Filter Students
    if (studentsTbody && (roleVal === 'all' || roleVal === 'student')) {
        const filteredStudents = allStudents.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
            const matchesStatus = statusVal === 'all' || u.status === statusVal;
            return matchesSearch && matchesStatus;
        });

        studentsTbody.innerHTML = '';
        if (filteredStudents.length === 0) {
            studentsTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No students found.</td></tr>`;
        } else {
            filteredStudents.forEach(s => {
                const statusBadge = s.status === 'active' 
                    ? `<span class="badge bg-success rounded-pill px-3">Active</span>`
                    : `<span class="badge bg-danger rounded-pill px-3">Blocked</span>`;

                const actionButton = s.status === 'active'
                    ? `<button onclick="updateUserStatus(${s.id}, 'student', 'block')" class="btn btn-outline-warning btn-sm me-1 fw-600">Block</button>`
                    : `<button onclick="updateUserStatus(${s.id}, 'student', 'unblock')" class="btn btn-outline-success btn-sm me-1 fw-600">Unblock</button>`;

                const tr = `
                    <tr>
                        <td class="fw-700">${escapeHtml(s.name)}</td>
                        <td class="font-monospace fs-13">${escapeHtml(s.email)}</td>
                        <td>${statusBadge}</td>
                        <td class="fs-13 text-muted">${new Date(s.created_at).toLocaleDateString()}</td>
                        <td>
                            ${actionButton}
                            <button onclick="deleteUser(${s.id}, 'student')" class="btn btn-outline-danger btn-sm fw-600">Delete</button>
                        </td>
                    </tr>
                `;
                studentsTbody.insertAdjacentHTML('beforeend', tr);
            });
        }
    }
}

async function updateUserStatus(userId, role, action) {
    const endpoint = action === 'block' ? 'admin/block-user.php' : 'admin/unblock-user.php';
    const confirmMsg = `Are you sure you want to ${action} this ${role}?`;
    if (!confirm(confirmMsg)) return;

    try {
        const response = await apiPost(endpoint, { user_id: userId, role: role });
        if (response.success) {
            showToast(response.message);
            loadUsers();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (e) {
        showToast('Operation failed: ' + e.message, 'danger');
    }
}

async function deleteUser(userId, role) {
    if (!confirm(`WARNING: Deleting this ${role} will permanently remove all their associated records. Continue?`)) return;

    try {
        const response = await apiPost('admin/delete-user.php', { user_id: userId, role: role });
        if (response.success) {
            showToast(response.message);
            loadUsers();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (e) {
        showToast('Failed to delete user: ' + e.message, 'danger');
    }
}

/* ==========================================================================
   Manage Subjects Page
   ========================================================================== */

let allSubjects = [];

async function initManageSubjectsPage() {
    const searchInput = document.getElementById('search-subjects');
    const addForm = document.getElementById('add-subject-form');

    await loadSubjects();

    if (searchInput) searchInput.addEventListener('input', renderSubjectsTable);
    if (addForm) {
        initLiveValidation(addForm);
        addForm.addEventListener('submit', handleAddSubject);
    }
}

async function loadSubjects() {
    try {
        const response = await apiGet('api/subjects.php');
        if (response.success) {
            allSubjects = response.data;
            renderSubjectsTable();
        }
    } catch (e) {
        showToast('Failed to load subjects', 'danger');
    }
}

function renderSubjectsTable() {
    const tbody = document.getElementById('subjects-tbody');
    if (!tbody) return;

    const searchVal = document.getElementById('search-subjects')?.value.toLowerCase().trim() || '';

    const filtered = allSubjects.filter(sub => 
        sub.subject_name.toLowerCase().includes(searchVal) || 
        (sub.subject_description && sub.subject_description.toLowerCase().includes(searchVal))
    );

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No subjects found.</td></tr>`;
        return;
    }

    filtered.forEach(sub => {
        const tr = `
            <tr>
                <td class="fw-700">${escapeHtml(sub.subject_name)}</td>
                <td class="fs-14">${escapeHtml(sub.subject_description || 'N/A')}</td>
                <td><span class="badge bg-light text-dark border px-3 rounded-pill fw-600">${sub.question_count} Qs</span></td>
                <td>
                    <button onclick="deleteSubject(${sub.subject_id})" class="btn btn-outline-danger btn-sm fw-600">Delete</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

async function handleAddSubject(e) {
    e.preventDefault();
    const nameInput = document.getElementById('sub-name');
    const descInput = document.getElementById('sub-desc');

    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    if (!name) {
        setInputValidity(nameInput, false, 'Subject name is required.');
        return;
    }
    setInputValidity(nameInput, true);

    try {
        const response = await apiPost('admin/add-subject.php', {
            subject_name: name,
            subject_description: desc
        });

        if (response.success) {
            showToast('Subject added successfully!');
            nameInput.value = '';
            descInput.value = '';
            clearFormValidation(e.target);
            loadSubjects();
        } else {
            showToast(response.message, 'danger');
            setInputValidity(nameInput, false, response.message);
        }
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

async function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject? All questions associated with this subject will be deleted.')) return;

    try {
        const response = await apiPost('admin/delete-subject.php', { subject_id: subjectId });
        if (response.success) {
            showToast(response.message);
            loadSubjects();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (e) {
        showToast('Failed to delete subject: ' + e.message, 'danger');
    }
}

/* ==========================================================================
   Manage Question Bank Page
   ========================================================================== */

let allBankQuestions = [];

async function initManageQuestionBankPage() {
    const subjectSelect = document.getElementById('bank-subject-select');
    const filterSubject = document.getElementById('filter-bank-subject');
    const filterDifficulty = document.getElementById('filter-bank-difficulty');
    const searchInput = document.getElementById('search-bank');
    const addQuestionForm = document.getElementById('add-bank-question-form');

    // Populate dropdowns with subjects
    await loadSubjectsSelect(subjectSelect);
    await loadSubjectsSelect(filterSubject);
    if (filterSubject) {
        const opt = document.createElement('option');
        opt.value = 'all';
        opt.textContent = 'All Subjects';
        opt.selected = true;
        filterSubject.insertBefore(opt, filterSubject.firstChild);
    }

    await loadQuestionBank();

    // Event listeners
    if (filterSubject) filterSubject.addEventListener('change', renderQuestionBankList);
    if (filterDifficulty) filterDifficulty.addEventListener('change', renderQuestionBankList);
    if (searchInput) searchInput.addEventListener('input', renderQuestionBankList);
    
    if (addQuestionForm) {
        initLiveValidation(addQuestionForm);
        addQuestionForm.addEventListener('submit', handleAddBankQuestion);
    }
}

async function loadQuestionBank() {
    try {
        const response = await apiGet('api/questions.php?bank_only=true');
        if (response.success) {
            allBankQuestions = response.data;
            renderQuestionBankList();
        }
    } catch (e) {
        showToast('Failed to load question bank', 'danger');
    }
}

function renderQuestionBankList() {
    const container = document.getElementById('bank-questions-list');
    if (!container) return;

    const subFilter = document.getElementById('filter-bank-subject')?.value || 'all';
    const diffFilter = document.getElementById('filter-bank-difficulty')?.value || 'all';
    const searchVal = document.getElementById('search-bank')?.value.toLowerCase().trim() || '';

    const filtered = allBankQuestions.filter(q => {
        const matchesSubject = subFilter === 'all' || q.subject_id == subFilter;
        const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;
        const matchesSearch = q.question_text.toLowerCase().includes(searchVal) || 
                              q.option_a.toLowerCase().includes(searchVal) ||
                              q.option_b.toLowerCase().includes(searchVal) ||
                              q.option_c.toLowerCase().includes(searchVal) ||
                              q.option_d.toLowerCase().includes(searchVal);
        return matchesSubject && matchesDiff && matchesSearch;
    });

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">No questions found matching your filter criteria.</div>`;
        return;
    }

    filtered.forEach((q, idx) => {
        const cardHTML = `
            <div class="card mb-3 shadow-sm border-0 border-start border-primary border-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-light text-dark border rounded-pill px-3 fw-600">${q.subject_name}</span>
                        <span class="badge bg-light text-dark border rounded-pill px-2 fw-600">${q.difficulty}</span>
                    </div>
                    <p class="mb-2 fw-600">${escapeHtml(q.question_text)}</p>
                    <div class="row g-2 font-monospace fs-14">
                        <div class="col-sm-6 ${q.correct_option === 'A' ? 'text-success fw-700' : 'text-muted'}">A) ${escapeHtml(q.option_a)}</div>
                        <div class="col-sm-6 ${q.correct_option === 'B' ? 'text-success fw-700' : 'text-muted'}">B) ${escapeHtml(q.option_b)}</div>
                        <div class="col-sm-6 ${q.correct_option === 'C' ? 'text-success fw-700' : 'text-muted'}">C) ${escapeHtml(q.option_c)}</div>
                        <div class="col-sm-6 ${q.correct_option === 'D' ? 'text-success fw-700' : 'text-muted'}">D) ${escapeHtml(q.option_d)}</div>
                    </div>
                    <div class="mt-2 fs-13 text-success fw-700">
                        <i class="bi bi-check-circle-fill me-1"></i>Correct Answer: Option ${q.correct_option}
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

async function handleAddBankQuestion(e) {
    e.preventDefault();

    const subjectId = document.getElementById('bank-subject-select').value;
    const text = document.getElementById('bank-q-text').value.trim();
    const optA = document.getElementById('bank-q-opt-a').value.trim();
    const optB = document.getElementById('bank-q-opt-b').value.trim();
    const optC = document.getElementById('bank-q-opt-c').value.trim();
    const optD = document.getElementById('bank-q-opt-d').value.trim();
    const correct = document.getElementById('bank-q-correct-opt').value;
    const difficulty = document.getElementById('bank-q-difficulty').value;

    let isValid = true;
    
    if (!subjectId) { setInputValidity(document.getElementById('bank-subject-select'), false, 'Please select a subject.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-subject-select'), true); }

    if (!text) { setInputValidity(document.getElementById('bank-q-text'), false, 'Question text is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-text'), true); }

    if (!optA) { setInputValidity(document.getElementById('bank-q-opt-a'), false, 'Option A is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-opt-a'), true); }

    if (!optB) { setInputValidity(document.getElementById('bank-q-opt-b'), false, 'Option B is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-opt-b'), true); }

    if (!optC) { setInputValidity(document.getElementById('bank-q-opt-c'), false, 'Option C is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-opt-c'), true); }

    if (!optD) { setInputValidity(document.getElementById('bank-q-opt-d'), false, 'Option D is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-opt-d'), true); }

    if (!correct) { setInputValidity(document.getElementById('bank-q-correct-opt'), false, 'Correct answer is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('bank-q-correct-opt'), true); }

    if (!isValid) return;

    try {
        const payload = {
            subject_id: parseInt(subjectId),
            question_text: text,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_option: correct,
            difficulty: difficulty
        };

        const response = await apiPost('admin/add-question-bank.php', payload);
        if (response.success) {
            showToast('Question added to bank successfully!');
            // Reset
            document.getElementById('bank-q-text').value = '';
            document.getElementById('bank-q-opt-a').value = '';
            document.getElementById('bank-q-opt-b').value = '';
            document.getElementById('bank-q-opt-c').value = '';
            document.getElementById('bank-q-opt-d').value = '';
            document.getElementById('bank-q-correct-opt').value = '';
            
            clearFormValidation(e.target);
            loadQuestionBank();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

/* ==========================================================================
   Utility Helpers
   ========================================================================== */

function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
