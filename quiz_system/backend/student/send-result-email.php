<?php
// ============================================
// Send Result Email Endpoint
// POST: Generates PDF and sends email to student
// ============================================

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

requireRole('student');

$data = getRequestBody();

if (!isset($data['attempt_id'])) {
    sendError('Attempt ID is required.');
}

$attemptId = (int) $data['attempt_id'];
$studentId = getUserId();

// Verify attempt belongs to this student
$stmt = $pdo->prepare("
    SELECT qa.*, q.quiz_title, s.subject_name, st.name as student_name, st.university_email,
           t.name as teacher_name
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.quiz_id
    JOIN subjects s ON q.subject_id = s.subject_id
    JOIN students st ON qa.student_id = st.student_id
    LEFT JOIN teachers t ON q.teacher_id = t.teacher_id
    WHERE qa.attempt_id = ? AND qa.student_id = ?
");
$stmt->execute([$attemptId, $studentId]);
$attempt = $stmt->fetch();

if (!$attempt) {
    sendError('Attempt not found.');
}

// Generate PDF report
try {
    require_once '../pdf/generate-result-pdf.php';
    $pdfPath = generateResultPDF($attempt);

    // Update attempt record with PDF path
    $stmt = $pdo->prepare("UPDATE quiz_attempts SET pdf_report_path = ? WHERE attempt_id = ?");
    $stmt->execute([$pdfPath, $attemptId]);

} catch (Exception $e) {
    // PDF generation failed but we continue
    $pdfPath = null;
}

// Send email with result
try {
    require_once '../mail/send-mail.php';

    $subject = "Quiz Result: " . $attempt['quiz_title'];
    $body = "
        <h2>Online Quiz System - Result Report</h2>
        <p>Dear {$attempt['student_name']},</p>
        <p>Here are your results for <strong>{$attempt['quiz_title']}</strong>:</p>
        <table style='border-collapse: collapse; width: 100%;'>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'>Subject</td><td style='padding: 8px; border: 1px solid #ddd;'>{$attempt['subject_name']}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'>Score</td><td style='padding: 8px; border: 1px solid #ddd;'>{$attempt['score']}/{$attempt['total_questions']}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'>Correct Answers</td><td style='padding: 8px; border: 1px solid #ddd;'>{$attempt['correct_answers']}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'>Wrong Answers</td><td style='padding: 8px; border: 1px solid #ddd;'>{$attempt['wrong_answers']}</td></tr>
            <tr><td style='padding: 8px; border: 1px solid #ddd;'>Percentage</td><td style='padding: 8px; border: 1px solid #ddd;'>{$attempt['percentage']}%</td></tr>
        </table>
        <p>Please find the detailed PDF report attached.</p>
        <p>Best regards,<br>Online Quiz System</p>
    ";

    $emailSent = sendMail($attempt['university_email'], $subject, $body, $pdfPath);

    if ($emailSent) {
        sendSuccess('Result report has been sent to your email.', [
            'email' => $attempt['university_email'],
            'pdf_generated' => $pdfPath !== null
        ]);
    } else {
        sendSuccess('PDF report generated but email could not be sent. Please configure SMTP settings.', [
            'email_sent' => false,
            'pdf_generated' => $pdfPath !== null
        ]);
    }

} catch (Exception $e) {
    sendSuccess('Result saved but email service is not configured.', [
        'email_sent' => false,
        'pdf_generated' => $pdfPath !== null
    ]);
}
?>