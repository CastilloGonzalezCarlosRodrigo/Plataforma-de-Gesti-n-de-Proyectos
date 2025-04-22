<?php
header('Content-Type: application/json');

$servername = "localhost"; 
$username = "root";  
$password = ""; 
$database = "proyecto_formularios";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => "Conexión fallida"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$id = $data['id'] ?? null;
$estado = $data['estado'] ?? '';

if (!$id || empty($estado)) {
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

$stmt = $conn->prepare("UPDATE solicitudes SET estado = ? WHERE id = ?");
$stmt->bind_param("si", $estado, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Actualizado correctamente',
            'affected_rows' => $stmt->affected_rows
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'No se realizaron cambios (¿el estado ya era el mismo?)'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>