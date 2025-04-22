<?php
// Establecer encabezados estrictos
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
ob_start();

// Configuración
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "proyecto_formularios";

// Respuesta estructurada
$response = [
    'status' => 'error',
    'message' => 'Error desconocido',
    'data' => [
        'updates_received' => 0,
        'updates_processed' => 0,
        'details' => []
    ],
    'debug' => [
        'php_version' => phpversion(),
        'server_time' => date('Y-m-d H:i:s'),
        'input_data' => file_get_contents('php://input')
    ]
];

try {
    // Validar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    // Conexión a BD con manejo de errores mejorado
    $mysqli = @new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($mysqli->connect_errno) {
        throw new Exception("Error de conexión MySQL #{$mysqli->connect_errno}: {$mysqli->connect_error}", 500);
    }

    // Decodificar JSON de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Error en JSON: " . json_last_error_msg(), 400);
    }

    if (empty($input['updates']) || !is_array($input['updates'])) {
        throw new Exception("Formato inválido: se esperaba array 'updates'", 400);
    }

    $response['data']['updates_received'] = count($input['updates']);

    // Consulta preparada con manejo detallado de errores
    $query = "UPDATE solicitudes SET prioridad = ?, duracion = ? WHERE id = ?";
    if (!($stmt = $mysqli->prepare($query))) {
        throw new Exception("Error al preparar consulta: " . $mysqli->error, 500);
    }

    foreach ($input['updates'] as $index => $update) {
        $detail = [
            'update_index' => $index,
            'received_data' => $update,
            'processed' => false,
            'error' => null,
            'affected_rows' => 0
        ];

        try {
            // Validación estricta
            if (empty($update['id']) || !is_numeric($update['id'])) {
                throw new Exception("ID inválido o faltante");
            }

            $id = (int)$update['id'];
            $prioridad = in_array(strtolower($update['prioridad'] ?? ''), ['alta', 'media', 'baja']) 
                        ? strtolower($update['prioridad']) 
                        : 'media';
            $duracion = max(1, min(365, (int)($update['duracion'] ?? 5)));

            // Verificar si el ID existe
            $check = $mysqli->query("SELECT 1 FROM solicitudes WHERE id = $id LIMIT 1");
            if (!$check) {
                throw new Exception("Error al verificar ID: " . $mysqli->error);
            }

            if ($check->num_rows === 0) {
                // Devuelve un mensaje más descriptivo
                $response['data']['details'][] = [
                    'update_index' => $index,
                    'received_data' => $update,
                    'processed' => false,
                    'error' => "ID $id no existe en la BD (IDs comienzan desde 52)",
                    'suggestion' => "Use IDs existentes a partir de 52"
                ];
                continue; // Saltar al siguiente registro
            }

            // Ejecutar actualización
            $stmt->bind_param("sii", $prioridad, $duracion, $id);
            if (!$stmt->execute()) {
                throw new Exception("Error al ejecutar: " . $stmt->error);
            }

            $detail['affected_rows'] = $stmt->affected_rows;
            $detail['processed'] = true;
            $response['data']['updates_processed'] += ($detail['affected_rows'] > 0) ? 1 : 0;

        } catch (Exception $e) {
            $detail['error'] = $e->getMessage();
        }

        $response['data']['details'][] = $detail;
    }

    $response['status'] = 'success';
    $response['message'] = "Proceso completado";

} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 ? $e->getCode() : 500);
    $response['message'] = $e->getMessage();
    $response['debug']['error_trace'] = $e->getTraceAsString();
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($mysqli)) $mysqli->close();
    
    // Limpiar buffer y enviar respuesta
    while (ob_get_level()) ob_end_clean();
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
?>