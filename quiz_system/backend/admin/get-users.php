<?php
// ============================================
// Get Users Endpoint
// GET: Admin fetches all teachers and students
// ============================================

ob_start();
error_reporting(0);

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/session.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ob_end_clean();
    sendError('Method not allowed', 405);
}

try {
    requireRole('admin');

    $role   = isset($_GET['role'])   ? $_GET['role']   : 'all';
    $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : null;
    $status = isset($_GET['status']) ? $_GET['status'] : null;

    $teachers = [];
    $students  = [];

    if ($role === 'all' || $role === 'teacher') {
        $sql    = "SELECT teacher_id as id, name, email, status, created_at, 'teacher' as role FROM teachers WHERE 1=1";
        $params = [];
        if ($search) { $sql .= " AND (name LIKE ? OR email LIKE ?)"; $params[] = $search; $params[] = $search; }
        if ($status) { $sql .= " AND status = ?"; $params[] = $status; }
        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $teachers = $stmt->fetchAll();
    }

    if ($role === 'all' || $role === 'student') {
        $sql    = "SELECT student_id as id, name, university_email as email, status, created_at, 'student' as role FROM students WHERE 1=1";
        $params = [];
        if ($search) { $sql .= " AND (name LIKE ? OR university_email LIKE ?)"; $params[] = $search; $params[] = $search; }
        if ($status) { $sql .= " AND status = ?"; $params[] = $status; }
        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();
    }

    ob_end_clean();
    sendSuccess('Users retrieved successfully.', [
        'teachers'       => $teachers,
        'students'       => $students,
        'total_teachers' => count($teachers),
        'total_students' => count($students)
    ]);

} catch (Exception $e) {
    ob_end_clean();
    sendError('Failed to retrieve users. Please try again.');
}
?>