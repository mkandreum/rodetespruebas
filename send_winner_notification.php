<?php
// send_winner_notification.php
header('Content-Type: application/json');
require_once __DIR__ . '/send_email.php';

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener datos
$input = json_decode(file_get_contents('php://input'), true);

$winnerName = $input['winnerName'] ?? '';
$winnerEmail = $input['winnerEmail'] ?? '';
$eventName = $input['eventName'] ?? 'Rodetes Party';

if (empty($winnerName) || empty($winnerEmail)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos del ganador (nombre o email).']);
    exit;
}

// Cargar estado de la app para obtener logo
$appStateFile = getDataFile('datos_app.json');
$appLogoUrl = '';
if (file_exists($appStateFile)) {
    $appState = json_decode(file_get_contents($appStateFile), true);
    if ($appState && isset($appState['appLogoUrl'])) {
        $appLogoUrl = $appState['appLogoUrl'];
    }
}

// Generar HTML
$htmlBody = generateWinnerEmailHTML($winnerName, $eventName, $appLogoUrl);

// Enviar correo
$subject = "👑 ¡FELICIDADES! ¡HAS GANADO EN RODETES PARTY! 👑";
$result = sendEmail($winnerEmail, $subject, $htmlBody);

if ($result['success']) {
    echo json_encode(['success' => true, 'message' => 'Notificación enviada al ganador.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $result['message']]);
}
?>
