<?php
// ============================================
// PDF Result Report Generator
// Uses Dompdf to create quiz result PDFs
// ============================================

// Check if Dompdf is available via Composer
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

/**
 * Generate a PDF result report for a quiz attempt
 * Returns the file path of the generated PDF
 */
function generateResultPDF($attemptData)
{
    // Create reports directory if it doesn't exist
    $reportsDir = __DIR__ . '/../reports/';
    if (!file_exists($reportsDir)) {
        mkdir($reportsDir, 0777, true);
    }

    $fileName = 'result_' . $attemptData['attempt_id'] . '_' . time() . '.pdf';
    $filePath = $reportsDir . $fileName;

    // Build HTML content for PDF
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0D6EFD; padding-bottom: 20px; }
            .header h1 { color: #0B1F3A; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .info-table td { padding: 10px 15px; border: 1px solid #dee2e6; font-size: 14px; }
            .info-table td:first-child { background-color: #f8f9fa; font-weight: bold; width: 40%; color: #0B1F3A; }
            .score-box { text-align: center; background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
            .score-box .score { font-size: 48px; font-weight: bold; color: #0D6EFD; }
            .score-box .label { font-size: 16px; color: #666; }
            .pass { color: #198754; }
            .fail { color: #DC3545; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #999; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Online Quiz System</h1>
            <p>Quiz Result Report</p>
        </div>
        
        <h2 style="text-align: center; color: #198754; margin-bottom: 20px;">Congratulations, ' . htmlspecialchars($attemptData['student_name']) . '!</h2>
        
        <table class="info-table">
            <tr><td>Student Name</td><td>' . htmlspecialchars($attemptData['student_name']) . '</td></tr>
            <tr><td>Student Email</td><td>' . htmlspecialchars($attemptData['university_email']) . '</td></tr>
            <tr><td>Quiz Title</td><td>' . htmlspecialchars($attemptData['quiz_title']) . '</td></tr>
            <tr><td>Subject</td><td>' . htmlspecialchars($attemptData['subject_name']) . '</td></tr>';

    if (!empty($attemptData['teacher_name'])) {
        $html .= '<tr><td>Teacher</td><td>' . htmlspecialchars($attemptData['teacher_name']) . '</td></tr>';
    }

    $html .= '
            <tr><td>Date</td><td>' . date('F j, Y \a\t g:i A', strtotime($attemptData['submitted_at'])) . '</td></tr>
        </table>
        
        <div class="score-box">
            <div class="label">Your Score</div>
            <div class="score ' . ($attemptData['percentage'] >= 50 ? 'pass' : 'fail') . '">' . $attemptData['percentage'] . '%</div>
            <div class="label">' . $attemptData['correct_answers'] . ' correct out of ' . $attemptData['total_questions'] . ' questions</div>
        </div>
        
        <table class="info-table">
            <tr><td>Total Questions</td><td>' . $attemptData['total_questions'] . '</td></tr>
            <tr><td>Correct Answers</td><td style="color: #198754; font-weight: bold;">' . $attemptData['correct_answers'] . '</td></tr>
            <tr><td>Wrong Answers</td><td style="color: #DC3545; font-weight: bold;">' . $attemptData['wrong_answers'] . '</td></tr>
            <tr><td>Score</td><td>' . $attemptData['score'] . '/' . $attemptData['total_questions'] . '</td></tr>
            <tr><td>Percentage</td><td>' . $attemptData['percentage'] . '%</td></tr>
            <tr><td>Result</td><td class="' . ($attemptData['percentage'] >= 50 ? 'pass' : 'fail') . '" style="font-weight: bold;">' . ($attemptData['percentage'] >= 50 ? 'PASSED' : 'FAILED') . '</td></tr>
        </table>
        
        <div class="footer">
            <p>This is an automatically generated report by Online Quiz System</p>
            <p>Generated on ' . date('F j, Y \a\t g:i A') . '</p>
        </div>
    </body>
    </html>';

    // Try to use Dompdf if available
    if (class_exists('Dompdf\Dompdf')) {
        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        file_put_contents($filePath, $dompdf->output());
    } else {
        // Fallback: save HTML as file that can be printed to PDF
        $filePath = str_replace('.pdf', '.html', $filePath);
        file_put_contents($filePath, $html);
    }

    // Return the relative path for the frontend to use
    $relativePath = 'backend/reports/' . basename($filePath);
    return $relativePath;
}
?>