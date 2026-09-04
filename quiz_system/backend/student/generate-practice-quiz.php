<?php
// ============================================
// Generate Practice Quiz Endpoint
// POST: Creates a random practice quiz for student
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
    requireRole('student');

    $data = getRequestBody();

    $missing = validateRequired($data, ['subject_id', 'difficulty', 'num_questions']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please provide subject, difficulty, and number of questions.', $missing);
    }

    $subjectId    = (int) $data['subject_id'];
    $difficulty   = sanitizeInput($data['difficulty']);
    $numQuestions = (int) $data['num_questions'];

    if (!validateDifficulty($difficulty)) {
        ob_end_clean();
        sendError('Invalid difficulty level. Choose Easy, Medium, or Hard.');
    }

    if ($numQuestions < 1 || $numQuestions > 50) {
        ob_end_clean();
        sendError('Number of questions must be between 1 and 50.');
    }

    $stmt = $pdo->prepare("SELECT subject_id, subject_name FROM subjects WHERE subject_id = ?");
    $stmt->execute([$subjectId]);
    $subject = $stmt->fetch();

    if (!$subject) {
        ob_end_clean();
        sendError('Selected subject does not exist.');
    }

    $stmt = $pdo->prepare("
        SELECT question_id, question_text, option_a, option_b, option_c, option_d
        FROM questions
        WHERE subject_id = ? AND difficulty = ? AND quiz_id IS NULL
        ORDER BY RAND()
        LIMIT ?
    ");
    $stmt->bindValue(1, $subjectId, PDO::PARAM_INT);
    $stmt->bindValue(2, $difficulty, PDO::PARAM_STR);
    $stmt->bindValue(3, $numQuestions, PDO::PARAM_INT);
    $stmt->execute();
    $questions = $stmt->fetchAll();

    if (count($questions) < 1) {
        ob_end_clean();
        sendError('No questions available for this subject and difficulty level.');
    }

    $quizTitle = "Practice: " . $subject['subject_name'] . " (" . $difficulty . ")";
    $duration  = max(5, ceil(count($questions) * 1.5));

    $stmt = $pdo->prepare("
        INSERT INTO quizzes (teacher_id, subject_id, quiz_title, quiz_description, duration_minutes, total_questions, difficulty, quiz_type, status)
        VALUES (NULL, ?, ?, 'Auto-generated practice quiz', ?, ?, ?, 'practice', 'active')
    ");
    $stmt->execute([$subjectId, $quizTitle, $duration, count($questions), $difficulty]);

    $quizId = $pdo->lastInsertId();

    foreach ($questions as $q) {
        $stmtQ = $pdo->prepare("SELECT * FROM questions WHERE question_id = ?");
        $stmtQ->execute([$q['question_id']]);
        $fullQ = $stmtQ->fetch();

        $stmtInsert = $pdo->prepare("
            INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsert->execute([
            $quizId, $subjectId,
            $fullQ['question_text'], $fullQ['option_a'], $fullQ['option_b'],
            $fullQ['option_c'],      $fullQ['option_d'], $fullQ['correct_option'],
            $fullQ['difficulty']
        ]);
    }

    $stmt = $pdo->prepare("
        SELECT question_id, question_text, option_a, option_b, option_c, option_d
        FROM questions
        WHERE quiz_id = ?
        ORDER BY question_id ASC
    ");
    $stmt->execute([$quizId]);
    $practiceQuestions = $stmt->fetchAll();

    ob_end_clean();
    sendSuccess('Practice quiz generated successfully!', [
        'quiz_id'         => $quizId,
        'quiz_title'      => $quizTitle,
        'subject_name'    => $subject['subject_name'],
        'difficulty'      => $difficulty,
        'duration_minutes'=> $duration,
        'total_questions' => count($practiceQuestions),
        'questions'       => $practiceQuestions
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to generate practice quiz. Please try again.');
}
?>