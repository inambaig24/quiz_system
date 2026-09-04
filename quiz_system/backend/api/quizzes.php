<?php
// ============================================
// Quizzes API Endpoint
// GET: Fetch quizzes with filters
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
    requireLogin();

    $quizId    = isset($_GET['quiz_id'])    ? (int) $_GET['quiz_id']    : null;
    $subjectId = isset($_GET['subject_id']) ? (int) $_GET['subject_id'] : null;
    $status    = isset($_GET['status'])     ? $_GET['status']           : null;
    $type      = isset($_GET['type'])       ? $_GET['type']             : null;

    $sql = "
        SELECT q.*, s.subject_name, t.name as teacher_name,
            (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.quiz_id) as attempt_count
        FROM quizzes q
        JOIN subjects s ON q.subject_id = s.subject_id
        LEFT JOIN teachers t ON q.teacher_id = t.teacher_id
        WHERE 1=1
    ";
    $params = [];

    if ($quizId)    { $sql .= " AND q.quiz_id = ?";    $params[] = $quizId; }
    if ($subjectId) { $sql .= " AND q.subject_id = ?"; $params[] = $subjectId; }
    if ($status)    { $sql .= " AND q.status = ?";     $params[] = $status; }
    if ($type)      { $sql .= " AND q.quiz_type = ?";  $params[] = $type; }

    $sql .= " ORDER BY q.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $quizzes = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Quizzes retrieved successfully.', $quizzes);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve quizzes. Please try again.');
}
?>