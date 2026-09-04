<?php
// ============================================
// Subjects API Endpoint
// GET: Fetch all subjects with optional search
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

    $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : null;

    if ($search) {
        $stmt = $pdo->prepare("
            SELECT s.*, 
                (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.subject_id AND q.quiz_id IS NULL) as question_count
            FROM subjects s 
            WHERE s.subject_name LIKE ? 
            ORDER BY s.subject_name ASC
        ");
        $stmt->execute([$search]);
    } else {
        $stmt = $pdo->query("
            SELECT s.*, 
                (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.subject_id AND q.quiz_id IS NULL) as question_count
            FROM subjects s 
            ORDER BY s.subject_name ASC
        ");
    }

    $subjects = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Subjects retrieved successfully.', $subjects);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve subjects. Please try again.');
}
?>