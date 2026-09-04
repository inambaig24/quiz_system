<?php
// ============================================
// Session Management Helper
// Handles login state and role-based access
// ============================================

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if user is logged in
 */
function isLoggedIn()
{
    return isset($_SESSION['user_id']) && isset($_SESSION['user_role']);
}

/**
 * Get current user role
 */
function getUserRole()
{
    return $_SESSION['user_role'] ?? null;
}

/**
 * Get current user ID
 */
function getUserId()
{
    return $_SESSION['user_id'] ?? null;
}

/**
 * Get current user name
 */
function getUserName()
{
    return $_SESSION['user_name'] ?? null;
}

/**
 * Get current user email
 */
function getUserEmail()
{
    return $_SESSION['user_email'] ?? null;
}

/**
 * Set session data after successful login
 */
function setUserSession($id, $name, $email, $role)
{
    $_SESSION['user_id'] = $id;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_role'] = $role;
    $_SESSION['login_time'] = time();
}

/**
 * Destroy user session on logout
 */
function destroyUserSession()
{
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}

/**
 * Require specific role to access endpoint
 * Returns error if user is not logged in or has wrong role
 */
function requireRole($requiredRole)
{
    require_once __DIR__ . '/response.php';

    if (!isLoggedIn()) {
        sendError('You must be logged in to access this resource.', 401);
    }

    if (getUserRole() !== $requiredRole) {
        sendError('You do not have permission to access this resource.', 403);
    }
}

/**
 * Require any authenticated user
 */
function requireLogin()
{
    require_once __DIR__ . '/response.php';

    if (!isLoggedIn()) {
        sendError('You must be logged in to access this resource.', 401);
    }
}

/**
 * Check user session status and return info
 */
function getSessionInfo()
{
    if (!isLoggedIn()) {
        return ['logged_in' => false];
    }

    return [
        'logged_in' => true,
        'user_id' => getUserId(),
        'user_name' => getUserName(),
        'user_email' => getUserEmail(),
        'user_role' => getUserRole()
    ];
}
?>