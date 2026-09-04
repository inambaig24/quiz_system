<?php
// ============================================
// Block User Endpoint
// POST: Admin blocks a teacher or student
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

    if (!isset($data['user_id']) || !isset($data['role'])) {
        ob_end_clean();
        sendError('User ID and role are required.');
    }

    $userId = (int) $data['user_id'];
    $role = $data['role'];

    if ($role === 'teacher') {
        $stmt = $pdo->prepare("UPDATE teachers SET status = 'blocked' WHERE teacher_id = ?");
        $stmt->execute([$userId]);
    } elseif ($role === 'student') {
        $stmt = $pdo->prepare("UPDATE students SET status = 'blocked' WHERE student_id = ?");
        $stmt->execute([$userId]);
    } else {
        ob_end_clean();
        sendError('Invalid role. Must be teacher or student.');
    }

    if ($stmt->rowCount() === 0) {
        ob_end_clean();
        sendError('User not found.');
    }

    ob_end_clean();
    sendSuccess('User has been blocked successfully.');

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to block user. Please try again.');
}
?>