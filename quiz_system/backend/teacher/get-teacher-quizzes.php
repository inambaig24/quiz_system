<?php
// ============================================
// Get Teacher Quizzes Endpoint
// GET: Fetch all quizzes created by logged-in teacher
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

    $teacherId   = getUserId();
    $statusFilter = isset($_GET['status']) ? $_GET['status'] : null;
    $searchTerm  = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : null;

    $sql = "
        SELECT q.*, s.subject_name,
            (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.quiz_id) as attempt_count,
            (SELECT COUNT(*) FROM questions qs WHERE qs.quiz_id = q.quiz_id) as question_count
        FROM quizzes q
        JOIN subjects s ON q.subject_id = s.subject_id
        WHERE q.teacher_id = ?
    ";

    $params = [$teacherId];

    if ($statusFilter && in_array($statusFilter, ['active', 'completed', 'cancelled'])) {
        $sql .= " AND q.status = ?";
        $params[] = $statusFilter;
    }

    if ($searchTerm) {
        $sql .= " AND (q.quiz_title LIKE ? OR s.subject_name LIKE ? OR q.quiz_code LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

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
