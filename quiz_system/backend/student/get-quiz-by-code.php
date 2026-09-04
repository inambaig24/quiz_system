<?php
// ============================================
// Get Quiz By Code Endpoint
// GET: Fetch quiz questions by quiz code (no answers)
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('student');

    if (!isset($_GET['code']) || trim($_GET['code']) === '') {
        ob_end_clean();
        sendError('Quiz code is required.');
    }

    $quizCode = strtoupper(trim($_GET['code']));

    $stmt = $pdo->prepare("
        SELECT q.quiz_id, q.quiz_title, q.quiz_description, q.duration_minutes, q.total_questions, q.difficulty, q.theme,
               s.subject_name, t.name as teacher_name
        FROM quizzes q
        JOIN subjects s ON q.subject_id = s.subject_id
        LEFT JOIN teachers t ON q.teacher_id = t.teacher_id
        WHERE q.quiz_code = ? AND q.status = 'active'
    ");
    $stmt->execute([$quizCode]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found or is no longer active.');
    }

    $stmt = $pdo->prepare("
        SELECT question_id, question_text, option_a, option_b, option_c, option_d
        FROM questions
        WHERE quiz_id = ?
        ORDER BY question_id ASC
    ");
    $stmt->execute([$quiz['quiz_id']]);
    $questions = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Quiz retrieved successfully.', [
        'quiz'      => $quiz,
        'questions' => $questions
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve quiz. Please try again.');
}
?>