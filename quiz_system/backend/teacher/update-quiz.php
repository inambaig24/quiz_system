<?php
// ============================================
// Update Quiz Endpoint
// POST: Teacher updates quiz details
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
    requireRole('teacher');

    $data = getRequestBody();

    if (!isset($data['quiz_id'])) {
        ob_end_clean();
        sendError('Quiz ID is required.');
    }

    $quizId = (int) $data['quiz_id'];

    $stmt = $pdo->prepare("SELECT * FROM quizzes WHERE quiz_id = ? AND teacher_id = ?");
    $stmt->execute([$quizId, getUserId()]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found or you do not have permission.');
    }

    $updates = [];
    $params  = [];

    if (isset($data['quiz_title']) && trim($data['quiz_title']) !== '') {
        $updates[] = "quiz_title = ?";
        $params[]  = sanitizeInput($data['quiz_title']);
    }

    if (isset($data['quiz_description'])) {
        $updates[] = "quiz_description = ?";
        $params[]  = sanitizeInput($data['quiz_description']);
    }

    if (isset($data['duration_minutes'])) {
        $duration = (int) $data['duration_minutes'];
        if ($duration < 1 || $duration > 180) {
            ob_end_clean();
            sendError('Duration must be between 1 and 180 minutes.');
        }
        $updates[] = "duration_minutes = ?";
        $params[]  = $duration;
    }

    if (isset($data['difficulty'])) {
        if (!validateDifficulty($data['difficulty'])) {
            ob_end_clean();
            sendError('Invalid difficulty level.');
        }
        $updates[] = "difficulty = ?";
        $params[]  = $data['difficulty'];
    }

    if (isset($data['theme'])) {
        $updates[] = "theme = ?";
        $params[]  = sanitizeInput($data['theme']);
    }

    if (isset($data['status'])) {
        $validStatuses = ['active', 'completed', 'cancelled'];
        if (!in_array($data['status'], $validStatuses)) {
            ob_end_clean();
            sendError('Invalid quiz status.');
        }
        $updates[] = "status = ?";
        $params[]  = $data['status'];
    }

    if (empty($updates)) {
        ob_end_clean();
        sendError('No fields to update.');
    }

    $params[] = $quizId;
    $sql = "UPDATE quizzes SET " . implode(', ', $updates) . " WHERE quiz_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    ob_end_clean();
    sendSuccess('Quiz updated successfully.');

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to update quiz. Please try again.');
}
?>
