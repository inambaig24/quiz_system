<?php
// ============================================
// Get Result Endpoint
// GET: Fetch quiz attempt result details
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
    requireRole('student');

    if (!isset($_GET['attempt_id'])) {
        ob_end_clean();
        sendError('Attempt ID is required.');
    }

    $attemptId = (int) $_GET['attempt_id'];
    $studentId = getUserId();

    $stmt = $pdo->prepare("
        SELECT 
            qa.attempt_id, qa.score, qa.total_questions, qa.correct_answers, 
            qa.wrong_answers, qa.percentage, qa.submitted_at, qa.pdf_report_path,
            q.quiz_title, q.quiz_description, q.quiz_type, q.difficulty,
            s.subject_name,
            st.name as student_name, st.university_email as student_email,
            t.name as teacher_name
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        JOIN subjects s ON q.subject_id = s.subject_id
        JOIN students st ON qa.student_id = st.student_id
        LEFT JOIN teachers t ON q.teacher_id = t.teacher_id
        WHERE qa.attempt_id = ? AND qa.student_id = ?
    ");
    $stmt->execute([$attemptId, $studentId]);
    $result = $stmt->fetch();

    if (!$result) {
        ob_end_clean();
        sendError('Result not found.');
    }

    $leaderboardPosition = null;
    if ($result['quiz_type'] === 'teacher') {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) + 1 as position
            FROM quiz_attempts 
            WHERE quiz_id = (SELECT quiz_id FROM quiz_attempts WHERE attempt_id = ?)
            AND (score > ? OR (score = ? AND submitted_at < (SELECT submitted_at FROM quiz_attempts WHERE attempt_id = ?)))
        ");
        $stmt->execute([$attemptId, $result['score'], $result['score'], $attemptId]);
        $pos = $stmt->fetch();
        $leaderboardPosition = $pos['position'];
    }

    $result['leaderboard_position'] = $leaderboardPosition;

    $stmt = $pdo->prepare("
        SELECT 
            sa.selected_option, sa.is_correct,
            qs.question_text, qs.option_a, qs.option_b, qs.option_c, qs.option_d, qs.correct_option
        FROM student_answers sa
        JOIN questions qs ON sa.question_id = qs.question_id
        WHERE sa.attempt_id = ?
        ORDER BY qs.question_id ASC
    ");
    $stmt->execute([$attemptId]);
    $answers = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Result retrieved successfully.', [
        'result'  => $result,
        'answers' => $answers
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve result. Please try again.');
}
?>