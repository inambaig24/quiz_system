<?php
// ============================================
// Add Question to Bank Endpoint
// POST: Admin adds a question to the global question bank
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
    requireRole('admin');

    $data = getRequestBody();

    // Validate required fields
    $missing = validateRequired($data, ['subject_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'difficulty']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please fill in all fields.', $missing);
    }

    $subjectId = (int) $data['subject_id'];
    $questionText = sanitizeInput($data['question_text']);
    $optionA = sanitizeInput($data['option_a']);
    $optionB = sanitizeInput($data['option_b']);
    $optionC = sanitizeInput($data['option_c']);
    $optionD = sanitizeInput($data['option_d']);
    $correctOption = strtoupper(sanitizeInput($data['correct_option']));
    $difficulty = sanitizeInput($data['difficulty']);

    if (!validateCorrectOption($correctOption)) {
        ob_end_clean();
        sendError('Correct option must be A, B, C, or D.');
    }

    if (!validateDifficulty($difficulty)) {
        ob_end_clean();
        sendError('Invalid difficulty level.');
    }

    $stmt = $pdo->prepare("SELECT subject_id FROM subjects WHERE subject_id = ?");
    $stmt->execute([$subjectId]);
    if (!$stmt->fetch()) {
        ob_end_clean();
        sendError('Subject not found.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$subjectId, $questionText, $optionA, $optionB, $optionC, $optionD, $correctOption, $difficulty]);

    ob_end_clean();
    sendSuccess('Question added to the question bank.', [
        'question_id' => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to add question. Please try again.');
}
?>