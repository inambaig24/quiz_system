<?php
// ============================================
// Validation Helper Functions
// Handles email, password, and input validation
// ============================================

/**
 * Validate teacher email format
 * Must end with @iqra.edu.pk
 */
function validateTeacherEmail($email)
{
    $pattern = '/^[a-zA-Z0-9._%+\-]+@iqra\.edu\.pk$/i';
    return preg_match($pattern, $email);
}

/**
 * Validate student university email format
 * Must follow: IU09-0322-9023@iqra.edu.pk
 */
function validateStudentEmail($email)
{
    $pattern = '/^IU\d{2}-\d{4}-\d{4}@iqra\.edu\.pk$/i';
    return preg_match($pattern, $email);
}

/**
 * Validate admin email format
 */
function validateAdminEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password strength
 * Minimum 6 characters
 */
function validatePassword($password)
{
    return strlen($password) >= 6;
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput($input)
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate required fields
 * Returns array of missing field names
 */
function validateRequired($data, $fields)
{
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}

/**
 * Validate quiz code format
 * Must match: IQZ-XXXXX
 */
function validateQuizCode($code)
{
    $pattern = '/^IQZ-\d{5}$/';
    return preg_match($pattern, $code);
}

/**
 * Validate difficulty level
 */
function validateDifficulty($difficulty)
{
    $valid = ['Easy', 'Medium', 'Hard'];
    return in_array($difficulty, $valid);
}

/**
 * Validate correct option selection
 */
function validateCorrectOption($option)
{
    $valid = ['A', 'B', 'C', 'D'];
    return in_array(strtoupper($option), $valid);
}
?>