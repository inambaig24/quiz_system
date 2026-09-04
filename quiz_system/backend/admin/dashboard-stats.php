<?php
// ============================================
// Admin Dashboard Stats Endpoint
// GET: Returns system-wide statistics
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
    requireRole('admin');

    $stmt = $pdo->query("SELECT COUNT(*) FROM teachers");
    $totalTeachers = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM students");
    $totalStudents = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM quizzes");
    $totalQuizzes = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM quiz_attempts");
    $totalAttempts = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM subjects");
    $totalSubjects = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM questions WHERE quiz_id IS NULL");
    $totalBankQuestions = $stmt->fetchColumn();

    $stmt = $pdo->query("
        SELECT s.name, s.university_email, 
               AVG(qa.percentage) as avg_percentage,
               COUNT(qa.attempt_id) as total_attempts
        FROM students s
        JOIN quiz_attempts qa ON s.student_id = qa.student_id
        GROUP BY s.student_id
        ORDER BY avg_percentage DESC
        LIMIT 5
    ");
    $topStudents = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT qa.attempt_id, s.name as student_name, q.quiz_title, 
               qa.score, qa.total_questions, qa.percentage, qa.submitted_at
        FROM quiz_attempts qa
        JOIN students s ON qa.student_id = s.student_id
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        ORDER BY qa.submitted_at DESC
        LIMIT 10
    ");
    $recentActivity = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT s.subject_name, COUNT(q.quiz_id) as quiz_count
        FROM subjects s
        LEFT JOIN quizzes q ON s.subject_id = q.subject_id
        GROUP BY s.subject_id
        ORDER BY quiz_count DESC
    ");
    $quizzesBySubject = $stmt->fetchAll();

    $stmt = $pdo->query("
        SELECT DATE_FORMAT(submitted_at, '%Y-%m') as month, COUNT(*) as attempts
        FROM quiz_attempts
        WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
    ");
    $monthlyTrends = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Dashboard stats retrieved successfully.', [
        'total_teachers'      => (int) $totalTeachers,
        'total_students'      => (int) $totalStudents,
        'total_quizzes'       => (int) $totalQuizzes,
        'total_attempts'      => (int) $totalAttempts,
        'total_subjects'      => (int) $totalSubjects,
        'total_bank_questions'=> (int) $totalBankQuestions,
        'top_students'        => $topStudents,
        'recent_activity'     => $recentActivity,
        'quizzes_by_subject'  => $quizzesBySubject,
        'monthly_trends'      => $monthlyTrends
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve dashboard stats. Please try again.');
}
?>