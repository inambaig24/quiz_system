/**
 * Online Quiz System - Main/Global JS
 * Handles page guards, header injection, logouts, and general navigation helpers.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Determine user role and page guards
    await runPageGuard();

    // Populate user profile info in navbar/sidebar if elements exist
    populateUserProfile();

    // Initialize logout listeners
    initLogoutListeners();
});

/**
 * Checks session status and redirects user if not authorized for current page
 */
async function runPageGuard() {
    const path = window.location.pathname;
    
    // Auth & Landing pages do not need guard checks
    const isAuthPage = path.includes('login.html') || path.includes('register.html') || path === '/' || path.endsWith('index.html');
    
    let session = null;
    try {
        const response = await apiGet('auth/session-status.php');
        if (response.success) {
            session = response.data;
        }
    } catch (e) {
        console.error('Failed to retrieve session status:', e);
    }

    if (isAuthPage) {
        // If user is already logged in, redirect them to their respective dashboard
        if (session && session.logged_in) {
            redirectToDashboard(session.user_role);
        }
        return;
    }

    // If not logged in, redirect to index
    if (!session || !session.logged_in) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
        return;
    }

    // Cache user state in localStorage
    localStorage.setItem('user', JSON.stringify({
        id: session.user_id,
        name: session.user_name,
        email: session.user_email,
        role: session.user_role
    }));

    // Enforce role-based access control based on URL path/file name
    const isTeacherPage = path.includes('teacher');
    const isStudentPage = path.includes('student') || path.includes('attempt-quiz.html') || path.includes('result.html') || path.includes('subject-selection.html') || path.includes('difficulty-selection.html') || path.includes('join-quiz.html');
    const isAdminPage = path.includes('admin');

    if (isTeacherPage && session.user_role !== 'teacher') {
        redirectToDashboard(session.user_role);
    } else if (isStudentPage && session.user_role !== 'student') {
        redirectToDashboard(session.user_role);
    } else if (isAdminPage && session.user_role !== 'admin') {
        redirectToDashboard(session.user_role);
    }
}

/**
 * Redirects user to their role-specific dashboard
 */
function redirectToDashboard(role) {
    if (role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
    } else if (role === 'student') {
        window.location.href = 'student-dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'index.html';
    }
}

/**
 * Fills out user name and email on dashboard/nav headers
 */
function populateUserProfile() {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) return;

    try {
        const user = JSON.parse(cachedUser);
        
        const userNameElements = document.querySelectorAll('.user-name-display');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });

        const userEmailElements = document.querySelectorAll('.user-email-display');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });

        const userRoleElements = document.querySelectorAll('.user-role-display');
        userRoleElements.forEach(el => {
            el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        });
    } catch (e) {
        console.error('Error parsing user profile from localStorage:', e);
    }
}

/**
 * Binds click handler to logout buttons
 */
function initLogoutListeners() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                try {
                    const response = await apiPost('auth/logout.php');
                    if (response.success) {
                        localStorage.removeItem('user');
                        window.location.href = 'index.html';
                    } else {
                        showToast(response.message || 'Logout failed.', 'danger');
                    }
                } catch (error) {
                    showToast('Network error during logout.', 'danger');
                }
            }
        });
    });
}

/**
 * Helper to get query parameter from URL
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Toggles password visibility
 */
function togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    let icon = null;
    if (btnElement) {
        // If btnElement is the button, find the i tag. If it's the i tag itself, use it.
        icon = btnElement.tagName.toLowerCase() === 'i' ? btnElement : btnElement.querySelector('i');
    }
    
    const currentType = input.getAttribute('type') || input.type;
    
    if (currentType === 'password') {
        input.setAttribute('type', 'text');
        if (icon) {
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    } else {
        input.setAttribute('type', 'password');
        if (icon) {
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    }
}
