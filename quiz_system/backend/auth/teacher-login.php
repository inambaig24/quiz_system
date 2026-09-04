<?php
// ============================================
// Teacher Login Endpoint
// POST: Authenticates a teacher
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
    $data = getRequestBody();

    $missing = validateRequired($data, ['email', 'password']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please enter your email and password.', $missing);
    }

    $email    = sanitizeInput($data['email']);
    $password = $data['password'];

    if (!validateTeacherEmail($email)) {
        ob_end_clean();
        sendError('Email must be a valid Iqra University email (e.g., name@iqra.edu.pk).');
    }

    $stmt = $pdo->prepare("SELECT teacher_id, name, email, password, status FROM teachers WHERE email = ?");
    $stmt->execute([$email]);
    $teacher = $stmt->fetch();

    if (!$teacher) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    if ($teacher['status'] === 'blocked') {
        ob_end_clean();
        sendError('Your account has been blocked. Please contact the administrator.');
    }

    if (!password_verify($password, $teacher['password'])) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    setUserSession($teacher['teacher_id'], $teacher['name'], $teacher['email'], 'teacher');

    ob_end_clean();
    sendSuccess('Login successful!', [
        'teacher_id' => $teacher['teacher_id'],
        'name'       => $teacher['name'],
        'email'      => $teacher['email'],
        'role'       => 'teacher'
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Login failed. Please try again.');
}
?>