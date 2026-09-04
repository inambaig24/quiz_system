/**
 * Online Quiz System - Quiz Attempt & Result JS
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('attempt-quiz.html')) {
        initAttemptQuizPage();
    } else if (path.includes('result.html')) {
        initResultPage();
    }
});

/* ==========================================================================
   Quiz Attempt Logic
   ========================================================================== */

let quizData = null;
let questions = [];
let currentQuestionIndex = 0;
let studentAnswers = {}; // Format: { question_id: 'A'/'B'/'C'/'D' }
let quizTimerInstance = null;

async function initAttemptQuizPage() {
    const quizId = getQueryParam('quiz_id');
    if (!quizId) {
        showToast('Invalid quiz access. Redirecting...', 'danger');
        setTimeout(() => window.location.href = 'student-dashboard.html', 1500);
        return;
    }

    try {
        // Fetch quiz details
        const quizResponse = await apiGet(`api/quizzes.php?quiz_id=${quizId}`);
        if (quizResponse.success && quizResponse.data.length > 0) {
            quizData = quizResponse.data[0];
            
            // Set header info
            document.getElementById('quiz-title-display').textContent = quizData.quiz_title;
            document.getElementById('quiz-subject-display').textContent = quizData.subject_name;
            
            // Apply theme class to body/container if needed
            if (quizData.theme) {
                const container = document.querySelector('.quiz-outer-container');
                if (container) container.classList.add(`quiz-theme-${quizData.theme}`);
            }
        } else {
            showToast('Failed to find quiz details.', 'danger');
            return;
        }

        // Fetch questions (answers will be filtered out by PHP api/questions.php)
        const qResponse = await apiGet(`api/questions.php?quiz_id=${quizId}`);
        if (qResponse.success) {
            questions = qResponse.data;
            if (questions.length === 0) {
                showToast('This quiz has no questions.', 'danger');
                setTimeout(() => window.location.href = 'student-dashboard.html', 1500);
                return;
            }

            // Setup navigation buttons
            document.getElementById('prev-question-btn').addEventListener('click', navigatePrevious);
            document.getElementById('next-question-btn').addEventListener('click', navigateNext);
            document.getElementById('submit-quiz-btn').addEventListener('click', () => submitQuizManual());

            // Initialize Progress Indicators (dots)
            initProgressDots();

            // Load first question
            showQuestion(0);

            // Initialize Timer
            initQuizTimer(parseInt(quizData.duration_minutes));
        }
    } catch (e) {
        showToast('Error loading quiz: ' + e.message, 'danger');
    }
}

function initProgressDots() {
    const container = document.getElementById('progress-dots-container');
    if (!container) return;

    container.innerHTML = '';
    questions.forEach((q, idx) => {
        const dot = document.createElement('button');
        dot.className = 'progress-dot btn btn-outline-secondary';
        dot.id = `dot-${idx}`;
        dot.textContent = idx + 1;
        dot.addEventListener('click', () => {
            showQuestion(idx);
        });
        container.appendChild(dot);
    });
}

