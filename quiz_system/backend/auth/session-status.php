<?php
// ============================================
// Session Status Endpoint
// GET: Verifies if user is logged in and returns info
// ============================================

ob_start();
error_reporting(0);

require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    ob_end_clean();
    sendSuccess('Session status retrieved', getSessionInfo());
} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve session status.');
}
?>
