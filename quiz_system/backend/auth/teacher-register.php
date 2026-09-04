<?php
// ============================================
// Teacher Registration Endpoint
// POST: Registers a new teacher account
// ============================================

// Buffer all output to prevent stray whitespace/errors corrupting JSON
ob_start();

// Suppress PHP notices/warnings from appearing in response body
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/validate.php';
require_once '../helpers/session.php';

// Set response headers
setCorsHeaders();
header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    // Get request data
    $data = getRequestBody();

    // Validate required fields
    $missing = validateRequired($data, ['name', 'email', 'password']);
    if (!empty($missing)) {
        ob_end_clean();
        sendValidationError('Please fill in all required fields.', $missing);
    }

    // Sanitize inputs
    $name = sanitizeInput($data['name']);
    $email = sanitizeInput($data['email']);
    $password = $data['password'];

    // Validate teacher email format (must end with @iqra.edu.pk)
    if (!validateTeacherEmail($email)) {
        ob_end_clean();
        sendError('Email must be a valid Iqra University email (e.g., name@iqra.edu.pk).');
    }

    // Validate password strength
    if (!validatePassword($password)) {
        ob_end_clean();
        sendError('Password must be at least 6 characters long.');
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT teacher_id FROM teachers WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        ob_end_clean();
        sendError('An account with this email already exists.');
    }

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new teacher into database
    $stmt = $pdo->prepare("INSERT INTO teachers (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword]);

    // Get the new teacher ID
    $teacherId = $pdo->lastInsertId();

    // Set session for auto-login after registration
    setUserSession($teacherId, $name, $email, 'teacher');

    // Send success response
    ob_end_clean();
    sendSuccess('Registration successful! Welcome to the Online Quiz System.', [
        'teacher_id' => $teacherId,
        'name' => $name,
        'email' => $email,
        'role' => 'teacher'
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Registration failed: ' . $e->getMessage());
}
?>