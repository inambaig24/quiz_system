/**
 * Online Quiz System - Form Validation Helper
 */

/**
 * Validate teacher email: Must end with @iqra.edu.pk
 */
function validateTeacherEmail(email) {
    const regex = /^[a-zA-Z0-9._%+\\-]+@iqra\.edu\.pk$/i;
    return regex.test(email);
}

/**
 * Validate student email: Must follow Iqra student format, e.g., IU09-0322-9023@iqra.edu.pk
 */
function validateStudentEmail(email) {
    const regex = /^[a-zA-Z]{2}\d{2}-\d{4}-\d{4}@iqra\.edu\.pk$/i;
    return regex.test(email);
}

/**
 * Validate general email format
 */
function validateGeneralEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate password: Must be at least 6 characters
 */
function validatePassword(password) {
    return password && password.length >= 6;
}

/**
 * Clear all validation errors in a form
 */
function clearFormValidation(formElement) {
    const inputs = formElement.querySelectorAll('.is-invalid, .is-valid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });

    const feedbacks = formElement.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(feedback => {
        feedback.remove();
    });
}

/**
 * Set validation state for a form input
 */
function setInputValidity(inputElement, isValid, errorMessage = '') {
    // Clear previous feedback
    inputElement.classList.remove('is-invalid', 'is-valid');
    
    // Find or handle parent node for group inputs (like input-group)
    const parent = inputElement.parentElement;
    let feedback = parent.querySelector('.invalid-feedback');
    if (feedback) feedback.remove();

    if (isValid) {
        inputElement.classList.add('is-valid');
    } else {
        inputElement.classList.add('is-invalid');
        if (errorMessage) {
            const feedbackHTML = `<div class="invalid-feedback fw-600">${errorMessage}</div>`;
            if (parent.classList.contains('input-group')) {
                parent.insertAdjacentHTML('afterend', feedbackHTML);
            } else {
                inputElement.insertAdjacentHTML('afterend', feedbackHTML);
            }
        }
    }
}

/**
 * Initialize automatic Bootstrap validation styling for required inputs on typing
 */
function initLiveValidation(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                input.classList.remove('is-invalid');
            }
        });
    });
}
