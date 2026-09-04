<?php
// ============================================
// JSON Response Helper Functions
// Standardizes all API responses
// ============================================

/**
 * Send a success JSON response
 */
function sendSuccess($message, $data = null, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');

    $response = [
        'success' => true,
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response);
    exit;
}

/**
 * Send an error JSON response
 */
function sendError($message, $statusCode = 400)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');

    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

/**
 * Send a validation error response with field details
 */
function sendValidationError($message, $errors = [])
{
    http_response_code(422);
    header('Content-Type: application/json');

    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors' => $errors
    ]);
    exit;
}

/**
 * Set CORS headers for API endpoints
 */
function setCorsHeaders()
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Get JSON request body as associative array
 */
function getRequestBody()
{
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        // Try form data if JSON parsing fails
        $data = $_POST;
    }

    return $data ?: [];
}
?>