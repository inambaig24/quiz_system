<?php
// ============================================
// Add Question Endpoint
// POST: Teacher adds an MCQ question to a quiz
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

    $missing = validateRequired($data, ['quiz_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please fill in all question fields.', $missing);
    }

    $quizId       = (int) $data['quiz_id'];
    $questionText = sanitizeInput($data['question_text']);
    $optionA      = sanitizeInput($data['option_a']);
    $optionB      = sanitizeInput($data['option_b']);
    $optionC      = sanitizeInput($data['option_c']);
    $optionD      = sanitizeInput($data['option_d']);
    $correctOption = strtoupper(sanitizeInput($data['correct_option']));
    $difficulty   = sanitizeInput($data['difficulty'] ?? 'Easy');

    if (!validateCorrectOption($correctOption)) {
        ob_end_clean();
        sendError('Correct option must be A, B, C, or D.');
    }

    if (!validateDifficulty($difficulty)) {
        ob_end_clean();
        sendError('Invalid difficulty level.');
    }

    $stmt = $pdo->prepare("SELECT quiz_id, subject_id, total_questions FROM quizzes WHERE quiz_id = ? AND teacher_id = ?");
    $stmt->execute([$quizId, getUserId()]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found or you do not have permission to add questions.');
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM questions WHERE quiz_id = ?");
    $stmt->execute([$quizId]);
    $currentCount = $stmt->fetchColumn();

    if ($currentCount >= $quiz['total_questions']) {
        ob_end_clean();
        sendError('Maximum number of questions (' . $quiz['total_questions'] . ') already added.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$quizId, $quiz['subject_id'], $questionText, $optionA, $optionB, $optionC, $optionD, $correctOption, $difficulty]);

    $questionId         = $pdo->lastInsertId();
    $remainingQuestions = $quiz['total_questions'] - ($currentCount + 1);

    ob_end_clean();
    sendSuccess('Question added successfully!', [
        'question_id'    => $questionId,
        'current_count'  => $currentCount + 1,
        'total_required' => $quiz['total_questions'],
        'remaining'      => $remainingQuestions
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to add question. Please try again.');
}
?>
