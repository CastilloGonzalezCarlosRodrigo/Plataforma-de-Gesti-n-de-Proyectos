<?php
header('Content-Type: application/json');

// Configuración de la base de datos (usa los mismos valores que en actualizar_prioridades.php)
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "proyecto_formularios";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($mysqli->connect_error) {
    die(json_encode(['error' => 'Error de conexión: '.$mysqli->connect_error]));
}

// Consulta para obtener todas las solicitudes
$query = "SELECT * FROM solicitudes";
$result = $mysqli->query($query);

if (!$result) {
    die(json_encode(['error' => 'Error en consulta: '.$mysqli->error]));
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$mysqli->close();