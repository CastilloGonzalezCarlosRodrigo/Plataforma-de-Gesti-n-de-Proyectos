<?php
include 'config.php';

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row["id"] . "</td>";
        echo "<td>" . $row["solicitante"] . "</td>";
        echo "<td>" . $row["email"] . "</td>";
        echo "<td>" . $row["fecha"] . "</td>";
        echo "<td>" . $row["centroCostos"] . "</td>";
        echo "<td>" . $row["empresa"] . "</td>";
        echo "<td>" . $row["proyecto"] . "</td>";
        echo "<td>" . $row["tipoDiseno"] . "</td>";
        echo "<td>" . $row["material"] . "</td>";
        echo "<td>" . $row["folio"] . "</td>";
        echo "<td>";

        if (!empty($row["archivo"]) && file_exists($row["archivo"])) {
            echo "<a href='" . $row["archivo"] . "' target='_blank'>Ver archivo</a>";
        } else {
            echo "No adjunto";
        }
        
        echo "</td>";
        echo "</tr>";
    }
} else {
    echo "<tr><td colspan='10'>No hay solicitudes registradas</td></tr>";
}
?>
