<?php
// ============================================
// Reports API Endpoint
// GET: Fetch report data for charts and analytics
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

    $role       = getUserRole();
    $userId     = getUserId();
    $reportType = isset($_GET['type']) ? $_GET['type'] : 'overview';

    $reportData = [];

    if ($role === 'teacher') {
        if ($reportType === 'quiz_attempts') {
            $stmt = $pdo->prepare("
                SELECT q.quiz_title, COUNT(qa.attempt_id) as attempts
                FROM quizzes q
                LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
                WHERE q.teacher_id = ?
                GROUP BY q.quiz_id
                ORDER BY attempts DESC
            ");
            $stmt->execute([$userId]);
            $reportData = $stmt->fetchAll();
        } elseif ($reportType === 'avg_scores') {
            $stmt = $pdo->prepare("
                SELECT q.quiz_title, ROUND(AVG(qa.percentage), 2) as avg_score
                FROM quizzes q
                JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
                WHERE q.teacher_id = ?
                GROUP BY q.quiz_id
                ORDER BY avg_score DESC
            ");
            $stmt->execute([$userId]);
            $reportData = $stmt->fetchAll();
        } elseif ($reportType === 'correct_wrong') {
            $stmt = $pdo->prepare("
                SELECT q.quiz_title, 
                       SUM(qa.correct_answers) as total_correct, 
                       SUM(qa.wrong_answers) as total_wrong
                FROM quizzes q
                JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
                WHERE q.teacher_id = ?
                GROUP BY q.quiz_id
            ");
            $stmt->execute([$userId]);
            $reportData = $stmt->fetchAll();
        }
    } elseif ($role === 'admin') {
        $reportData = ['message' => 'Use /admin/dashboard-stats.php for admin reports'];
    }

    ob_end_clean();
    sendSuccess('Report data retrieved successfully.', $reportData);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve report data. Please try again.');
}
?>