/**
 * Online Quiz System - API Helper
 * Reusable fetch wrappers for API calls with unified error handling and session management.
 */

const API_BASE_URL = 'backend';

/**
 * Helper to get the correct path to the backend directory from the current page
 */
function getBackendUrl(endpoint) {
    // If the endpoint already starts with http or backend, return it
    if (endpoint.startsWith('http') || endpoint.startsWith('backend/')) {
        return endpoint;
    }
    // Clean leading slash
    if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1);
    }
    return `${API_BASE_URL}/${endpoint}`;
}

/**
 * Handle API responses globally
 */
async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = { success: false, message: await response.text() };
    }

    if (!response.ok) {
        // Redirect to login if unauthenticated (401)
        if (response.status === 401) {
            // Determine user role to redirect to correct login page
            const currentPath = window.location.pathname;
            if (!currentPath.includes('login.html') && !currentPath.includes('register.html') && currentPath !== '/' && !currentPath.endsWith('index.html')) {
                // Clear any stored user state
                localStorage.removeItem('user');
                alert('Session expired. Please log in again.');
                
                if (currentPath.includes('teacher')) {
                    window.location.href = 'teacher-login.html';
                } else if (currentPath.includes('admin')) {
                    window.location.href = 'admin-login.html';
                } else {
                    window.location.href = 'student-login.html';
                }
            }
        }
        
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

/**
 * GET request wrapper
 */
async function apiGet(endpoint) {
    try {
        const response = await fetch(getBackendUrl(endpoint), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`API GET [${endpoint}] failed:`, error);
        throw error;
    }
}

/**
 * POST request wrapper
 */
async function apiPost(endpoint, data = {}) {
    try {
        const response = await fetch(getBackendUrl(endpoint), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`API POST [${endpoint}] failed:`, error);
        throw error;
    }
}

/**
 * Show basic alert messages dynamically (success, warning, error)
 */
function showToast(message, type = 'success') {
    // Find or create toast container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-warning';
    const textClass = type === 'warning' ? 'text-dark' : 'text-white';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} ${textClass} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-600">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    setTimeout(() => {
        if (toastElement) {
            toastElement.classList.remove('show');
            setTimeout(() => toastElement.remove(), 500);
        }
    }, 4000);
}
