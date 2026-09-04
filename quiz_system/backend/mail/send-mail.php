<?php
// ============================================
// Email Sender using PHPMailer
// Sends emails with optional PDF attachments
// ============================================

// SMTP Configuration - Update these with your actual credentials
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('SMTP_FROM_NAME', 'Online Quiz System');
define('SMTP_FROM_EMAIL', 'your-email@gmail.com');

// Check if PHPMailer is available
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

/**
 * Send email using PHPMailer
 * Returns true on success, false on failure
 */
function sendMail($toEmail, $subject, $body, $attachmentPath = null)
{
    // Check if PHPMailer class is available
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        error_log("PHPMailer not installed. Run 'composer install' in the backend directory.");
        return false;
    }

    try {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        // SMTP server settings
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;

        // Sender and recipient
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->addAddress($toEmail);

        // Email content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

        // Attach PDF if provided
        if ($attachmentPath && file_exists($attachmentPath)) {
            $mail->addAttachment($attachmentPath, 'Quiz_Result_Report.pdf');
        }

        // Send the email or mock it if default credentials
        if (SMTP_PASSWORD === 'your-app-password') {
            error_log("Mock Email Sent to $toEmail. Subject: $subject");
            return true;
        }

        $mail->send();
        return true;

    } catch (\PHPMailer\PHPMailer\Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        return false;
    }
}
?>