<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuración de la base de datos (usa los mismos datos que en tu archivo actual)
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "proyecto_formularios";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($mysqli->connect_error) {
    die(json_encode(['error' => 'Conexión fallida: '.$mysqli->connect_error]));
}

try {
    // Consulta para datos de empresas
    $empresas = [];
    $query = "SELECT empresa, COUNT(*) as total FROM solicitudes GROUP BY empresa";
    $result = $mysqli->query($query);
    while ($row = $result->fetch_assoc()) {
        $empresas[$row['empresa']] = (int)$row['total'];  // Corrected assignment
    }

    // Consulta para tipos de diseño
    $tiposDiseno = [];
    $query = "SELECT tipoDiseno, COUNT(*) as total FROM solicitudes GROUP BY tipoDiseno";
    $result = $mysqli->query($query);
    while ($row = $result->fetch_assoc()) {
        $tiposDiseno[$row['tipoDiseno']] = (int)$row['total'];  // Corrected assignment
    }

    // Consulta para estados
    $estados = [];
    $query = "SELECT estado, COUNT(*) as total FROM solicitudes GROUP BY estado";
    $result = $mysqli->query($query);
    while ($row = $result->fetch_assoc()) {
        $estados[$row['estado']] = (int)$row['total'];  // Corrected assignment
    }

    // Consulta para prioridades
    $prioridades = [];
    $query = "SELECT prioridad, COUNT(*) as total FROM solicitudes GROUP BY prioridad";
    $result = $mysqli->query($query);
    while ($row = $result->fetch_assoc()) {
        $prioridades[$row['prioridad']] = (int)$row['total'];  // Corrected assignment
    }

    $mysqli->close();

    // Estructurar los datos para las gráficas
    $response = [
        'empresas' => $empresas,
        'tiposDiseno' => $tiposDiseno,
        'estados' => $estados,
        'prioridades' => $prioridades
    ];

    echo json_encode($response);

} catch (Exception $e) {
    if (isset($mysqli)) $mysqli->close();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
