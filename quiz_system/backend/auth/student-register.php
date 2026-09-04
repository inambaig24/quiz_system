<?php
// ============================================
// Student Registration Endpoint
// POST: Registers a new student account
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

    // Validate student university email format (IU09-0322-9023@iqra.edu.pk)
    if (!validateStudentEmail($email)) {
        ob_end_clean();
        sendError('Email must follow the Iqra University format (e.g., IU09-0322-9023@iqra.edu.pk).');
    }

    // Validate password strength
    if (!validatePassword($password)) {
        ob_end_clean();
        sendError('Password must be at least 6 characters long.');
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT student_id FROM students WHERE university_email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        ob_end_clean();
        sendError('An account with this email already exists.');
    }

    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new student into database
    $stmt = $pdo->prepare("INSERT INTO students (name, university_email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword]);

    // Get the new student ID
    $studentId = $pdo->lastInsertId();

    // Set session for auto-login after registration
    setUserSession($studentId, $name, $email, 'student');

    // Send success response
    ob_end_clean();
    sendSuccess('Registration successful! Welcome to the Online Quiz System.', [
        'student_id' => $studentId,
        'name' => $name,
        'email' => $email,
        'role' => 'student'
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Registration failed: ' . $e->getMessage());
}
?>