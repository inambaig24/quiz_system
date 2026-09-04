<?php
// ============================================
// Allow Reattempt Endpoint
// POST: Teacher toggles reattempt permission
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

    $quizId        = (int) $data['quiz_id'];
    $allowReattempt = isset($data['allow_reattempt']) ? (bool) $data['allow_reattempt'] : true;

    $stmt = $pdo->prepare("SELECT quiz_id FROM quizzes WHERE quiz_id = ? AND teacher_id = ?");
    $stmt->execute([$quizId, getUserId()]);

    if (!$stmt->fetch()) {
        ob_end_clean();
        sendError('Quiz not found or you do not have permission.');
    }

    $stmt = $pdo->prepare("UPDATE quizzes SET allow_reattempt = ? WHERE quiz_id = ?");
    $stmt->execute([$allowReattempt ? 1 : 0, $quizId]);

    $statusText = $allowReattempt ? 'enabled' : 'disabled';
    ob_end_clean();
    sendSuccess("Reattempt has been $statusText for this quiz.");

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to update reattempt setting. Please try again.');
}
?>
