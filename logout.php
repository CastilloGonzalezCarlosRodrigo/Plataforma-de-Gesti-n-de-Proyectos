<?php
session_start(); // Iniciar la sesión

// Destruir todas las variables de sesión
$_SESSION = array();

// Si se desea destruir la sesión completamente, borrar también la cookie de sesión
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Finalmente, destruir la sesión
session_destroy();

// Enviar una respuesta JSON indicando que el cierre de sesión fue exitoso
echo json_encode(["success" => true]);
exit;
?>