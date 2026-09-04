<?php
// ============================================
// Logout Endpoint
// POST: Destroys user session and logs out
// ============================================

ob_start();
error_reporting(0);

require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

try {
    destroyUserSession();
    ob_end_clean();
    sendSuccess('You have been logged out successfully.');
} catch (Exception $e) {
    ob_end_clean();
    sendSuccess('You have been logged out successfully.');
}
?>