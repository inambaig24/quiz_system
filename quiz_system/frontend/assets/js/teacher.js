/**
 * Online Quiz System - Teacher JS
 */

// Initialize teacher page elements when document loaded
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('teacher-dashboard.html')) {
        initTeacherDashboard();
    } else if (path.includes('create-quiz.html')) {
        initCreateQuizPage();
    } else if (path.includes('add-questions.html')) {
        initAddQuestionsPage();
    } else if (path.includes('teacher-reports.html')) {
        initTeacherReportsPage();
    }
});

/* ==========================================================================
   Teacher Dashboard
   ========================================================================== */

let teacherQuizzes = [];
let dashboardStatusFilter = 'all';

async function initTeacherDashboard() {
    const searchInput = document.getElementById('search-quizzes');
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-item');

    // Load initial data
    await loadTeacherQuizzes();

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderQuizList();
        });
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            dashboardStatusFilter = tab.dataset.status;
            renderQuizList();
        });
    });
}

async function loadTeacherQuizzes() {
    try {
        const response = await apiGet('teacher/get-teacher-quizzes.php');
        if (response.success) {
            teacherQuizzes = response.data;
            calculateDashboardStats();
            renderQuizList();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Failed to load quizzes: ' + error.message, 'danger');
    }
}

function calculateDashboardStats() {
    const totalQuizzes = teacherQuizzes.length;
    const activeQuizzes = teacherQuizzes.filter(q => q.status === 'active').length;

    // Sum attempts across all quizzes
    const totalAttempts = teacherQuizzes.reduce((sum, q) => sum + parseInt(q.attempt_count || 0), 0);

    const totalQuizzesEl = document.getElementById('stat-total-quizzes');
    const activeQuizzesEl = document.getElementById('stat-active-quizzes');
    const totalAttemptsEl = document.getElementById('stat-total-attempts');

    if (totalQuizzesEl) totalQuizzesEl.textContent = totalQuizzes;
    if (activeQuizzesEl) activeQuizzesEl.textContent = activeQuizzes;
    if (totalAttemptsEl) totalAttemptsEl.textContent = totalAttempts;
}

function renderQuizList() {
    const quizListContainer = document.getElementById('teacher-quiz-list');
    const searchInput = document.getElementById('search-quizzes');
    if (!quizListContainer) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    // Filter list
    const filtered = teacherQuizzes.filter(quiz => {
        const matchesStatus = dashboardStatusFilter === 'all' || quiz.status === dashboardStatusFilter;
        const matchesSearch = quiz.quiz_title.toLowerCase().includes(searchTerm) ||
            quiz.quiz_code.toLowerCase().includes(searchTerm) ||
            quiz.subject_name.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        quizListContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-muted fs-5">No quizzes found.</div>
            </div>
        `;
        return;
    }

    quizListContainer.innerHTML = '';
    filtered.forEach(quiz => {
        // Choose CSS border class based on theme
        const themeClass = quiz.theme ? `theme-${quiz.theme}` : 'theme-default';
        const isReattemptAllowed = parseInt(quiz.allow_reattempt) === 1;
        const isCompleted = quiz.status === 'completed';
        const isCancelled = quiz.status === 'cancelled';

        let statusBadge = `<span class="badge bg-success rounded-pill px-3">Active</span>`;
        if (isCompleted) {
            statusBadge = `<span class="badge bg-secondary rounded-pill px-3">Completed</span>`;
        } else if (isCancelled) {
            statusBadge = `<span class="badge bg-danger rounded-pill px-3">Cancelled</span>`;
        }

        const isQuestionsComplete = parseInt(quiz.question_count) >= parseInt(quiz.total_questions);

        // Quiz control buttons
        let controlsHTML = '';
        if (quiz.status === 'active') {
            controlsHTML = `
                <div class="form-check form-switch mb-3">
                    <input class="form-check-input" type="checkbox" role="switch" id="reattempt-switch-${quiz.quiz_id}" ${isReattemptAllowed ? 'checked' : ''} onchange="toggleReattempt(${quiz.quiz_id})">
                    <label class="form-check-label fw-600 fs-14" for="reattempt-switch-${quiz.quiz_id}">Allow Student Reattempt</label>
                </div>
                <div class="d-flex gap-2">
                    ${!isQuestionsComplete ? `
                        <a href="add-questions.html?quiz_id=${quiz.quiz_id}&total=${quiz.total_questions}" class="btn btn-warning btn-sm w-50 fw-600">
                            <i class="bi bi-plus-circle me-1"></i>Add Qs (${quiz.question_count}/${quiz.total_questions})
                        </a>
                    ` : `
                        <span class="btn btn-outline-success btn-sm w-50 disabled fw-600">
                            <i class="bi bi-check-circle-fill me-1"></i>Questions Full
                        </span>
                    `}
                    <button onclick="cancelQuiz(${quiz.quiz_id})" class="btn btn-outline-danger btn-sm w-50 fw-600">Cancel</button>
                </div>
            `;
        } else {
            controlsHTML = `
                <div class="text-muted fs-14 italic mb-3">Quiz closed. No changes allowed.</div>
                <a href="teacher-reports.html?quiz_id=${quiz.quiz_id}" class="btn btn-outline-primary btn-sm w-100 fw-600">
                    <i class="bi bi-bar-chart-fill me-1"></i>View Reports
                </a>
            `;
        }

        const cardHTML = `
            <div class="col-md-6 col-lg-4">
                <div class="card quiz-card h-100 ${themeClass}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark rounded-pill px-3 border fw-600">${quiz.subject_name}</span>
                            ${statusBadge}
                        </div>
                        <h4 class="card-title fw-700 mt-2 mb-1">${escapeHtml(quiz.quiz_title)}</h4>
                        <div class="fs-14 text-muted mb-3">${escapeHtml(quiz.quiz_description || 'No description provided')}</div>
                        
                        <div class="quiz-info-grid mb-3">
                            <div class="info-item">
                                <span class="label">Code</span>
                                <span class="value font-monospace fw-700 text-primary">${quiz.quiz_code}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Time</span>
                                <span class="value">${quiz.duration_minutes} Mins</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Questions</span>
                                <span class="value">${quiz.question_count}/${quiz.total_questions}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Attempts</span>
                                <span class="value">${quiz.attempt_count || 0}</span>
                            </div>
                        </div>
                        
                        <div class="mt-auto pt-2 border-top">
                            ${controlsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        quizListContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

async function toggleReattempt(quizId) {
    try {
        const response = await apiPost('teacher/allow-reattempt.php', { quiz_id: quizId });
        if (response.success) {
            showToast(response.message);
            // Update local state
            const quiz = teacherQuizzes.find(q => q.quiz_id === quizId);
            if (quiz) {
                quiz.allow_reattempt = response.data.allow_reattempt;
            }
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Operation failed: ' + error.message, 'danger');
        // Revert UI toggle on failure
        loadTeacherQuizzes();
    }
}

async function cancelQuiz(quizId) {
    if (!confirm('Are you sure you want to cancel this quiz? Students will no longer be able to join.')) return;

    try {
        const response = await apiPost('teacher/cancel-quiz.php', { quiz_id: quizId });
        if (response.success) {
            showToast(response.message);
            loadTeacherQuizzes();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Failed to cancel quiz: ' + error.message, 'danger');
    }
}

/* ==========================================================================
   Create Quiz Page
   ========================================================================== */

async function initCreateQuizPage() {
    const createForm = document.getElementById('create-quiz-form');
    const subjectSelect = document.getElementById('quiz-subject');

    // Load subjects to select
    await loadSubjectsSelect(subjectSelect);

    if (createForm) {
        initLiveValidation(createForm);
        createForm.addEventListener('submit', handleQuizCreation);
    }
}

async function loadSubjectsSelect(selectElement) {
    if (!selectElement) return;
    try {
        const response = await apiGet('api/subjects.php');
        if (response.success) {
            selectElement.innerHTML = '<option value="" selected disabled>Select Subject</option>';
            response.data.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.subject_id;
                option.textContent = subject.subject_name;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        showToast('Failed to load subjects', 'danger');
    }
}

async function handleQuizCreation(e) {
    e.preventDefault();
    const form = e.target;

    const subjectId = document.getElementById('quiz-subject').value;
    const title = document.getElementById('quiz-title').value.trim();
    const description = document.getElementById('quiz-description').value.trim();
    const duration = document.getElementById('quiz-duration').value;
    const totalQ = document.getElementById('quiz-questions').value;
    const difficulty = document.getElementById('quiz-difficulty').value;
    const theme = document.querySelector('input[name="quiz-theme"]:checked')?.value || 'blue';

    // Client side validation
    let isValid = true;

    if (!subjectId) {
        setInputValidity(document.getElementById('quiz-subject'), false, 'Please select a subject.');
        isValid = false;
    } else {
        setInputValidity(document.getElementById('quiz-subject'), true);
    }

    if (!title) {
        setInputValidity(document.getElementById('quiz-title'), false, 'Please enter a quiz title.');
        isValid = false;
    } else {
        setInputValidity(document.getElementById('quiz-title'), true);
    }

    if (!duration || duration < 1 || duration > 180) {
        setInputValidity(document.getElementById('quiz-duration'), false, 'Duration must be between 1 and 180 minutes.');
        isValid = false;
    } else {
        setInputValidity(document.getElementById('quiz-duration'), true);
    }

    if (!totalQ || totalQ < 1 || totalQ > 100) {
        setInputValidity(document.getElementById('quiz-questions'), false, 'Questions count must be between 1 and 100.');
        isValid = false;
    } else {
        setInputValidity(document.getElementById('quiz-questions'), true);
    }

    if (!isValid) return;

    try {
        const payload = {
            subject_id: subjectId,
            quiz_title: title,
            quiz_description: description,
            duration_minutes: duration,
            total_questions: totalQ,
            difficulty: difficulty,
            theme: theme
        };

        const response = await apiPost('teacher/create-quiz.php', payload);
        if (response.success) {
            showToast('Quiz created successfully!');
            // Redirect to add questions
            setTimeout(() => {
                window.location.href = `add-questions.html?quiz_id=${response.data.quiz_id}&total=${response.data.total_questions}`;
            }, 1000);
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

/* ==========================================================================
   Add Questions Page
   ========================================================================== */

let addQuizId = null;
let addTotalRequired = 0;
let addCurrentCount = 0;

async function initAddQuestionsPage() {
    const questionForm = document.getElementById('add-question-form');
    addQuizId = getQueryParam('quiz_id');
    addTotalRequired = parseInt(getQueryParam('total') || 0);

    if (!addQuizId || !addTotalRequired) {
        showToast('Invalid quiz access. Redirecting...', 'danger');
        setTimeout(() => window.location.href = 'teacher-dashboard.html', 1500);
        return;
    }

    // Populate header info
    const reqCountEls = document.querySelectorAll('.req-questions-count');
    reqCountEls.forEach(el => el.textContent = addTotalRequired);

    // Initial check of existing questions
    await loadExistingQuestions();

    if (questionForm) {
        initLiveValidation(questionForm);
        questionForm.addEventListener('submit', handleAddQuestionSubmit);
    }
}

async function loadExistingQuestions() {
    try {
        const response = await apiGet(`api/questions.php?quiz_id=${addQuizId}`);
        if (response.success) {
            const questions = response.data;
            addCurrentCount = questions.length;

            updateQuestionCountDisplay();
            renderExistingQuestions(questions);
        }
    } catch (error) {
        showToast('Failed to load existing questions: ' + error.message, 'danger');
    }
}

function updateQuestionCountDisplay() {
    const currentCountEls = document.querySelectorAll('.current-questions-count');
    const remainingCountEls = document.querySelectorAll('.remaining-questions-count');
    const remaining = addTotalRequired - addCurrentCount;

    currentCountEls.forEach(el => el.textContent = addCurrentCount);
    remainingCountEls.forEach(el => el.textContent = remaining);

    const formSection = document.getElementById('question-form-section');
    const completionSection = document.getElementById('completion-section');

    if (remaining <= 0) {
        if (formSection) formSection.style.display = 'none';
        if (completionSection) completionSection.style.display = 'block';
    } else {
        if (formSection) formSection.style.display = 'block';
        if (completionSection) completionSection.style.display = 'none';
    }
}

function renderExistingQuestions(questions) {
    const container = document.getElementById('added-questions-list');
    if (!container) return;

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted italic">No questions added to this quiz yet.</div>
        `;
        return;
    }

    container.innerHTML = '';
    questions.forEach((q, idx) => {
        const cardHTML = `
            <div class="card mb-3 shadow-sm border-0 border-start border-primary border-3">
                <div class="card-body py-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-700 mb-0">Question ${idx + 1}</h6>
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
                        <i class="bi bi-check-circle-fill me-1"></i>Correct Option: ${q.correct_option}
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

async function handleAddQuestionSubmit(e) {
    e.preventDefault();

    const questionText = document.getElementById('q-text').value.trim();
    const optionA = document.getElementById('q-opt-a').value.trim();
    const optionB = document.getElementById('q-opt-b').value.trim();
    const optionC = document.getElementById('q-opt-c').value.trim();
    const optionD = document.getElementById('q-opt-d').value.trim();
    const correctOption = document.getElementById('q-correct-opt').value;
    const difficulty = document.getElementById('q-difficulty').value;

    let isValid = true;

    if (!questionText) { setInputValidity(document.getElementById('q-text'), false, 'Question is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-text'), true); }

    if (!optionA) { setInputValidity(document.getElementById('q-opt-a'), false, 'Option A is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-opt-a'), true); }

    if (!optionB) { setInputValidity(document.getElementById('q-opt-b'), false, 'Option B is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-opt-b'), true); }

    if (!optionC) { setInputValidity(document.getElementById('q-opt-c'), false, 'Option C is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-opt-c'), true); }

    if (!optionD) { setInputValidity(document.getElementById('q-opt-d'), false, 'Option D is required.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-opt-d'), true); }

    if (!correctOption) { setInputValidity(document.getElementById('q-correct-opt'), false, 'Please select the correct answer.'); isValid = false; }
    else { setInputValidity(document.getElementById('q-correct-opt'), true); }

    if (!isValid) return;

    try {
        const payload = {
            quiz_id: addQuizId,
            question_text: questionText,
            option_a: optionA,
            option_b: optionB,
            option_c: optionC,
            option_d: optionD,
            correct_option: correctOption,
            difficulty: difficulty
        };

        const response = await apiPost('teacher/add-question.php', payload);
        if (response.success) {
            showToast('Question added successfully!');
            // Reset form fields
            document.getElementById('q-text').value = '';
            document.getElementById('q-opt-a').value = '';
            document.getElementById('q-opt-b').value = '';
            document.getElementById('q-opt-c').value = '';
            document.getElementById('q-opt-d').value = '';
            document.getElementById('q-correct-opt').value = '';

            clearFormValidation(e.target);

            // Reload list
            await loadExistingQuestions();
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

/* ==========================================================================
   Teacher Reports & Leaderboards
   ========================================================================== */

let quizAttemptsChart = null;
let quizScoresChart = null;

async function initTeacherReportsPage() {
    const reportQuizSelect = document.getElementById('report-quiz-select');

    // Load teacher quizzes in dropdown
    await loadTeacherQuizzesDropdown(reportQuizSelect);

    if (reportQuizSelect) {
        reportQuizSelect.addEventListener('change', (e) => {
            const quizId = e.target.value;
            if (quizId) {
                loadQuizReportDetails(quizId);
            }
        });

        // Auto-select query param quiz if any
        const queryQuizId = getQueryParam('quiz_id');
        if (queryQuizId) {
            reportQuizSelect.value = queryQuizId;
            loadQuizReportDetails(queryQuizId);
        }
    }

    // Load static overview charts for the dashboard report
    await renderTeacherGlobalCharts();
}

async function loadTeacherQuizzesDropdown(selectElement) {
    if (!selectElement) return;
    try {
        const response = await apiGet('teacher/get-teacher-quizzes.php');
        if (response.success) {
            selectElement.innerHTML = '<option value="" selected disabled>Select Quiz to View Reports</option>';
            response.data.forEach(quiz => {
                const option = document.createElement('option');
                option.value = quiz.quiz_id;
                option.textContent = `${quiz.quiz_title} (${quiz.quiz_code})`;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        showToast('Failed to load quizzes list', 'danger');
    }
}

async function loadQuizReportDetails(quizId) {
    try {
        const response = await apiGet(`teacher/get-leaderboard.php?quiz_id=${quizId}`);
        if (response.success) {
            const data = response.data;

            // Set details
            document.getElementById('report-quiz-title').textContent = data.quiz_title;
            document.getElementById('report-total-attempts').textContent = data.total_attempts;

            renderLeaderboardTable(data.leaderboard);
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Failed to load leaderboard details: ' + error.message, 'danger');
    }
}

function renderLeaderboardTable(leaderboard) {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;

    if (leaderboard.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">No attempts recorded for this quiz yet.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    leaderboard.forEach(row => {
        let rankBadge = row.rank;
        if (row.rank === 1) rankBadge = `<span class="badge bg-warning text-dark px-2 rounded-pill"><i class="bi bi-trophy-fill me-1"></i>1st</span>`;
        else if (row.rank === 2) rankBadge = `<span class="badge bg-secondary text-white px-2 rounded-pill">2nd</span>`;
        else if (row.rank === 3) rankBadge = `<span class="badge bg-bronze text-white px-2 rounded-pill" style="background-color: #cd7f32">3rd</span>`;

        const formattedDate = new Date(row.submitted_at).toLocaleString();

        const tr = `
            <tr>
                <td>${rankBadge}</td>
                <td class="fw-700">${escapeHtml(row.student_name)}</td>
                <td class="font-monospace fs-13">${escapeHtml(row.student_email)}</td>
                <td class="fw-700 text-primary">${row.score}/${row.total_questions}</td>
                <td>
                    <span class="badge bg-success rounded-pill me-1">${row.correct_answers}</span>
                    <span class="badge bg-danger rounded-pill">${row.wrong_answers}</span>
                </td>
                <td class="fw-700 ${parseFloat(row.percentage) >= 50 ? 'text-success' : 'text-danger'}">${row.percentage}%</td>
                <td class="fs-13 text-muted">${formattedDate}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

async function renderTeacherGlobalCharts() {
    const attemptsCanvas = document.getElementById('chart-attempts-canvas');
    const scoresCanvas = document.getElementById('chart-scores-canvas');

    if (!attemptsCanvas || !scoresCanvas) return;

    try {
        // Fetch attempts breakdown
        const attemptsResponse = await apiGet('api/reports.php?type=quiz_attempts');
        // Fetch score averages
        const scoresResponse = await apiGet('api/reports.php?type=avg_scores');

        if (attemptsResponse.success && scoresResponse.success) {
            const attemptsData = attemptsResponse.data;
            const scoresData = scoresResponse.data;

            // Render Attempts Chart
            if (quizAttemptsChart) quizAttemptsChart.destroy();
            quizAttemptsChart = new Chart(attemptsCanvas, {
                type: 'bar',
                data: {
                    labels: attemptsData.map(d => d.quiz_title),
                    datasets: [{
                        label: 'Total Student Attempts',
                        data: attemptsData.map(d => d.attempts),
                        backgroundColor: '#0D6EFD',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });

            // Render Averages Chart
            if (quizScoresChart) quizScoresChart.destroy();
            quizScoresChart = new Chart(scoresCanvas, {
                type: 'line',
                data: {
                    labels: scoresData.map(d => d.quiz_title),
                    datasets: [{
                        label: 'Average Score (%)',
                        data: scoresData.map(d => d.avg_score),
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to load reports charts:', e);
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
