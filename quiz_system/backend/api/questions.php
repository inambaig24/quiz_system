<?php
// ============================================
// Questions API Endpoint
// GET: Fetch questions by quiz or subject
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

    $quizId     = isset($_GET['quiz_id'])    ? (int) $_GET['quiz_id']    : null;
    $subjectId  = isset($_GET['subject_id']) ? (int) $_GET['subject_id'] : null;
    $difficulty = isset($_GET['difficulty']) ? $_GET['difficulty']       : null;
    $bankOnly   = isset($_GET['bank_only'])  ? true                      : false;

    $sql    = "SELECT q.*, s.subject_name FROM questions q JOIN subjects s ON q.subject_id = s.subject_id WHERE 1=1";
    $params = [];

    if ($quizId)    { $sql .= " AND q.quiz_id = ?";    $params[] = $quizId; }
    if ($subjectId) { $sql .= " AND q.subject_id = ?"; $params[] = $subjectId; }
    if ($difficulty){ $sql .= " AND q.difficulty = ?"; $params[] = $difficulty; }
    if ($bankOnly)  { $sql .= " AND q.quiz_id IS NULL"; }

    $sql .= " ORDER BY q.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();

    // Remove correct answers if student is requesting
    if (getUserRole() === 'student') {
        foreach ($questions as &$question) {
            unset($question['correct_option']);
        }
    }

    ob_end_clean();
    sendSuccess('Questions retrieved successfully.', $questions);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve questions. Please try again.');
}
?>