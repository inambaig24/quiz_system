<?php
// ============================================
// Quiz Code Generator
// Generates unique random quiz codes (IQZ-XXXXX)
// ============================================

require_once __DIR__ . '/../config/database.php';

/**
 * Generate a unique quiz code
 * Format: IQZ-XXXXX where X is a digit
 */
function generateQuizCode()
{
    global $pdo;

    $maxAttempts = 10;
    $attempt = 0;

    do {
        // Generate random 5-digit code
        $code = "IQZ-" . rand(10000, 99999);

        // Check if code already exists in database
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM quizzes WHERE quiz_code = ?");
        $stmt->execute([$code]);
        $exists = $stmt->fetchColumn() > 0;

        $attempt++;
    } while ($exists && $attempt < $maxAttempts);

    // If all attempts failed, use timestamp-based code
    if ($exists) {
        $code = "IQZ-" . substr(time(), -5);
    }

    return $code;
}
?>