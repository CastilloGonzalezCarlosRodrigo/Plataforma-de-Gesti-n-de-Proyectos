document.addEventListener("DOMContentLoaded", function () {
    fetch("php/datos_graficas.php") // Ahora usa el nuevo archivo
        .then(response => response.json())
        .then(data => {
            if (data) {
                generarGraficaEmpresas(data);
            } else {
                console.error("No hay datos disponibles");
            }
        })
        .catch(error => console.error("Error al obtener datos: ", error));
});

function generarGraficaEmpresas(datos) {
    const ctx = document.getElementById("graficaEmpresas").getContext("2d");

    if (!ctx) {
        console.error("No se encontró el canvas");
        return;
    }

    new Chart(ctx, {
        type: "bar", // Tipo de gráfica
        data: {
            labels: Object.keys(datos), // Empresas
            datasets: [{
                label: "Solicitudes por Empresa",
                data: Object.values(datos), // Cantidad de solicitudes
                backgroundColor: ["#33FF57"], // Colores llamativos
                borderColor: ["#28A745"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,  // 👈 Hace que solo muestre enteros
                        precision: 0  // 👈 Asegura que no haya decimales
                    }
                }
            }
        }
    });
}


// Función para volver a la página principal
function volverInicio() {
    window.location.href = "index.html"; // Cambia esto si el nombre de tu página principal es otro
}
