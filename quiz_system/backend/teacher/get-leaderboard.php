<?php
// ============================================
// Get Leaderboard Endpoint
// GET: Fetch ranked student attempts for a quiz
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
    requireRole('teacher');

    if (!isset($_GET['quiz_id'])) {
        ob_end_clean();
        sendError('Quiz ID is required.');
    }

    $quizId = (int) $_GET['quiz_id'];

    $stmt = $pdo->prepare("SELECT quiz_id, quiz_title FROM quizzes WHERE quiz_id = ? AND teacher_id = ?");
    $stmt->execute([$quizId, getUserId()]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found or you do not have permission.');
    }

    $stmt = $pdo->prepare("
        SELECT 
            qa.attempt_id,
            s.name as student_name,
            s.university_email as student_email,
            qa.score,
            qa.total_questions,
            qa.correct_answers,
            qa.wrong_answers,
            qa.percentage,
            qa.submitted_at
        FROM quiz_attempts qa
        JOIN students s ON qa.student_id = s.student_id
        WHERE qa.quiz_id = ?
        ORDER BY qa.score DESC, qa.submitted_at ASC
    ");
    $stmt->execute([$quizId]);
    $attempts = $stmt->fetchAll();

    $rank = 1;
    foreach ($attempts as &$attempt) {
        $attempt['rank'] = $rank++;
    }

    ob_end_clean();
    sendSuccess('Leaderboard retrieved successfully.', [
        'quiz_title'    => $quiz['quiz_title'],
        'total_attempts'=> count($attempts),
        'leaderboard'   => $attempts
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve leaderboard. Please try again.');
}
?>
