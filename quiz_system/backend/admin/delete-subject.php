<?php
// ============================================
// Delete Subject Endpoint
// POST: Admin deletes a subject
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
    requireRole('admin');

    $data = getRequestBody();

    if (!isset($data['subject_id'])) {
        ob_end_clean();
        sendError('Subject ID is required.');
    }

    $subjectId = (int) $data['subject_id'];

    $stmt = $pdo->prepare("SELECT subject_id, subject_name FROM subjects WHERE subject_id = ?");
    $stmt->execute([$subjectId]);
    $subject = $stmt->fetch();

    if (!$subject) {
        ob_end_clean();
        sendError('Subject not found.');
    }

    $stmt = $pdo->prepare("DELETE FROM subjects WHERE subject_id = ?");
    $stmt->execute([$subjectId]);

    ob_end_clean();
    sendSuccess('Subject "' . $subject['subject_name'] . '" has been deleted.');

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to delete subject. Please try again.');
}
?>