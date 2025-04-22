<?php
include 'config.php';

// Consulta para contar las solicitudes por estado
$sql = "SELECT estado, COUNT(*) as cantidad FROM solicitudes GROUP BY estado";
$result = $conn->query($sql);

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[$row['estado']] = $row['cantidad'];
}

echo json_encode($data);
?>
