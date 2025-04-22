<?php
session_start(); // Iniciar la sesión para asegurarnos de que los datos se almacenen correctamente

$correo = $_POST['correo'];
$contraseña = $_POST['contraseña'];

// Conexión a la base de datos
$conn = mysqli_connect("localhost", "root", "", "proyecto_formularios");

if (!$conn) {
    die("Conexión fallida: " . mysqli_connect_error());
}

// Consulta SQL para verificar si existe el usuario con el correo y la contraseña proporcionados
$consulta = "SELECT * FROM usuarios WHERE correo='$correo' AND contraseña='$contraseña'";
$resultado = mysqli_query($conn, $consulta);

if (mysqli_num_rows($resultado) > 0) {
    // Si existe el usuario, se obtiene la información y se guarda en la sesión
    $filas = mysqli_fetch_array($resultado);

    // Almacenar los datos del usuario en la sesión
    $_SESSION['id_usuario'] = $filas['id'];
    $_SESSION['nombre'] = $filas['nombre'];  // Guardamos el nombre del usuario
    $_SESSION['empresa'] = $filas['empresa']; // Guardamos la empresa del usuario
    $_SESSION['correo'] = $correo; // Guardamos el correo

    // Redirigimos a la página principal
    header("Location: principal.html");
    exit;
} else {
    // Si no se encuentra el usuario
    echo "<script>alert('Correo o Contraseña Incorrectos');</script>";
    header("Location: index.html");
    exit;
}

mysqli_free_result($resultado);
mysqli_close($conn);
?>
