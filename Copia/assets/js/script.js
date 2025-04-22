document.addEventListener("DOMContentLoaded", function () {

    // Notificación
    function mostrarNotificacion(mensaje, tipo = "info") {
        const notificacion = document.createElement("div");
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;

        const notificaciones = document.getElementById("notificaciones");
        notificaciones.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add("mostrar");
        }, 100);

        setTimeout(() => {
            notificacion.classList.remove("mostrar");
            setTimeout(() => {
                notificacion.remove();
            }, 300);
        }, 4500);
    }

    // Mensaje de bienvenida
    mostrarNotificacion("Bienvenido a la Plataforma de Gestión de Auditorías", "info");

    // Obtén referencias a los enlaces del menú
    const tablaLink = document.getElementById("tabla-link");
    const graficaLink = document.getElementById("grafica-link");
    const calendarioLink = document.getElementById("calendario-link");
    const ayudaLink = document.getElementById("ayuda-link");
    const logoutLink = document.getElementById("logout-link");

    // Obtén referencias a las secciones de contenido
    const tablaSection = document.getElementById("tabla");
    const graficaSection = document.getElementById("grafica");
    const calendarioSection = document.getElementById("calendario");
    const ayudaSection = document.getElementById("ayuda");

    // Variables para almacenar las instancias de las gráficas
    let chartEmpresas = null;
    let chartTipoDiseno = null;
    let chartEstado = null;

    // Variable global para almacenar los datos de la tabla
    let dataGlobal = null;

    // Función para ocultar todas las secciones
    function hideAllSections() {
        tablaSection.style.display = "none";
        graficaSection.style.display = "none";
        calendarioSection.style.display = "none";
        ayudaSection.style.display = "none";
    }

    // Muestra la tabla por defecto
    hideAllSections();
    tablaSection.style.display = "block";

    // Evento para mostrar la tabla
    tablaLink.addEventListener("click", function (e) {
        e.preventDefault();
        hideAllSections();
        tablaSection.style.display = "block";
    });

    // Evento para mostrar la gráfica
    graficaLink.addEventListener("click", function (e) {
        e.preventDefault();
        hideAllSections();
        graficaSection.style.display = "block";
        cargarGrafica(); // Llama a la función para cargar las gráficas
    });

    // Evento para mostrar el calendario
    calendarioLink.addEventListener("click", function (e) {
        e.preventDefault();
        hideAllSections();
        calendarioSection.style.display = "block";
        renderCalendar(dataGlobal); // Llama a la función para renderizar el calendario con los datos de la tabla
    });

    // Evento para mostrar la sección de Documentación y Ayuda
    ayudaLink.addEventListener("click", function (e) {
        e.preventDefault();
        hideAllSections();
        ayudaSection.style.display = "block";
    });

    // Evento para cerrar sesión
    logoutLink.addEventListener("click", function (e) {
        e.preventDefault(); // Evita que el enlace recargue la página

        // Enviar solicitud al servidor para destruir la sesión
        fetch("logout.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "action=logout"
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Elimina el token de sesión o las credenciales del usuario
                localStorage.removeItem("token"); // Si usas localStorage
                sessionStorage.removeItem("token"); // Si usas sessionStorage

                // Mostrar notificación de cierre de sesión
                mostrarNotificacion("Sesión cerrada correctamente", "success");

                // Redirigir al usuario a la página de login y reemplazar el historial
                window.location.replace("index.html");
            } else {
                mostrarNotificacion("Error al cerrar sesión", "error");
            }
        })
        .catch(error => {
            console.error("Error al cerrar sesión:", error);
            mostrarNotificacion("Error al cerrar sesión", "error");
        });
    });

    // Función para cargar y renderizar las gráficas
    function cargarGrafica() {
        fetch("php/datos_graficas.php")
            .then(response => response.json())
            .then(data => {
                if (data) {
                    generarGraficaEmpresas(data.empresas); // Gráfica de solicitudes por empresa
                    generarGraficaTipoDiseno(data.tiposDiseno); // Gráfica de solicitudes por tipo de diseño
                    generarGraficaEstado(data.estados); // Gráfica de solicitudes por estado
                } else {
                    console.error("No hay datos disponibles");
                }
            })
            .catch(error => console.error("Error al obtener datos: ", error));
    }

    // Función para generar la gráfica de solicitudes por empresa
    function generarGraficaEmpresas(datos) {
        const ctx = document.getElementById("graficaEmpresas");

        if (!ctx) {
            console.error("No se encontró el canvas para la gráfica de empresas");
            return;
        }

        // Destruir la gráfica existente si hay una
        if (chartEmpresas) {
            chartEmpresas.destroy();
            chartEmpresas = null;
        }

        chartEmpresas = new Chart(ctx.getContext("2d"), {
            type: "line",
            data: {
                labels: Object.keys(datos),
                datasets: [{
                    label: "Solicitudes por Empresa",
                    data: Object.values(datos),
                    backgroundColor: "rgba(51, 255, 87, 0.2)",
                    borderColor: "#28A745",
                    borderWidth: 2,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    // Función para generar la gráfica de solicitudes por tipo de diseño
    function generarGraficaTipoDiseno(datos) {
        const ctx = document.getElementById("graficaTipoDiseno");

        if (!ctx) {
            console.error("No se encontró el canvas para la gráfica de tipos de diseño");
            return;
        }

        // Destruir la gráfica existente si hay una
        if (chartTipoDiseno) {
            chartTipoDiseno.destroy();
            chartTipoDiseno = null;
        }

        chartTipoDiseno = new Chart(ctx.getContext("2d"), {
            type: "line",
            data: {
                labels: Object.keys(datos),
                datasets: [{
                    label: "Solicitudes por Tipo de Diseño",
                    data: Object.values(datos),
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "#FF6384",
                    borderWidth: 2,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    // Función para generar la gráfica de solicitudes por estado
    function generarGraficaEstado(datos) {
        const ctx = document.getElementById("graficaEstado");

        if (!ctx) {
            console.error("No se encontró el canvas para la gráfica de estados");
            return;
        }

        // Destruir la gráfica existente si hay una
        if (chartEstado) {
            chartEstado.destroy();
            chartEstado = null;
        }

        chartEstado = new Chart(ctx.getContext("2d"), {
            type: "pie",
            data: {
                labels: Object.keys(datos),
                datasets: [{
                    label: "Solicitudes por Estado",
                    data: Object.values(datos),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                }]
            },
        });
    }

    // Función para mostrar la ventana modal
    function mostrarModal(evento) {
        const modal = document.getElementById("modal-calendario");
        const titulo = document.getElementById("modal-titulo");
        const solicitante = document.getElementById("modal-solicitante");
        const email = document.getElementById("modal-email");
        const fecha = document.getElementById("modal-fecha");
        const centroCostos = document.getElementById("modal-centro-costos");
        const empresa = document.getElementById("modal-empresa");
        const proyecto = document.getElementById("modal-proyecto");
        const tipoDiseno = document.getElementById("modal-tipo-diseno");
        const material = document.getElementById("modal-material");
        const estado = document.getElementById("modal-estado");

        // Llenar la ventana modal con los datos del evento
        titulo.textContent = evento.title || "N/A";
        solicitante.textContent = evento.extendedProps.solicitante || "N/A";
        email.textContent = evento.extendedProps.email || "N/A";
        fecha.textContent = evento.extendedProps.fecha || "N/A";
        centroCostos.textContent = evento.extendedProps.centroCostos || "N/A";
        empresa.textContent = evento.extendedProps.empresa || "N/A";
        proyecto.textContent = evento.extendedProps.proyecto || "N/A";
        tipoDiseno.textContent = evento.extendedProps.tipoDiseno || "N/A";
        material.textContent = evento.extendedProps.material || "N/A";
        estado.textContent = evento.extendedProps.estado || "N/A";

        // Mostrar la ventana modal
        modal.classList.add("mostrar");

        // Cerrar la ventana modal al hacer clic en la "X"
        document.querySelector(".cerrar-modal").addEventListener("click", function () {
            modal.classList.remove("mostrar");
        });

        // Cerrar la ventana modal al hacer clic fuera de ella
        modal.addEventListener("click", function (e) {
            if (e.target === modal) {
                modal.classList.remove("mostrar");
            }
        });
    }

    // Función para renderizar el calendario
    function renderCalendar(data) {
        console.log("Datos para el calendario:", data); // Verifica que los datos lleguen correctamente

        const calendarEl = document.getElementById("calendar");

        if (!calendarEl) {
            console.error("No se encontró el elemento del calendario");
            return;
        }

        // Formatear los datos para FullCalendar
        const eventos = data.map(fila => {
            // Definir el color del evento según el estado
            const colorEvento = fila.estado === "Revisado" ? "#28A745" : "#FF5252"; // Verde para "Revisado", rojo para "No revisado"

            return {
                title: `Solicitud de ${fila.solicitante}`, // Título del evento
                start: fila.fecha, // Fecha de la solicitud (ya está en formato YYYY-MM-DD)
                color: colorEvento, // Asignar el color según el estado
                extendedProps: {
                    solicitante: fila.solicitante,
                    email: fila.email,
                    fecha: fila.fecha,
                    centroCostos: fila.centroCostos,
                    empresa: fila.empresa,
                    proyecto: fila.proyecto,
                    tipoDiseno: fila.tipoDiseno,
                    material: fila.material,
                    estado: fila.estado,
                },
            };
        });

        console.log("Eventos formateados:", eventos); // Verifica que los eventos estén correctamente formateados

        // Crear el calendario
        const miCalendario = new FullCalendar.Calendar(calendarEl, {
            initialView: "dayGridMonth", // Vista inicial
            locale: "es", // Idioma español
            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            },
            events: eventos, // Usar los eventos formateados
            eventClick: function (info) {
                // Mostrar la ventana modal con los detalles del evento
                mostrarModal(info.event);
            },
        });

        // Renderizar el calendario
        miCalendario.render();
    }

    // Cargar los datos de la tabla
    fetch("config.php")
        .then(response => response.json())
        .then(data => {
            dataGlobal = data; // Almacenar los datos en la variable global
            console.log("Datos cargados:", dataGlobal); // Verifica que los datos se carguen correctamente

            let tabla = document.getElementById("tablaSolicitudes").getElementsByTagName("tbody")[0];

            // Función para renderizar las filas de la tabla
            function renderTableRows(data) {
                tabla.innerHTML = ""; // Limpiar la tabla antes de renderizar
                data.forEach(fila => {
                    let row = tabla.insertRow();
                    row.insertCell(0).textContent = fila.solicitante;
                    row.insertCell(1).textContent = fila.email;
                    row.insertCell(2).textContent = fila.fecha;
                    row.insertCell(3).textContent = fila.centroCostos;
                    row.insertCell(4).textContent = fila.empresa;
                    row.insertCell(5).textContent = fila.proyecto;
                    row.insertCell(6).textContent = fila.tipoDiseno;
                    row.insertCell(7).textContent = fila.material;

                    // Celda para el archivo adjunto
                    let archivoCell = row.insertCell(8);
                    if (fila.archivo) {
                        let archivoRuta = fila.archivo;
                        if (!archivoRuta.startsWith("../Formulario2/")) {
                            archivoRuta = "../Formulario2/" + archivoRuta;
                        }

                        let link = document.createElement("a");
                        link.href = archivoRuta;
                        link.target = "_blank";
                        link.textContent = "Ver archivo";
                        archivoCell.appendChild(link);
                    } else {
                        archivoCell.textContent = "No adjunto";
                    }

                    // Celda para el estado de revisión
                    let estadoCell = row.insertCell(9);
                    let btnEstado = document.createElement("button");
                    btnEstado.textContent = fila.estado === "Revisado" ? "Revisado" : "No revisado";
                    btnEstado.style.backgroundColor = fila.estado === "Revisado" ? "green" : "#FF5252";
                    btnEstado.style.color = "white";
                    btnEstado.style.border = "none";
                    btnEstado.style.padding = "5px 10px";
                    btnEstado.style.cursor = "pointer";
                    btnEstado.style.borderRadius = "5px";
                    btnEstado.style.marginLeft = "10px";

                    // Efecto hover
                    btnEstado.addEventListener("mouseover", function () {
                        btnEstado.style.opacity = "0.8";
                    });
                    btnEstado.addEventListener("mouseout", function () {
                        btnEstado.style.opacity = "1";
                    });

                    // Evento para cambiar estado
                    btnEstado.addEventListener("click", function () {
                        let nuevoEstado = btnEstado.textContent === "No revisado" ? "Revisado" : "No revisado";
                        btnEstado.textContent = nuevoEstado;
                        btnEstado.style.backgroundColor = nuevoEstado === "Revisado" ? "green" : "red";

                        // Enviar solicitud AJAX para actualizar el estado en la base de datos
                        fetch("actualizar_estado.php", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: `solicitante=${encodeURIComponent(fila.solicitante)}&estado=${encodeURIComponent(nuevoEstado)}`
                        })
                            .then(response => response.text())
                            .then(data => {
                                console.log(data); // Mostrar respuesta del servidor
                            })
                            .catch(error => console.error("Error al actualizar el estado:", error));
                    });

                    estadoCell.appendChild(btnEstado);
                });
            }

            // Renderizar la tabla con todos los datos inicialmente
            renderTableRows(dataGlobal);

            // Renderizar el calendario con los datos de la tabla
            renderCalendar(dataGlobal);

            // Función para filtrar la tabla
            document.getElementById("search-all").addEventListener("input", function () {
                const searchTerm = this.value.toLowerCase(); // Obtener el término de búsqueda

                // Filtrar los datos
                const filteredData = dataGlobal.filter(fila => {
                    return (
                        fila.solicitante.toLowerCase().includes(searchTerm) || // Buscar por solicitante
                        fila.email.toLowerCase().includes(searchTerm) || // Buscar por email
                        fila.empresa.toLowerCase().includes(searchTerm) // Buscar por empresa
                    );
                });

                // Renderizar la tabla con los datos filtrados
                renderTableRows(filteredData);
            });
        })
        .catch(error => console.error("Error al cargar los datos:", error));
});

// Función para volver a la página principal
function volverInicio() {
    window.location.href = "index.html"; // Cambia esto si el nombre de tu página principal es otro
}