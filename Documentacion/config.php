<?php
$servername = "localhost"; 
$username = "root";
$password = ""; 
$database = "proyecto_formularios";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Obtener datos de la base de datos
$sql = "SELECT folio, solicitante, email, fecha, centroCostos, empresa, proyecto, tipoDiseno, material, archivo, estado, 
        COALESCE(prioridad, 'media') AS prioridad FROM solicitudes ORDER BY 
        CASE 
            WHEN prioridad = 'alta' THEN 1
            WHEN prioridad = 'media' THEN 2
            WHEN prioridad = 'baja' THEN 3
            ELSE 4
        END, fecha DESC";

$result = $conn->query($sql);

$datos = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Asegurarse de que todas las solicitudes tengan una prioridad
        if (!isset($row['prioridad']) || empty($row['prioridad'])) {
            $row['prioridad'] = 'media'; // Valor por defecto
        }
        $datos[] = $row;
    }
}

// Enviar los datos en formato JSON
header("Content-Type: application/json");
echo json_encode($datos);

// Cerrar la conexión
$conn->close();
?>