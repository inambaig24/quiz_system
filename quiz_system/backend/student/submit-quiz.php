<?php
// ============================================
// Submit Quiz Endpoint
// POST: Student submits quiz answers
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('student');

    $data = getRequestBody();

    if (!isset($data['quiz_id']) || !isset($data['answers'])) {
        ob_end_clean();
        sendError('Quiz ID and answers are required.');
    }

    $quizId    = (int) $data['quiz_id'];
    $answers   = $data['answers'];
    $studentId = getUserId();

    $stmt = $pdo->prepare("SELECT * FROM quizzes WHERE quiz_id = ?");
    $stmt->execute([$quizId]);
    $quiz = $stmt->fetch();

    if (!$quiz) {
        ob_end_clean();
        sendError('Quiz not found.');
    }

    if ($quiz['quiz_type'] === 'teacher') {
        $stmt = $pdo->prepare("SELECT attempt_id FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?");
        $stmt->execute([$quizId, $studentId]);
        if ($stmt->fetch() && !$quiz['allow_reattempt']) {
            ob_end_clean();
            sendError('You have already attempted this quiz.');
        }
    }

    $stmt = $pdo->prepare("SELECT question_id, correct_option FROM questions WHERE quiz_id = ?");
    $stmt->execute([$quizId]);
    $correctAnswers = [];
    while ($row = $stmt->fetch()) {
        $correctAnswers[$row['question_id']] = $row['correct_option'];
    }

    $totalQuestions = count($correctAnswers);
    $correctCount   = 0;
    $wrongCount     = 0;

    $pdo->beginTransaction();

    $score         = 0;
    $answerRecords = [];

    foreach ($correctAnswers as $questionId => $correctOption) {
        $selectedOption = null;
        $isCorrect      = false;

        foreach ($answers as $answer) {
            if ((int) $answer['question_id'] === $questionId) {
                $selectedOption = strtoupper($answer['selected_option'] ?? '');
                break;
            }
        }

        if ($selectedOption && $selectedOption === $correctOption) {
            $isCorrect = true;
            $correctCount++;
            $score++;
        } else {
            $wrongCount++;
        }

        $answerRecords[] = [
            'question_id'     => $questionId,
            'selected_option' => $selectedOption ?: null,
            'is_correct'      => $isCorrect
        ];
    }

    $percentage = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100, 2) : 0;

    $stmt = $pdo->prepare("
        INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions, correct_answers, wrong_answers, percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$quizId, $studentId, $score, $totalQuestions, $correctCount, $wrongCount, $percentage]);

    $attemptId = $pdo->lastInsertId();

    $stmt = $pdo->prepare("
        INSERT INTO student_answers (attempt_id, question_id, selected_option, is_correct)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($answerRecords as $record) {
        $stmt->execute([
            $attemptId,
            $record['question_id'],
            $record['selected_option'],
            $record['is_correct'] ? 1 : 0
        ]);
    }

    $pdo->commit();

    ob_end_clean();
    sendSuccess('Quiz submitted successfully!', [
        'attempt_id'      => $attemptId,
        'quiz_id'         => $quizId,
        'score'           => $score,
        'total_questions' => $totalQuestions,
        'correct_answers' => $correctCount,
        'wrong_answers'   => $wrongCount,
        'percentage'      => $percentage,
        'quiz_title'      => $quiz['quiz_title']
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    ob_end_clean();
    sendError('Failed to submit quiz. Please try again.', 500);
}
?>