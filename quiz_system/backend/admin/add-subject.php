<?php
// ============================================
// Add Subject Endpoint
// POST: Admin adds a new subject
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

    $missing = validateRequired($data, ['subject_name']);
    if (!empty($missing)) {
        ob_end_clean();
        sendError('Subject name is required.');
    }

    $subjectName = sanitizeInput($data['subject_name']);
    $subjectDescription = sanitizeInput($data['subject_description'] ?? '');

    $stmt = $pdo->prepare("SELECT subject_id FROM subjects WHERE subject_name = ?");
    $stmt->execute([$subjectName]);

    if ($stmt->fetch()) {
        ob_end_clean();
        sendError('A subject with this name already exists.');
    }

    $stmt = $pdo->prepare("INSERT INTO subjects (subject_name, subject_description) VALUES (?, ?)");
    $stmt->execute([$subjectName, $subjectDescription]);

    ob_end_clean();
    sendSuccess('Subject added successfully.', [
        'subject_id' => $pdo->lastInsertId(),
        'subject_name' => $subjectName
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to add subject. Please try again.');
}
?>