function updateProgressDotsUI() {
    questions.forEach((q, idx) => {
        const dot = document.getElementById(`dot-${idx}`);
        if (!dot) return;

        // Clear active status
        dot.classList.remove('active', 'completed');

        if (idx === currentQuestionIndex) {
            dot.classList.add('active');
        } else if (studentAnswers[q.question_id]) {
            dot.classList.add('completed');
        }
    });

    // Update progress bar percentage
    const answeredCount = Object.keys(studentAnswers).length;
    const percentage = (answeredCount / questions.length) * 100;
    const progressBar = document.getElementById('quiz-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }
}

function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const q = questions[index];

    // Update question texts
    document.getElementById('current-question-num').textContent = index + 1;
    document.getElementById('total-questions-num').textContent = questions.length;
    document.getElementById('question-text-display').textContent = q.question_text;

    // Update options HTML with selections
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';
    
    const opts = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
    ];

    opts.forEach(opt => {
        const isSelected = studentAnswers[q.question_id] === opt.key;
        const activeClass = isSelected ? 'selected' : '';

        const cardHTML = `
            <div class="col-md-6 mb-3">
                <div class="card answer-card ${activeClass} h-100" onclick="selectAnswerOption('${opt.key}')">
                    <div class="card-body d-flex align-items-center py-3">
                        <div class="option-badge text-center me-3 fw-800">${opt.key}</div>
                        <div class="option-text fw-600">${escapeHtml(opt.text)}</div>
                    </div>
                </div>
            </div>
        `;
        optionsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Update nav buttons disabled states
    document.getElementById('prev-question-btn').disabled = index === 0;
    
    const nextBtn = document.getElementById('next-question-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');

    if (index === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }

    // Refresh dots highlight
    updateProgressDotsUI();
}

function selectAnswerOption(optionKey) {
    const q = questions[currentQuestionIndex];
    studentAnswers[q.question_id] = optionKey;
    
    // Rerender question screen to apply select style
    showQuestion(currentQuestionIndex);
}

function navigatePrevious() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

function navigateNext() {
    if (currentQuestionIndex < questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

function initQuizTimer(durationMinutes) {
    const timerElement = document.getElementById('quiz-timer-display');
    if (!timerElement) return;

    let timeRemaining = durationMinutes * 60;

    // Display start time
    updateTimerUI(timeRemaining, timerElement);

    quizTimerInstance = setInterval(() => {
        timeRemaining--;
        updateTimerUI(timeRemaining, timerElement);

        if (timeRemaining <= 0) {
            clearInterval(quizTimerInstance);
            showToast('Time is up! Submitting quiz automatically...', 'warning');
            submitQuizPayload(true);
        }
    }, 1000);
}

function updateTimerUI(seconds, element) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    
    const formattedMinutes = m.toString().padStart(2, '0');
    const formattedSeconds = s.toString().padStart(2, '0');
    
    element.textContent = `${formattedMinutes}:${formattedSeconds}`;

    // Color indicators
    const parentCard = element.closest('.timer-card') || element;
    if (seconds < 60) { // Under 1 minute remaining
        parentCard.className = 'timer-card border-danger text-danger bg-danger-light';
    } else if (seconds < 180) { // Under 3 minutes remaining
        parentCard.className = 'timer-card border-warning text-warning bg-warning-light';
    } else {
        parentCard.className = 'timer-card';
    }
}

async function submitQuizManual() {
    const unansweredCount = questions.length - Object.keys(studentAnswers).length;
    let message = 'Are you sure you want to submit your quiz?';
    if (unansweredCount > 0) {
        message = `You have ${unansweredCount} unanswered questions left. Do you still want to submit?`;
    }

    if (confirm(message)) {
        await submitQuizPayload(false);
    }
}

async function submitQuizPayload(isTimeUp = false) {
    // Clear timer
    if (quizTimerInstance) {
        clearInterval(quizTimerInstance);
    }

    // Format answers array: {question_id, selected_option}
    const answersPayload = questions.map(q => ({
        question_id: q.question_id,
        selected_option: studentAnswers[q.question_id] || ''
    }));

    try {
        const response = await apiPost('student/submit-quiz.php', {
            quiz_id: parseInt(quizData.quiz_id),
            answers: answersPayload
        });

        if (response.success) {
            showToast('Quiz submitted successfully!');
            setTimeout(() => {
                window.location.href = `result.html?attempt_id=${response.data.attempt_id}`;
            }, 1000);
        } else {
            showToast(response.message, 'danger');
        }
    } catch (e) {
        showToast('Submission error: ' + e.message, 'danger');
    }
}

/* ==========================================================================
   Quiz Result Logic
   ========================================================================== */

let resultAttemptId = null;

async function initResultPage() {
    resultAttemptId = getQueryParam('attempt_id');
    if (!resultAttemptId) {
        showToast('Attempt ID is missing.', 'danger');
        setTimeout(() => window.location.href = 'student-dashboard.html', 1500);
        return;
    }

    // Setup action listeners
    const emailBtn = document.getElementById('email-result-btn');
    if (emailBtn) {
        emailBtn.addEventListener('click', sendEmailReport);
    }

    try {
        const response = await apiGet(`student/get-result.php?attempt_id=${resultAttemptId}`);
        if (response.success) {
            const data = response.data;
            renderResultSummary(data.result);
            renderDetailedAnswers(data.answers);
        } else {
            showToast(response.message, 'danger');
        }
    } catch (error) {
        showToast('Error loading results: ' + error.message, 'danger');
    }
}

function renderResultSummary(result) {
    document.getElementById('result-quiz-title').textContent = result.quiz_title;
    document.getElementById('result-subject').textContent = result.subject_name;
    document.getElementById('result-score').textContent = `${result.score}/${result.total_questions}`;
    document.getElementById('result-percentage').textContent = `${result.percentage}%`;
    document.getElementById('result-correct').textContent = result.correct_answers;
    document.getElementById('result-wrong').textContent = result.wrong_answers;
    
    // Date formatting
    const formattedDate = new Date(result.submitted_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('result-date').textContent = formattedDate;

    // Pass or Fail status banner
    const percentage = parseFloat(result.percentage);
    const statusBanner = document.getElementById('result-status-banner');
    const statusTitle = document.getElementById('result-status-title');
    const statusText = document.getElementById('result-status-text');

    if (percentage >= 50) {
        statusBanner.className = 'card result-card border-2 border-success bg-success-light text-center mb-4';
        statusTitle.className = 'fw-800 text-success';
        statusTitle.textContent = 'Congratulations, You Passed!';
        statusText.textContent = 'Keep up the fantastic work and continue practicing to excel.';
    } else {
        statusBanner.className = 'card result-card border-2 border-danger bg-danger-light text-center mb-4';
        statusTitle.className = 'fw-800 text-danger';
        statusTitle.textContent = 'Quiz Attempt Failed';
        statusText.textContent = 'You did not secure the passing score of 50%. Review the incorrect answers and try again.';
    }

    // Leaderboard Position Badge (for teacher quizzes only)
    const leaderboardBox = document.getElementById('result-leaderboard-box');
    if (leaderboardBox) {
        if (result.quiz_type === 'teacher' && result.leaderboard_position) {
            document.getElementById('result-leaderboard-pos').textContent = `#${result.leaderboard_position}`;
            leaderboardBox.style.display = 'block';
        } else {
            leaderboardBox.style.display = 'none';
        }
    }

    // PDF download links
    const pdfBtn = document.getElementById('download-pdf-btn');
    if (pdfBtn) {
        // Remove standard link behavior
        pdfBtn.href = '#';
        pdfBtn.removeAttribute('target');
        
        pdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const originalText = pdfBtn.innerHTML;
            pdfBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generating...';
            pdfBtn.classList.add('disabled');
            
            // We want to print the main container
            const element = document.querySelector('.container.py-5');
            
            // Calculate the exact height and width of the container
            // so we can render it as one single continuous page!
            const elementWidth = element.offsetWidth;
            const elementHeight = element.scrollHeight + 40; // Add a little padding at the bottom

            // Configure html2pdf options for a SINGLE continuous page
            const opt = {
                margin:       10, // 10px margin all around
                filename:     `Quiz_Result_${result.quiz_title.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0 },
                jsPDF:        { unit: 'px', format: [elementWidth + 20, elementHeight], orientation: 'portrait' }
            };
            
            // Hide the buttons panel before generating PDF so it doesn't appear in the print
            const actionsPanel = document.querySelector('.card.p-4.bg-white.border.rounded-4.shadow-sm.mb-5.text-center');
            if (actionsPanel) actionsPanel.style.display = 'none';

            // Generate and save
            html2pdf().set(opt).from(element).save().then(() => {
                // Restore the buttons panel and button text
                if (actionsPanel) actionsPanel.style.display = 'block';
                pdfBtn.innerHTML = originalText;
                pdfBtn.classList.remove('disabled');
                showToast('PDF successfully downloaded!', 'success');
            }).catch(err => {
                if (actionsPanel) actionsPanel.style.display = 'block';
                pdfBtn.innerHTML = originalText;
                pdfBtn.classList.remove('disabled');
                showToast('Error generating PDF.', 'danger');
                console.error(err);
            });
        });
    }
}

function renderDetailedAnswers(answers) {
    const container = document.getElementById('detailed-answers-review');
    if (!container) return;

    container.innerHTML = '';
    
    answers.forEach((ans, idx) => {
        const isCorrect = parseInt(ans.is_correct) === 1;
        const selected = ans.selected_option || 'None';
        const borderClass = isCorrect ? 'border-success' : 'border-danger';
        
        let feedbackHTML = '';
        if (isCorrect) {
            feedbackHTML = `<span class="badge bg-success rounded-pill px-3 py-1 mb-2 fw-600"><i class="bi bi-check-circle-fill me-1"></i>Correct</span>`;
        } else {
            feedbackHTML = `<span class="badge bg-danger rounded-pill px-3 py-1 mb-2 fw-600"><i class="bi bi-x-circle-fill me-1"></i>Incorrect</span>`;
        }

        const qCard = `
            <div class="card mb-4 shadow-sm border-0 border-start border-3 ${borderClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-700 mb-0">Question ${idx + 1}</h5>
                        ${feedbackHTML}
                    </div>
                    <p class="question-text fw-600 mb-3">${escapeHtml(ans.question_text)}</p>
                    
                    <div class="options-review row g-2">
                        <div class="col-md-6 mb-2">
                            <div class="p-2 border rounded ${getOptionReviewClass(ans, 'A')}">
                                <span class="fw-800 me-2">A.</span> ${escapeHtml(ans.option_a)}
                            </div>
                        </div>
                        <div class="col-md-6 mb-2">
                            <div class="p-2 border rounded ${getOptionReviewClass(ans, 'B')}">
                                <span class="fw-800 me-2">B.</span> ${escapeHtml(ans.option_b)}
                            </div>
                        </div>
                        <div class="col-md-6 mb-2">
                            <div class="p-2 border rounded ${getOptionReviewClass(ans, 'C')}">
                                <span class="fw-800 me-2">C.</span> ${escapeHtml(ans.option_c)}
                            </div>
                        </div>
                        <div class="col-md-6 mb-2">
                            <div class="p-2 border rounded ${getOptionReviewClass(ans, 'D')}">
                                <span class="fw-800 me-2">D.</span> ${escapeHtml(ans.option_d)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3 fs-14">
                        <span class="text-secondary fw-600">Your Selection:</span> 
                        <strong class="${isCorrect ? 'text-success' : 'text-danger'}">${selected}</strong>
                        ${!isCorrect ? ` | <span class="text-secondary fw-600">Correct Answer:</span> <strong class="text-success">${ans.correct_option}</strong>` : ''}
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', qCard);
    });
}

function getOptionReviewClass(ans, optionKey) {
    const selected = ans.selected_option;
    const correct = ans.correct_option;

    if (optionKey === correct) {
        return 'bg-success-light border-success text-success fw-600';
    }
    if (optionKey === selected && selected !== correct) {
        return 'bg-danger-light border-danger text-danger fw-600';
    }
    return 'bg-light text-muted';
}

async function sendEmailReport() {
    const emailBtn = document.getElementById('email-result-btn');
    if (emailBtn) {
        emailBtn.disabled = true;
        emailBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Sending...`;
    }

    try {
        const response = await apiPost('student/send-result-email.php', { attempt_id: parseInt(resultAttemptId) });
        if (response.success) {
            showToast(response.message, 'success');
        } else {
            showToast(response.message, 'warning');
        }
    } catch (e) {
        showToast('Email request failed: ' + e.message, 'danger');
    } finally {
        if (emailBtn) {
            emailBtn.disabled = false;
            emailBtn.innerHTML = `<i class="bi bi-envelope-fill me-1"></i>Email PDF Report`;
        }
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
