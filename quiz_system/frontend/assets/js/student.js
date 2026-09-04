/**
 * Online Quiz System - Student JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('student-dashboard.html')) {
        initStudentDashboard();
    } else if (path.includes('subject-selection.html')) {
        initSubjectSelectionPage();
    } else if (path.includes('difficulty-selection.html')) {
        initDifficultySelectionPage();
    }
});

/* ==========================================================================
   Student Dashboard
   ========================================================================== */

function initStudentDashboard() {
    const joinForm = document.getElementById('join-quiz-form');
    if (joinForm) {
        initLiveValidation(joinForm);
        joinForm.addEventListener('submit', handleJoinQuizSubmit);
    }

    // Load recent student attempts if table exists
    loadRecentAttempts();
}

async function handleJoinQuizSubmit(e) {
    e.preventDefault();
    const codeInput = document.getElementById('quiz-code-input');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        setInputValidity(codeInput, false, 'Please enter a quiz code.');
        return;
    }

    // Format: IQZ-XXXXX
    const codePattern = /^IQZ-\d{5}$/;
    if (!codePattern.test(code)) {
        setInputValidity(codeInput, false, 'Invalid format. Code must be like: IQZ-12345');
        return;
    }

    setInputValidity(codeInput, true);

    try {
        const response = await apiPost('student/join-quiz.php', { quiz_code: code });
        if (response.success) {
            showToast('Quiz found! Redirecting to quiz page...');
            
            // Redirect to attempt page
            setTimeout(() => {
                window.location.href = `attempt-quiz.html?quiz_id=${response.data.quiz_id}&type=teacher`;
            }, 1200);
        } else {
            showToast(response.message, 'danger');
            setInputValidity(codeInput, false, response.message);
        }
    } catch (error) {
        showToast(error.message, 'danger');
        setInputValidity(codeInput, false, error.message);
    }
}

async function loadRecentAttempts() {
    const container = document.getElementById('recent-attempts-tbody');
    if (!container) return;

    try {
        const response = await apiGet('api/attempts.php');
        if (response.success) {
            const attempts = response.data;
            if (attempts.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-muted">You have not attempted any quizzes yet.</td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = '';
            // Display top 5 recent attempts
            attempts.slice(0, 5).forEach(att => {
                const date = new Date(att.submitted_at).toLocaleDateString();
                const scoreClass = parseFloat(att.percentage) >= 50 ? 'text-success' : 'text-danger';
                
                const tr = `
                    <tr>
                        <td class="fw-700">${escapeHtml(att.quiz_title)}</td>
                        <td><span class="badge bg-light text-dark border px-2 rounded-pill">${att.subject_name}</span></td>
                        <td>${att.correct_answers}/${att.total_questions}</td>
                        <td class="fw-700 ${scoreClass}">${att.percentage}%</td>
                        <td class="fs-13 text-muted">${date}</td>
                        <td>
                            <a href="result.html?attempt_id=${att.attempt_id}" class="btn btn-outline-primary btn-sm fw-600 px-3 py-1">
                                <i class="bi bi-eye-fill me-1"></i>View Details
                            </a>
                        </td>
                    </tr>
                `;
                container.insertAdjacentHTML('beforeend', tr);
            });
        }
    } catch (error) {
        console.error('Failed to load recent attempts:', error);
    }
}

/* ==========================================================================
   Subject Selection
   ========================================================================== */

async function initSubjectSelectionPage() {
    const subjectList = document.getElementById('subject-cards-list');
    const searchInput = document.getElementById('search-subjects');
    if (!subjectList) return;

    let subjects = [];

    // Load subjects
    try {
        const response = await apiGet('api/subjects.php');
        if (response.success) {
            subjects = response.data;
            renderSubjectsList(subjects, subjectList);
        }
    } catch (e) {
        showToast('Failed to load subjects', 'danger');
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const filtered = subjects.filter(sub => 
                sub.subject_name.toLowerCase().includes(query) || 
                (sub.subject_description && sub.subject_description.toLowerCase().includes(query))
            );
            renderSubjectsList(filtered, subjectList);
        });
    }
}

function renderSubjectsList(subjects, container) {
    container.innerHTML = '';
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-muted fs-5">No subjects found.</div>
            </div>
        `;
        return;
    }

    // Flat colors for dynamic borders
    const borderColors = ['#0D6EFD', '#198754', '#DC3545', '#FFC107', '#0B1F3A', '#6F42C1', '#FD7E14', '#20C997'];

    subjects.forEach((sub, index) => {
        const color = borderColors[index % borderColors.length];
        
        // Subject cards with border-radius: 100px (circular flat feel as specified)
        const cardHTML = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card subject-card text-center h-100 p-4 border-2" 
                     style="border-radius: 100px; border-color: ${color}; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;"
                     onclick="selectSubject(${sub.subject_id}, '${escapeJsString(sub.subject_name)}')">
                    <div class="card-body d-flex flex-column justify-content-center align-items-center">
                        <div class="subject-icon-box mb-3 d-flex align-items-center justify-content-center" 
                             style="width: 60px; height: 60px; border-radius: 50%; background-color: ${color}15; color: ${color};">
                            <i class="bi bi-journal-code fs-3"></i>
                        </div>
                        <h4 class="card-title fw-700 mb-2">${escapeHtml(sub.subject_name)}</h4>
                        <p class="card-text text-muted fs-13 mb-0" style="max-height: 40px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                            ${escapeHtml(sub.subject_description || 'No description available')}
                        </p>
                        <div class="mt-3 fs-13 text-secondary fw-700">
                            <span class="badge bg-light text-dark border rounded-pill px-3">${sub.question_count} Qs Bank</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function selectSubject(id, name) {
    window.location.href = `difficulty-selection.html?subject_id=${id}&subject_name=${encodeURIComponent(name)}`;
}

/* ==========================================================================
   Difficulty & Count Selection
   ========================================================================== */

function initDifficultySelectionPage() {
    const form = document.getElementById('difficulty-form');
    const subjectId = getQueryParam('subject_id');
    const subjectName = getQueryParam('subject_name');

    if (!subjectId || !subjectName) {
        showToast('Invalid subject selection. Redirecting...', 'danger');
        setTimeout(() => window.location.href = 'student-dashboard.html', 1500);
        return;
    }

    // Set page headers
    const subNameEls = document.querySelectorAll('.selected-subject-name');
    subNameEls.forEach(el => el.textContent = decodeURIComponent(subjectName));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value;
            const numQuestions = document.getElementById('num-questions').value;

            if (!difficulty) {
                showToast('Please select a difficulty level.', 'warning');
                return;
            }

            try {
                const response = await apiPost('student/generate-practice-quiz.php', {
                    subject_id: parseInt(subjectId),
                    difficulty: difficulty,
                    num_questions: parseInt(numQuestions)
                });

                if (response.success) {
                    showToast('Practice quiz generated! Starting now...');
                    
                    // Redirect to attempt quiz
                    setTimeout(() => {
                        window.location.href = `attempt-quiz.html?quiz_id=${response.data.quiz_id}&type=practice`;
                    }, 1200);
                } else {
                    showToast(response.message, 'danger');
                }
            } catch (error) {
                showToast(error.message, 'danger');
            }
        });
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

function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
