<?php
// ============================================
// Join Quiz Endpoint
// POST: Student joins a teacher quiz by code
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/validate.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('student');

    $data = getRequestBody();

    if (!isset($data['quiz_code']) || trim($data['quiz_code']) === '') {
        ob_end_clean();
        sendError('Please enter a quiz code.');
    }

    $quizCode  = strtoupper(sanitizeInput(trim($data['quiz_code'])));
    $studentId = getUserId();

    $stmt = $pdo->prepare("
        SELECT q.*, s.subject_name, t.name as teacher_name
        FROM quizzes q
        JOIN subjects s ON q.subject_id = s.subject_id
        LEFT JOIN teachers t ON q.teacher_id = t.teacher_id
        WHERE q.quiz_code = ?
    ");
    $stmt->execute([$quizCode]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Invalid quiz code. Please check and try again.');
    }

    if ($quiz['status'] === 'cancelled') {
        ob_end_clean();
        sendError('This quiz is no longer available. It has been cancelled by the teacher.');
    }

    if ($quiz['status'] === 'completed') {
        ob_end_clean();
        sendError('This quiz has already been completed.');
    }

    $stmt = $pdo->prepare("SELECT attempt_id FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?");
    $stmt->execute([$quiz['quiz_id'], $studentId]);
    $existingAttempt = $stmt->fetch();

    if ($existingAttempt && !$quiz['allow_reattempt']) {
        ob_end_clean();
        sendError('You have already attempted this quiz. Reattempts are not allowed.');
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM questions WHERE quiz_id = ?");
    $stmt->execute([$quiz['quiz_id']]);
    $questionCount = $stmt->fetchColumn();

    if ($questionCount < 1) {
        ob_end_clean();
        sendError('This quiz does not have any questions yet. Please try again later.');
    }

    ob_end_clean();
    sendSuccess('Quiz found! You can now start the quiz.', [
        'quiz_id'          => $quiz['quiz_id'],
        'quiz_title'       => $quiz['quiz_title'],
        'quiz_description' => $quiz['quiz_description'],
        'subject_name'     => $quiz['subject_name'],
        'teacher_name'     => $quiz['teacher_name'],
        'duration_minutes' => $quiz['duration_minutes'],
        'total_questions'  => $questionCount,
        'difficulty'       => $quiz['difficulty'],
        'theme'            => $quiz['theme'],
        'is_reattempt'     => $existingAttempt ? true : false
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to join quiz. Please try again.');
}
?>