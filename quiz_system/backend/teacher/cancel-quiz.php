<?php
// ============================================
// Cancel Quiz Endpoint
// POST: Teacher cancels a quiz
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('teacher');

    $data = getRequestBody();

    if (!isset($data['quiz_id'])) {
        ob_end_clean();
        sendError('Quiz ID is required.');
    }

    $quizId = (int) $data['quiz_id'];

    $stmt = $pdo->prepare("SELECT quiz_id, status FROM quizzes WHERE quiz_id = ? AND teacher_id = ?");
    $stmt->execute([$quizId, getUserId()]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found or you do not have permission.');
    }

    if ($quiz['status'] === 'cancelled') {
        ob_end_clean();
        sendError('This quiz is already cancelled.');
    }

    $stmt = $pdo->prepare("UPDATE quizzes SET status = 'cancelled' WHERE quiz_id = ?");
    $stmt->execute([$quizId]);

    ob_end_clean();
    sendSuccess('Quiz has been cancelled successfully.');

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to cancel quiz. Please try again.');
}
?>
