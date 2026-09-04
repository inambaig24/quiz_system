<?php
// ============================================
// Database Configuration and Connection
// Online Quiz System
// ============================================

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'quiz_system');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Create PDO database connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

    // PDO options for secure and efficient database operations
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    // Return error as JSON without exposing database details
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please try again later.'
    ]);
    exit;
}
?>