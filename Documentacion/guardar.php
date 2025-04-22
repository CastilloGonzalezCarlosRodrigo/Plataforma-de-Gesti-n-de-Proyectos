<?php
include 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $solicitante = $_POST['solicitante'];
    $email = $_POST['email'];
    $fecha = $_POST['fecha'];
    $centroCostos = $_POST['centroCostos'];
    $empresa = $_POST['empresa'];
    $proyecto = $_POST['proyecto'];
    $tipoDiseno = $_POST['tipoDiseno'];
    $material = $_POST['material'];

    // Manejo de archivos
    $archivo_nombre = $_FILES['archivo_aprobacion']['name'];
    $archivo_tmp = $_FILES['archivo_aprobacion']['tmp_name'];
    $ruta_archivo = "../Formulario2/uploads/" . basename($archivo_nombre);
    move_uploaded_file($archivo_tmp, $ruta_archivo);

    // Insertar en la BD
    $sql = "INSERT INTO solicitudes (nombre_solicitante, correo, fecha_solicitud, centro_costos, empresa_area, nombre_proyecto, tipo_diseno, tipo_material, archivo_aprobacion, archivo) 
            VALUES ('$nombre', '$correo', '$fecha', '$centro_costos', '$empresa_area', '$nombre_proyecto', '$tipo_diseno', '$tipo_material', '$ruta_archivo', '$archivo')";

    if ($conn->query($sql) === TRUE) {
        echo "Solicitud guardada correctamente.";
    } else {
        echo "Error: " . $conn->error;
    }
}
?>
