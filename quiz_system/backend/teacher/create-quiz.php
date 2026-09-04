<?php
// ============================================
// Create Quiz Endpoint
// POST: Teacher creates a new quiz
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/validate.php';
require_once '../helpers/session.php';
require_once '../helpers/quiz-code-generator.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('teacher');

    $data = getRequestBody();

    $missing = validateRequired($data, ['subject_id', 'quiz_title', 'duration_minutes', 'total_questions']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please fill in all required fields.', $missing);
    }

    $teacherId      = getUserId();
    $subjectId      = (int) $data['subject_id'];
    $quizTitle      = sanitizeInput($data['quiz_title']);
    $quizDescription = sanitizeInput($data['quiz_description'] ?? '');
    $theme          = sanitizeInput($data['theme'] ?? 'default');
    $durationMinutes = (int) $data['duration_minutes'];
    $totalQuestions = (int) $data['total_questions'];
    $difficulty     = sanitizeInput($data['difficulty'] ?? 'Easy');

    if (!validateDifficulty($difficulty)) {
        ob_end_clean();
        sendError('Invalid difficulty level. Choose Easy, Medium, or Hard.');
    }

    if ($durationMinutes < 1 || $durationMinutes > 180) {
        ob_end_clean();
        sendError('Duration must be between 1 and 180 minutes.');
    }

    if ($totalQuestions < 1 || $totalQuestions > 100) {
        ob_end_clean();
        sendError('Number of questions must be between 1 and 100.');
    }

    $stmt = $pdo->prepare("SELECT subject_id FROM subjects WHERE subject_id = ?");
    $stmt->execute([$subjectId]);
    if (!$stmt->fetch()) {
        ob_end_clean();
        sendError('Selected subject does not exist.');
    }

    $quizCode = generateQuizCode();

    $stmt = $pdo->prepare("
        INSERT INTO quizzes (teacher_id, subject_id, quiz_title, quiz_description, quiz_code, theme, duration_minutes, total_questions, difficulty, quiz_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'teacher', 'active')
    ");
    $stmt->execute([$teacherId, $subjectId, $quizTitle, $quizDescription, $quizCode, $theme, $durationMinutes, $totalQuestions, $difficulty]);

    $quizId = $pdo->lastInsertId();

    ob_end_clean();
    sendSuccess('Quiz created successfully!', [
        'quiz_id'         => $quizId,
        'quiz_code'       => $quizCode,
        'quiz_title'      => $quizTitle,
        'total_questions' => $totalQuestions,
        'duration_minutes'=> $durationMinutes
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to create quiz. Please try again.');
}
?>
