<?php
// ============================================
// Admin Login Endpoint
// POST: Authenticates an admin user
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

    $stmt = $pdo->prepare("SELECT admin_id, name, email, password FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    if (!password_verify($password, $admin['password'])) {
        ob_end_clean();
        sendError('Invalid email or password.');
    }

    setUserSession($admin['admin_id'], $admin['name'], $admin['email'], 'admin');

    ob_end_clean();
    sendSuccess('Admin login successful!', [
        'admin_id' => $admin['admin_id'],
        'name'     => $admin['name'],
        'email'    => $admin['email'],
        'role'     => 'admin'
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Login failed. Please try again.');
}
?>