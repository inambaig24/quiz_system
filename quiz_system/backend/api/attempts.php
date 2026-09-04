<?php
// ============================================
// Attempts API Endpoint
// GET: Fetch quiz attempts for student or admin
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

    $role   = getUserRole();
    $userId = getUserId();

    $sql = "
        SELECT qa.*, q.quiz_title, q.quiz_type, s.subject_name, st.name as student_name, st.university_email
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        JOIN subjects s ON q.subject_id = s.subject_id
        JOIN students st ON qa.student_id = st.student_id
        WHERE 1=1
    ";
    $params = [];

    if ($role === 'student') {
        $sql .= " AND qa.student_id = ?";
        $params[] = $userId;
    }

    if (isset($_GET['quiz_id'])) {
        $sql .= " AND qa.quiz_id = ?";
        $params[] = (int) $_GET['quiz_id'];
    }

    $sql .= " ORDER BY qa.submitted_at DESC";

    if ($role === 'student') {
        $sql .= " LIMIT 50";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $attempts = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Attempts retrieved successfully.', $attempts);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve attempts. Please try again.');
}
?>