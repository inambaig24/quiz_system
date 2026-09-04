<?php
// ============================================
// Student Login Endpoint
// POST: Authenticates a student
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

    if (!validateStudentEmail($email)) {
        ob_end_clean();
        sendError('Email must follow the Iqra University format (e.g., IU09-0322-9023@iqra.edu.pk).');
    }

    $stmt = $pdo->prepare("SELECT student_id, name, university_email, password, status FROM students WHERE university_email = ?");
    $stmt->execute([$email]);
    $student = $stmt->fetch();

    if (!$student) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    if ($student['status'] === 'blocked') {
        ob_end_clean();
        sendError('Your account has been blocked. Please contact the administrator.');
    }

    if (!password_verify($password, $student['password'])) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    setUserSession($student['student_id'], $student['name'], $student['university_email'], 'student');

    ob_end_clean();
    sendSuccess('Login successful!', [
        'student_id' => $student['student_id'],
        'name'       => $student['name'],
        'email'      => $student['university_email'],
        'role'       => 'student'
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Login failed. Please try again.');
}
?>