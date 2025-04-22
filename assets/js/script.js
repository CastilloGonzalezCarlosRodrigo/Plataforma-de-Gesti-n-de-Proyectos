document.addEventListener("DOMContentLoaded", function () {
    // Configuración global para jsPDF
    window.jsPDF = window.jspdf?.jsPDF;

    // Elementos del DOM
    const elements = {
        sections: {
            tabla: document.getElementById("tabla"),
            grafica: document.getElementById("grafica"),
            calendario: document.getElementById("calendario"),
            ayuda: document.getElementById("ayuda"),
            gantt: document.getElementById("gantt"),
            status: document.getElementById("status")
        },
        links: {
            tabla: document.getElementById("tabla-link"),
            grafica: document.getElementById("grafica-link"),
            calendario: document.getElementById("calendario-link"),
            ayuda: document.getElementById("ayuda-link"),
            logout: document.getElementById("logout-link"),
            gantt: document.getElementById("gantt-link"),
            status: document.getElementById("status-link")
        },
        modal: {
            container: document.getElementById("modal-calendario"),
            confirmacion: {
                container: document.getElementById("modal-confirmacion"),
                mensaje: document.getElementById("modal-confirmacion-mensaje"),
                confirmar: document.getElementById("confirmar-cambio"),
                cancelar: document.getElementById("cancelar-cambio")
            },
            elements: {
                titulo: document.getElementById("modal-titulo"),
                solicitante: document.getElementById("modal-solicitante"),
                email: document.getElementById("modal-email"),
                fecha: document.getElementById("modal-fecha"),
                centroCostos: document.getElementById("modal-centro-costos"),
                empresa: document.getElementById("modal-empresa"),
                proyecto: document.getElementById("modal-proyecto"),
                tipoDiseno: document.getElementById("modal-tipo-diseno"),
                material: document.getElementById("modal-material"),
                estado: document.getElementById("modal-estado")
            }
        }
    };

    // Variables de estado
    const state = {
        charts: {
            empresas: null,
            tipoDiseno: null,
            estado: null,
            prioridades: null,
            empresasMini: null,
            tipoDisenoMini: null,
            estadoMini: null,
            prioridadesMini: null
        },
        data: null,
        ganttData: null,
        initialGanttData: null,
        calendar: null,
        empresasList: [] // Lista de empresas para filtros
    };

    // Verificar dependencias críticas al cargar
    if (typeof FullCalendar === 'undefined') {
        console.error("FullCalendar no está cargado");
        mostrarNotificacion("Error crítico: La librería de calendario no está disponible", "error");
    }

    // Configuración de eventos del modal
    document.querySelector(".cerrar-modal")?.addEventListener("click", () => {
        elements.modal.container.classList.remove("mostrar");
    });

    elements.modal.confirmacion.cancelar?.addEventListener("click", hideConfirmationModal);
    elements.modal.confirmacion.confirmar?.addEventListener("click", confirmStatusChange);
    elements.modal.confirmacion.container?.addEventListener("click", (e) => {
        if (e.target === elements.modal.confirmacion.container) {
            hideConfirmationModal();
        }
    });

    // Función para mostrar modal de confirmación
    function showConfirmationModal(request, newStatus, button) {
        state.currentRequest = request;
        state.newStatus = newStatus;
        state.statusButton = button;

        elements.modal.confirmacion.mensaje.textContent =
            `¿Estás seguro de que deseas cambiar el estado de la solicitud de ${request.solicitante || 'este usuario'} a "${newStatus}"?`;

        elements.modal.confirmacion.container.classList.add("mostrar");
    }

    // Función para ocultar modal de confirmación
    function hideConfirmationModal() {
        elements.modal.confirmacion.container.classList.remove("mostrar");
    }

    // Función para confirmar cambio de estado
    function confirmStatusChange() {
        // Cambiar el estado visualmente
        state.statusButton.textContent = state.newStatus;
        state.statusButton.style.backgroundColor = state.newStatus === "Revisado" ? "green" : "#FF5252";

        // Enviar la actualización al servidor
        updateStatusOnServer(state.currentRequest, state.newStatus);

        hideConfirmationModal();
    }

    // Función para actualizar estado en el servidor
    function updateStatusOnServer(request, status) {
        const btnOriginalText = state.statusButton.textContent;
        state.statusButton.disabled = true;
        state.statusButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';

        fetch("actualizar_estado.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: request.id,
                estado: status
            })
        })
            .then(async response => {
                const contentType = response.headers.get('content-type');
                if (!contentType?.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(text || 'Respuesta no JSON');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error(data.error || "Error al actualizar");
                }

                // Actualizar el estado en los datos locales
                const index = state.data.findIndex(item => item.id == request.id);
                if (index !== -1) {
                    state.data[index].estado = status;
                }

                mostrarNotificacion("Estado actualizado correctamente", "success");
            })
            .catch(error => {
                console.error("Error:", error);
                mostrarNotificacion(error.message || "Error al actualizar", "error");
                state.statusButton.textContent = btnOriginalText;
                state.statusButton.style.backgroundColor = btnOriginalText === "Revisado" ? "green" : "#FF5252";
            })
            .finally(() => {
                state.statusButton.disabled = false;
                state.statusButton.textContent = status;
                state.statusButton.style.backgroundColor = status === "Revisado" ? "green" : "#FF5252";
            });
    }

    // Notificación mejorada
    function mostrarNotificacion(mensaje, tipo = "info") {
        const notificacion = document.createElement("div");
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;

        const notificaciones = document.getElementById("notificaciones");
        if (notificaciones) {
            notificaciones.appendChild(notificacion);

            setTimeout(() => notificacion.classList.add("mostrar"), 100);
            setTimeout(() => {
                notificacion.classList.remove("mostrar");
                setTimeout(() => notificacion.remove(), 300);
            }, 4500);
        } else {
            console.warn("No se encontró el contenedor de notificaciones");
        }
    }

    // Función para cargar scripts con reintentos
    function loadScript(src, retries = 2, delay = 1000) {
        return new Promise((resolve, reject) => {
            const attempt = (remainingRetries) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve(script);
                script.onerror = () => {
                    if (remainingRetries > 0) {
                        setTimeout(() => attempt(remainingRetries - 1), delay);
                    } else {
                        reject(new Error(`Error al cargar el script: ${src}`));
                    }
                };
                document.head.appendChild(script);
            };
            attempt(retries);
        });
    }

    // Función para ocultar todas las secciones
    function hideAllSections() {
        Object.values(elements.sections).forEach(section => {
            if (section) section.style.display = "none";
        });
    }

    // Muestra la tabla por defecto
    hideAllSections();
    if (elements.sections.tabla) elements.sections.tabla.style.display = "block";

    // Manejadores de eventos para navegación
    function setupNavigation() {
        const setupLink = (link, section, callback) => {
            if (!link || !section) return;

            link.addEventListener("click", (e) => {
                e.preventDefault();
                hideAllSections();
                section.style.display = "block";
                if (callback) callback();
            });
        };

        setupLink(elements.links.tabla, elements.sections.tabla);
        setupLink(elements.links.grafica, elements.sections.grafica, cargarGraficas);
        setupLink(elements.links.calendario, elements.sections.calendario, () => {
            if (state.data) {
                renderCalendar(state.data);
            } else {
                mostrarNotificacion("Cargando datos para el calendario...", "info");
                cargarDatosIniciales();
            }
        });
        setupLink(elements.links.ayuda, elements.sections.ayuda);
        setupLink(elements.links.gantt, elements.sections.gantt, () => renderGantt(state.data));
        setupLink(elements.links.status, elements.sections.status, () => renderStatusTable(state.data));

        // Logout
        if (elements.links.logout) {
            elements.links.logout.addEventListener("click", (e) => {
                e.preventDefault();
                fetch("logout.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "action=logout"
                })
                    .then(response => {
                        if (!response.ok) throw new Error("Error en la respuesta del servidor");
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            localStorage.removeItem("token");
                            sessionStorage.removeItem("token");
                            mostrarNotificacion("Sesión cerrada correctamente", "success");
                            window.location.replace("index.html");
                        } else {
                            throw new Error(data.error || "Error al cerrar sesión");
                        }
                    })
                    .catch(error => {
                        console.error("Error al cerrar sesión:", error);
                        mostrarNotificacion(error.message || "Error al cerrar sesión", "error");
                    });
            });
        }
    }

    // Función para renderizar el calendario
    function renderCalendar(data) {
        const calendarEl = document.getElementById("calendar");
        if (!calendarEl) {
            console.error("No se encontró el elemento del calendario");
            return;
        }

        // Destruir calendario existente de manera segura
        if (state.calendar && typeof state.calendar.destroy === 'function') {
            try {
                state.calendar.destroy();
            } catch (error) {
                console.warn("Error al destruir el calendario existente:", error);
            }
        }

        // Verificar que FullCalendar está disponible
        if (typeof FullCalendar === 'undefined') {
            console.error("FullCalendar no está cargado correctamente");
            mostrarNotificacion("Error: La librería de calendario no está disponible", "error");
            return;
        }

        // Crear eventos para el calendario con valores por defecto
        const eventos = (data || []).map(fila => ({
            title: `Solicitud de ${fila.solicitante || 'Sin nombre'}`,
            start: fila.fecha || new Date(),
            color: fila.estado === "Revisado" ? "#28A745" : "#FF5252",
            extendedProps: {
                solicitante: fila.solicitante || 'No especificado',
                email: fila.email || 'No especificado',
                fecha: fila.fecha || 'No especificado',
                centroCostos: fila.centroCostos || 'No especificado',
                empresa: fila.empresa || 'No especificado',
                proyecto: fila.proyecto || 'No especificado',
                tipoDiseno: fila.tipoDiseno || 'No especificado',
                material: fila.material || 'No especificado',
                estado: fila.estado || 'No especificado',
                prioridad: fila.prioridad || 'media'
            },
        }));

        // Crear nueva instancia del calendario
        try {
            state.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: "dayGridMonth",
                locale: "es",
                headerToolbar: {
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                },
                events: eventos,
                eventClick: mostrarModal
            });

            state.calendar.render();
        } catch (error) {
            console.error("Error al renderizar el calendario:", error);
            mostrarNotificacion("Error al mostrar el calendario", "error");
        }
    }

    // Función para mostrar la ventana modal
    function mostrarModal(info) {
        const { elements: modalElements } = elements.modal;
        const evento = info.event;
        const props = evento.extendedProps || {};

        // Asignar valores con defaults
        if (modalElements.titulo) modalElements.titulo.textContent = evento.title || "N/A";
        if (modalElements.solicitante) modalElements.solicitante.textContent = props.solicitante || "N/A";
        if (modalElements.email) modalElements.email.textContent = props.email || "N/A";
        if (modalElements.fecha) modalElements.fecha.textContent = props.fecha || (evento.start ? evento.start.toLocaleString() : "N/A");
        if (modalElements.centroCostos) modalElements.centroCostos.textContent = props.centroCostos || "N/A";
        if (modalElements.empresa) modalElements.empresa.textContent = props.empresa || "N/A";
        if (modalElements.proyecto) modalElements.proyecto.textContent = props.proyecto || "N/A";
        if (modalElements.tipoDiseno) modalElements.tipoDiseno.textContent = props.tipoDiseno || "N/A";
        if (modalElements.material) modalElements.material.textContent = props.material || "N/A";
        if (modalElements.estado) modalElements.estado.textContent = props.estado || "N/A";

        if (elements.modal.container) {
            elements.modal.container.classList.add("mostrar");
        }
    }

    // Función para renderizar la tabla de status
    function renderStatusTable(data) {
        if (!data) return;

        const tableBody = document.querySelector("#tablaStatus tbody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        // Contadores para estadísticas
        let total = 0;
        let reviewed = 0;
        let pending = 0;
        let highPriority = 0;

        // Actualizar lista de empresas únicas
        state.empresasList = [...new Set(data.map(item => item.empresa || '').filter(Boolean))];
        updateEmpresasFilter();

        data.forEach(item => {
            total++;
            if (item.estado === "Revisado") reviewed++;
            else pending++;
            if (item.prioridad === "alta") highPriority++;

            const row = tableBody.insertRow();

            // Solicitante
            const cellSolicitante = row.insertCell();
            cellSolicitante.textContent = item.solicitante || 'N/A';

            // Proyecto
            const cellProyecto = row.insertCell();
            cellProyecto.textContent = item.proyecto || 'N/A';

            // Estado
            const cellEstado = row.insertCell();
            const estadoBadge = document.createElement("span");
            estadoBadge.className = `status-badge ${item.estado ? item.estado.toLowerCase().replace(" ", "-") : 'no-especificado'}`;
            estadoBadge.textContent = item.estado || 'No especificado';
            cellEstado.appendChild(estadoBadge);

            // Prioridad
            const cellPrioridad = row.insertCell();
            const prioridadBadge = document.createElement("span");
            const prioridad = item.prioridad && ['alta', 'media', 'baja'].includes(item.prioridad)
                ? item.prioridad
                : 'media';
            prioridadBadge.className = `priority-badge ${prioridad}`;
            prioridadBadge.textContent = prioridad;
            cellPrioridad.appendChild(prioridadBadge);

            // Fecha
            const cellFecha = row.insertCell();
            cellFecha.textContent = item.fecha || 'N/A';

            // Duración
            const cellDuracion = row.insertCell();
            cellDuracion.textContent = item.duracion || 5;

            // Empresa (oculta pero disponible para filtrar)
            const cellEmpresa = row.insertCell();
            cellEmpresa.style.display = "none";
            const empresaSpan = document.createElement("span");
            empresaSpan.className = "empresa-value";
            empresaSpan.textContent = item.empresa || '';
            cellEmpresa.appendChild(empresaSpan);

            // Acciones
            const cellAcciones = row.insertCell();

            const editBtn = document.createElement("button");
            editBtn.className = "action-btn edit";
            editBtn.innerHTML = '<ion-icon name="create-outline"></ion-icon> Editar';
            editBtn.addEventListener("click", () => editItem(item));

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "action-btn delete";
            deleteBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon> Eliminar';
            deleteBtn.addEventListener("click", () => deleteItem(item));

            cellAcciones.appendChild(editBtn);
            cellAcciones.appendChild(deleteBtn);
        });

        // Actualizar estadísticas
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateStat("total-count", total);
        updateStat("reviewed-count", reviewed);
        updateStat("pending-count", pending);
        updateStat("high-priority-count", highPriority);

        // Configurar filtros
        setupStatusFilters();
    }

    // Función para actualizar el filtro de empresas
    function updateEmpresasFilter() {
        const filterEmpresa = document.getElementById("filter-empresa");
        if (!filterEmpresa) return;

        // Guardar el valor seleccionado actual
        const currentValue = filterEmpresa.value;

        // Limpiar opciones excepto "Todas"
        filterEmpresa.innerHTML = '<option value="all">Todas</option>';

        // Añadir empresas únicas al filtro
        state.empresasList.forEach(empresa => {
            const option = document.createElement("option");
            option.value = empresa;
            option.textContent = empresa;
            filterEmpresa.appendChild(option);
        });

        // Restaurar la selección anterior si aún existe
        if (currentValue && state.empresasList.includes(currentValue)) {
            filterEmpresa.value = currentValue;
        }
    }

    function setupStatusFilters() {
        const filterStatus = document.getElementById("filter-status");
        const filterPriority = document.getElementById("filter-priority-status");
        const filterEmpresa = document.getElementById("filter-empresa");

        if (!filterStatus || !filterPriority || !filterEmpresa) return;

        function applyFilters() {
            const statusFilter = filterStatus.value;
            const priorityFilter = filterPriority.value;
            const empresaFilter = filterEmpresa.value;
            const rows = document.querySelectorAll("#tablaStatus tbody tr");

            // Resetear contadores
            let total = 0;
            let reviewed = 0;
            let pending = 0;
            let highPriority = 0;

            rows.forEach(row => {
                const status = row.cells[2].textContent;
                const priority = row.cells[3].textContent.toLowerCase();
                const empresa = row.querySelector(".empresa-value")?.textContent || "";

                const statusMatch = statusFilter === "all" || status === statusFilter;
                const priorityMatch = priorityFilter === "all" || priority === priorityFilter;
                const empresaMatch = empresaFilter === "all" || empresa === empresaFilter;

                if (statusMatch && priorityMatch && empresaMatch) {
                    row.style.display = "";
                    total++;
                    if (status === "Revisado") reviewed++;
                    else pending++;
                    if (priority === "alta") highPriority++;
                } else {
                    row.style.display = "none";
                }
            });

            // Actualizar estadísticas
            document.getElementById("total-count").textContent = total;
            document.getElementById("reviewed-count").textContent = reviewed;
            document.getElementById("pending-count").textContent = pending;
            document.getElementById("high-priority-count").textContent = highPriority;
        }

        filterStatus.addEventListener("change", applyFilters);
        filterPriority.addEventListener("change", applyFilters);
        filterEmpresa.addEventListener("change", applyFilters);
    }

    function editItem(item) {
        if (!item) return;
        mostrarNotificacion(`Editando solicitud de ${item.solicitante || 'usuario'}`, "info");
        // Aquí podrías implementar la lógica para editar un item
    }

    function deleteItem(item) {
        if (!item) return;

        if (confirm(`¿Estás seguro de que deseas eliminar la solicitud de ${item.solicitante || 'este usuario'}?`)) {
            mostrarNotificacion(`Eliminando solicitud...`, "info");

            fetch(`eliminar_solicitud.php?solicitante=${encodeURIComponent(item.solicitante || '')}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) throw new Error("Error en la respuesta del servidor");
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        mostrarNotificacion("Solicitud eliminada correctamente", "success");
                        cargarDatosIniciales();
                    } else {
                        throw new Error(data.error || "Error al eliminar la solicitud");
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    mostrarNotificacion(error.message || "Error al eliminar la solicitud", 'error');
                });
        }
    }

    // Función para renderizar las filas de la tabla
    function renderTableRows(data) {
        const tabla = document.getElementById("tablaSolicitudes")?.getElementsByTagName("tbody")[0];
        if (!tabla) return;

        tabla.innerHTML = "";

        (data || []).forEach(fila => {
            const row = tabla.insertRow();

            // Celdas de datos básicos
            const campos = ['folio', 'solicitante', 'email', 'fecha', 'centroCostos', 'empresa', 'proyecto', 'tipoDiseno'];
            campos.forEach((campo, index) => {
                const cell = row.insertCell(index);
                cell.textContent = fila[campo] || 'N/A';
            });

            // Celda para Material (debe contener el valor de estado)
            const materialCell = row.insertCell(8);
            materialCell.textContent = fila.material || 'No especificado';

            // Celda para el archivo adjunto
            const archivoCell = row.insertCell(9);
            if (fila.archivo) {
                const link = document.createElement("a");
                link.href = fila.archivo.startsWith("../Formulario2/") ? fila.archivo : `../Formulario2/${fila.archivo}`;
                link.target = "_blank";
                link.textContent = "Ver archivo";
                archivoCell.appendChild(link);
            } else {
                archivoCell.textContent = "No adjunto";
            }

            // Celda para el estado de revisión
            const estadoCell = row.insertCell(10);
            const btnEstado = document.createElement("button");
            btnEstado.textContent = fila.estado === "Revisado" ? "Revisado" : "No revisado";
            btnEstado.className = "status-btn";
            btnEstado.style.backgroundColor = fila.estado === "Revisado" ? "green" : "#FF5252";
            btnEstado.style.color = "white";
            btnEstado.dataset.id = fila.id;

            btnEstado.addEventListener("click", function () {
                const nuevoEstado = btnEstado.textContent === "No revisado" ? "Revisado" : "No revisado";
                showConfirmationModal(fila, nuevoEstado, btnEstado);
            });

            estadoCell.appendChild(btnEstado);
        });
    }

    // Función para recargar datos desde el servidor
    async function recargarDatosDesdeServidor() {
        try {
            const response = await fetch('obtener_solicitudes.php');

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            state.data = data;

            renderTableRows(state.data);
            renderStatusTable(state.data);

        } catch (error) {
            console.error("Error al recargar datos:", error);
            mostrarNotificacion("⚠️ Datos guardados, pero no se pudieron refrescar", 'warning');
        }
    }

    // Función para renderizar el diagrama de Gantt
    function renderGantt(data) {
        const validData = data.filter(item => item.id >= 52);
        const container = document.getElementById("gantt-container");
        if (!container) return;

        // Limpiar contenedor
        container.innerHTML = '';

        // Verificar si hay datos
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-data">No hay solicitudes para mostrar</p>';
            return;
        }

        // Almacenar datos iniciales para comparación
        state.initialGanttData = JSON.parse(JSON.stringify(data));

        // Configuración del timeline
        const today = new Date();
        const dateRange = 30;
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() - dateRange / 2);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + dateRange / 2);

        // Crear encabezado del timeline
        const header = document.createElement('div');
        header.className = 'gantt-header';
        header.innerHTML = `
            <div class="gantt-item-label">Solicitud</div>
            <div class="gantt-item-priority">Prioridad</div>
            <div class="gantt-item-time">Duración (días)</div>
            <div class="gantt-timeline-header">Timeline (${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()})</div>
        `;
        container.appendChild(header);

        // Crear marcadores de tiempo en el timeline
        const timelineMarkers = document.createElement('div');
        timelineMarkers.className = 'gantt-timeline-markers';
        timelineMarkers.style.height = '0';
        timelineMarkers.style.position = 'relative';

        // Agregar marcadores para cada semana
        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 7)) {
            const daysFromMin = Math.floor((d - minDate) / (1000 * 60 * 60 * 24));
            const positionPercentage = (daysFromMin / dateRange) * 100;

            const marker = document.createElement('div');
            marker.className = 'gantt-time-marker';
            marker.style.left = `${positionPercentage}%`;

            const label = document.createElement('div');
            label.className = 'gantt-time-label';
            label.textContent = d.toLocaleDateString('es', { month: 'short', day: 'numeric' });
            label.style.left = `${positionPercentage}%`;

            timelineMarkers.appendChild(marker);
            timelineMarkers.appendChild(label);
        }
        container.appendChild(timelineMarkers);

        // Crear elementos del Gantt para cada solicitud
        data.forEach((solicitud, index) => {
            const item = document.createElement('div');
            item.className = 'gantt-item';

            // Convertir fecha de string a objeto Date
            const fechaSolicitud = new Date(solicitud.fecha || today);

            // Asignar valores por defecto si no existen
            const prioridad = solicitud.prioridad && ['alta', 'media', 'baja'].includes(solicitud.prioridad)
                ? solicitud.prioridad
                : 'media';
            const duracion = solicitud.duracion || 5;

            // Calcular posición y ancho en el timeline
            const daysFromMin = Math.floor((fechaSolicitud - minDate) / (1000 * 60 * 60 * 24));
            let positionPercentage = (daysFromMin / dateRange) * 100;
            let widthPercentage = (duracion / dateRange) * 100;

            // Ajustar valores si están fuera del rango visible
            positionPercentage = Math.max(0, Math.min(100, positionPercentage));
            widthPercentage = Math.min(100 - positionPercentage, widthPercentage);

            item.innerHTML = `
                <div class="gantt-item-label" title="${solicitud.solicitante || 'Sin nombre'} - ${solicitud.proyecto || 'Sin proyecto'}">
                    ${solicitud.solicitante || 'Sin nombre'} - ${solicitud.proyecto ? solicitud.proyecto.substring(0, 20) + (solicitud.proyecto.length > 20 ? '...' : '') : 'Sin proyecto'}
                </div>
                <div class="gantt-item-priority">
                    <select class="priority-select" data-id="${solicitud.id}">
                        <option value="alta" ${prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                        <option value="media" ${prioridad === 'media' ? 'selected' : ''}>Media</option>
                        <option value="baja" ${prioridad === 'baja' ? 'selected' : ''}>Baja</option>
                    </select>
                </div>
                <div class="gantt-item-time">
                    <input type="number" class="time-input" data-id="${solicitud.id}" value="${duracion}" min="1" max="365">
                </div>
                <div class="gantt-item-bar-container">
                    <div class="gantt-item-bar priority-${prioridad}" 
                        style="left: ${positionPercentage}%; width: ${widthPercentage}%;"
                        data-id="${solicitud.id}">
                        <span class="gantt-item-date">${duracion}d</span>
                    </div>
                </div>
            `;

            container.appendChild(item);
        });

        // Configurar eventos para los elementos del Gantt
        setupGanttInteractions(data, minDate, maxDate);

        // Configurar filtro de prioridad
        const prioritySelects = container.querySelectorAll('.priority-select');
        prioritySelects.forEach(select => {
            select.addEventListener('change', function () {
                const id = this.getAttribute('data-id');
                const nuevaPrioridad = this.value;

                // Busca la solicitud correcta en state.data
                const solicitud = state.data.find(item => item.id == id);
                if (solicitud) {
                    solicitud.prioridad = nuevaPrioridad;
                    // Actualiza la barra visualmente
                    const bar = container.querySelector(`.gantt-item-bar[data-id="${id}"]`);
                    if (bar) bar.className = `gantt-item-bar priority-${nuevaPrioridad}`;
                }
            });
        });

        // Configurar cambio de escala de tiempo
        const timeScale = document.getElementById('time-scale');
        if (timeScale) {
            timeScale.addEventListener('change', function () {
                renderGantt(state.data);
            });
        }
    }

    function setupGanttInteractions(data, minDate, maxDate) {
        const container = document.getElementById("gantt-container");
        if (!container) return;

        // Configurar cambios en la duración
        container.querySelectorAll('.time-input').forEach(input => {
            input.addEventListener('change', function () {
                const id = parseInt(this.getAttribute('data-id'));
                let nuevaDuracion = parseInt(this.value) || 5;

                // Validar duración
                if (isNaN(nuevaDuracion)) {  // Se agregó paréntesis de cierre
                    nuevaDuracion = 5;
                    this.value = 5;
                } else if (nuevaDuracion < 1) {
                    nuevaDuracion = 1;
                    this.value = 1;
                } else if (nuevaDuracion > 365) {  // Corregí "nuevaDuracion" (estaba "nuevaDuracion")
                    nuevaDuracion = 365;
                    this.value = 365;
                }

                // Buscar la solicitud correcta en state.data
                const solicitud = state.data.find(item => item.id === id);

                if (solicitudIndex !== -1) {
                    // Actualizar datos en el estado
                    state.data[solicitudIndex].duracion = nuevaDuracion;

                    // Actualizar visualización
                    const bar = container.querySelector(`.gantt-item-bar[data-id="${id}"]`);
                    if (bar) {
                        const dateRange = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
                        const widthPercentage = (nuevaDuracion / dateRange) * 100;

                        // Asegurar que el ancho no exceda el espacio disponible
                        const currentLeft = parseFloat(bar.style.left) || 0;
                        const maxWidth = 100 - currentLeft;
                        bar.style.width = `${Math.min(widthPercentage, maxWidth)}%`;

                        const dateElement = bar.querySelector('.gantt-item-date');
                        if (dateElement) {
                            dateElement.textContent = `${nuevaDuracion}d`;
                        }
                    }

                    // Feedback visual
                    input.style.borderColor = '#4CAF50';
                    setTimeout(() => input.style.borderColor = '', 1000);
                    mostrarNotificacion(`Duración actualizada a ${nuevaDuracion} días (se guardará al actualizar)`, 'info');
                } else {
                    mostrarNotificacion('Error: No se encontró la solicitud', 'error');
                }
            });
        });

        // Configurar eventos de arrastre
        container.querySelectorAll('.gantt-item-bar').forEach(bar => {
            bar.addEventListener('mousedown', startDrag);
        });
    }

    function startDrag(e) {
        e.preventDefault();

        const bar = e.target.closest('.gantt-item-bar');
        if (!bar) return;

        const container = bar.closest('.gantt-item-bar-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const initialX = e.clientX;
        const initialLeft = parseFloat(bar.style.left) || 0;

        function dragMove(e) {
            const dx = e.clientX - initialX;
            const percentMoved = (dx / containerRect.width) * 100;
            let newLeft = initialLeft + percentMoved;

            // Limitar el movimiento dentro del contenedor
            const barWidth = parseFloat(bar.style.width) || 0;
            newLeft = Math.max(0, Math.min(100 - barWidth, newLeft));

            bar.style.left = `${newLeft}%`;
        }

        function dragEnd() {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
        }

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
    }

    // Función para actualizar prioridades y duraciones
    document.getElementById('actualizar-prioridades')?.addEventListener('click', async function () {
        if (!state.data?.length) {
            mostrarNotificacion('Error: No hay datos para actualizar', 'error');
            return;
        }

        const boton = this;
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...';
        boton.disabled = true;

        try {
            // Preparar datos usando los IDs reales
            const updates = state.data.map((item) => {
                const prioridadValidada = ['alta', 'media', 'baja'].includes(item.prioridad?.toLowerCase())
                    ? item.prioridad.toLowerCase()
                    : 'media';

                // Validar y formatear duración
                let duracionValidada = parseInt(item.duracion);
                if (isNaN(duracionValidada)) {
                    duracionValidada = 5;
                } else if (duracionValidada < 1) {
                    duracionValidada = 1;
                } else if (duracionValidada > 365) {
                    duracionValidada = 365;
                }
                return {
                    id: item.id,
                    prioridad: prioridadValidada,
                    duracion: duracionValidada
                };
            }); // Cierre correcto del map

            console.log('Enviando actualizaciones:', updates);

            const response = await fetch('actualizar_prioridades.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ updates })
            });

            // Manejar respuesta no JSON
            if (!response.headers.get('content-type')?.includes('application/json')) {
                const text = await response.text();
                console.error('Respuesta no JSON:', text);
                throw new Error(`El servidor respondió con formato inválido: ${text.substring(0, 100)}...`);
            }

            const result = await response.json();
            console.log('Respuesta completa:', result);

            if (!response.ok || result.status !== 'success') {
                const errorDetails = result.data?.details?.filter(d => d.error).map(d => d.error).join(', ') || 'Sin detalles';
                throw new Error(`${result.message || 'Error en el servidor'} (${errorDetails})`);
            }

            // Mostrar resumen detallado
            const successful = result.data.details.filter(d => d.processed && d.affected_rows > 0).length;
            const failed = result.data.details.filter(d => d.error).length;
            const unchanged = result.data.details.filter(d => d.processed && d.affected_rows === 0).length;

            let message = `Proceso completado: `;
            message += `${successful} actualizaciones (${successful} prioridades y ${successful} duraciones), `;
            message += `${unchanged} sin cambios, `;
            message += `${failed} errores`;

            mostrarNotificacion(message, failed > 0 ? (successful > 0 ? 'warning' : 'error') : 'success');

            // Mostrar detalles en consola
            if (failed > 0) {
                console.groupCollapsed('Detalles de errores');
                result.data.details.filter(d => d.error).forEach(d => {
                    console.error(`Índice ${d.update_index}:`, d.error, 'Datos:', d.received_data);
                });
                console.groupEnd();
            }

            // Recargar datos si hubo actualizaciones
            if (successful > 0) {
                setTimeout(recargarDatosDesdeServidor, 1000);
            }

        } catch (error) {
            console.error('Error en la actualización:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        } finally {
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
        }
    });
    // Función base para generar gráficas
    function generarGrafica(canvas, id, config) {
        if (!canvas) {
            console.error(`No se encontró el canvas para la gráfica ${id}`);
            mostrarNotificacion(`Error: No se pudo crear la gráfica ${id}`, "error");
            return null;
        }

        // Destruir gráfica existente si hay una
        if (state.charts[id] && typeof state.charts[id].destroy === 'function') {
            try {
                state.charts[id].destroy();
            } catch (error) {
                console.warn(`Error al destruir gráfica existente ${id}:`, error);
            }
        }

        // Verificar que Chart está disponible
        if (typeof Chart === 'undefined') {
            console.error("Chart.js no está cargado");
            mostrarNotificacion("Error: La librería de gráficas no está disponible", "error");
            return null;
        }

        try {
            // Crear nueva gráfica
            const ctx = canvas.getContext('2d');
            state.charts[id] = new Chart(ctx, config);
            return state.charts[id];
        } catch (error) {
            console.error(`Error al crear la gráfica ${id}:`, error);
            mostrarNotificacion(`Error al crear la gráfica ${id}`, "error");
            return null;
        }
    }

    // Función para cargar y renderizar las gráficas
    function cargarGraficas() {
        mostrarNotificacion("Cargando datos de gráficas...", "info");

        // Primero verificar si Chart.js está disponible
        if (typeof Chart === 'undefined') {
            const errorMsg = "Error: La librería Chart.js no está cargada";
            console.error(errorMsg);
            mostrarNotificacion(errorMsg, "error");
            return;
        }

        // Cargar dependencias necesarias
        Promise.all([
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
                .catch(() => loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js")),
            loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
                .catch(() => loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"))
        ])
            .then(() => {
                // Hacer la petición al servidor
                return fetch("php/datos_graficas.php", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                })
                    .then(response => {
                        // Verificar si la respuesta es exitosa (status 200-299)
                        if (!response.ok) {
                            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                        }

                        // Verificar el tipo de contenido
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            throw new Error("La respuesta no es JSON válido");
                        }

                        return response.json();
                    })
                    .then(data => {
                        // Validar que los datos recibidos tienen la estructura esperada
                        if (!data || typeof data !== 'object') {
                            throw new Error("No hay datos disponibles o formato incorrecto");
                        }

                        // Validar cada conjunto de datos para las gráficas
                        const requiredCharts = ['empresas', 'tiposDiseno', 'estados', 'prioridades'];
                        for (const chart of requiredCharts) {
                            if (!data[chart] || typeof data[chart] !== 'object') {
                                throw new Error(`Faltan datos para la gráfica: ${chart}`);
                            }
                        }

                        // Generar versiones mini para la vista general
                        generarGraficaEmpresas(document.getElementById("graficaEmpresasMini"), "empresasMini", data.empresas, true);
                        generarGraficaTipoDiseno(document.getElementById("graficaTipoDisenoMini"), "tipoDisenoMini", data.tiposDiseno, true);
                        generarGraficaEstado(document.getElementById("graficaEstadoMini"), "estadoMini", data.estados, true);
                        generarGraficaPrioridades(document.getElementById("graficaPrioridadesMini"), "prioridadesMini", data.prioridades, true);

                        // Generar versiones grandes para las pestañas individuales
                        generarGraficaEmpresas(document.getElementById("graficaEmpresas"), "empresas", data.empresas);
                        generarGraficaTipoDiseno(document.getElementById("graficaTipoDiseno"), "tipoDiseno", data.tiposDiseno);
                        generarGraficaEstado(document.getElementById("graficaEstado"), "estado", data.estados);
                        generarGraficaPrioridades(document.getElementById("graficaPrioridades"), "prioridades", data.prioridades);

                        // Configurar botones de exportación
                        setupExportButtons();
                        setupGraficasTabs();

                        mostrarNotificacion("Gráficas cargadas correctamente", "success");
                    });
            })
            .catch(error => {
                console.error("Error al cargar gráficas:", error);

                let mensajeError = "Error al cargar los datos de las gráficas";
                if (error.message.includes('Failed to fetch')) {
                    mensajeError = "Error de conexión con el servidor";
                } else if (error.message.includes('Error HTTP')) {
                    mensajeError = error.message;
                } else if (error.message) {
                    mensajeError += `: ${error.message}`;
                }

                mostrarNotificacion(mensajeError, "error");
            });
    }

    // Función para configurar los tabs de gráficas
    function setupGraficasTabs() {
        const tabs = document.querySelectorAll('.graficas-tabs .tab-btn');
        const tabContents = document.querySelectorAll('.graficas-content .tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todos los tabs y contenidos
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Agregar clase active al tab clickeado
                tab.classList.add('active');

                // Mostrar el contenido correspondiente
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
    }

    // Función para la gráfica de prioridades
    function generarGraficaPrioridades(canvas, id, datos, mini = false) {
        // Asegurar que tenemos valores para todas las prioridades
        const datosCompletos = {
            'alta': datos?.alta || 0,
            'media': datos?.media || 0,
            'baja': datos?.baja || 0
        };

        generarGrafica(canvas, id, {
            type: "doughnut",
            data: {
                labels: Object.keys(datosCompletos),
                datasets: [{
                    label: "Solicitudes por Prioridad",
                    data: Object.values(datosCompletos),
                    backgroundColor: [
                        "#FF5252",
                        "#FFC107",
                        "#4CAF50"
                    ],
                    borderColor: "#fff",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: !mini,
                        text: 'Distribución de Prioridades',
                        font: { size: 16 }
                    },
                    legend: {
                        position: mini ? 'bottom' : 'right',
                        display: !mini
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: mini ? '60%' : '70%'
            }
        });
    }

    function generarGraficaEmpresas(canvas, id, datos, mini = false) {
        if (!datos || typeof datos !== 'object') {
            console.error("Datos inválidos para gráfica de empresas");
            mostrarNotificacion("Error: Datos inválidos para gráfica de empresas", "error");
            return;
        }

        generarGrafica(canvas, id, {
            type: mini ? "pie" : "bar",
            data: {
                labels: Object.keys(datos),
                datasets: [{
                    label: "Solicitudes por Empresa",
                    data: Object.values(datos),
                    backgroundColor: mini ? [
                        "#138283",
                        "#ffc107",
                        "#265798",
                    ] : [
                        "rgba(19, 130, 131, 0.7)",
                        "rgba(255, 193, 7, 0.7)",
                        "rgba(38, 87, 152, 0.7)",
                    ],
                    borderColor: "rgba(0, 0, 0, 0.1)",
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: !mini,
                        text: 'Solicitudes por Empresa',
                        font: { size: 16 }
                    },
                    legend: {
                        display: mini,
                        position: 'bottom'
                    }
                },
                scales: mini ? {} : {
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

    function generarGraficaTipoDiseno(canvas, id, datos, mini = false) {
        if (!datos || typeof datos !== 'object') {
            console.error("Datos inválidos para gráfica de tipos de diseño");
            mostrarNotificacion("Error: Datos inválidos para gráfica de tipos de diseño", "error");
            return;
        }

        generarGrafica(canvas, id, {
            type: mini ? "bar" : "line",
            data: {
                labels: Object.keys(datos),
                datasets: [
                    {
                        label: "Solicitudes por Tipo de Diseño",
                        data: Object.values(datos),
                        backgroundColor: [
                            "rgba(255, 99, 132, 0.7)",
                            "rgba(54, 162, 235, 0.7)",
                            "rgba(255, 206, 86, 0.7)",
                            "rgba(75, 192, 192, 0.7)"
                        ],
                        borderColor: [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0"
                        ],
                        borderWidth: 2,
                        fill: !mini,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: !mini,
                        text: 'Solicitudes por Tipo de Diseño',
                        font: { size: 16 }
                    },
                    legend: {
                        display: mini,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                const tipoDiseño = tooltipItem.label;
                                return `Tipo de Diseño: ${tipoDiseño}, Solicitudes: ${tooltipItem.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0,
                            display: !mini
                        }
                    },
                    x: {
                        ticks: {
                            display: !mini
                        }
                    }
                }
            }
        });
    }

    function generarGraficaEstado(canvas, id, datos, mini = false) {
        if (!datos || typeof datos !== 'object') {
            console.error("Datos inválidos para gráfica de estados");
            mostrarNotificacion("Error: Datos inválidos para gráfica de estados", "error");
            return;
        }

        generarGrafica(canvas, id, {
            type: "pie",
            data: {
                labels: Object.keys(datos),
                datasets: [{
                    label: "Solicitudes por Estado",
                    data: Object.values(datos),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: !mini,
                        text: 'Solicitudes por Estado',
                        font: { size: 16 }
                    },
                    legend: {
                        position: mini ? 'bottom' : 'right',
                        display: !mini
                    }
                }
            }
        });
    }

    // Función para obtener los datos de las gráficas actualizadas
    function getChartData() {
        // Verificar si las gráficas están cargadas usando los IDs correctos
        const chartsLoaded = (
            state.charts.empresas ||
            state.charts.tipoDiseno ||
            state.charts.estado ||
            state.charts.prioridades ||
            state.charts.empresasMini ||
            state.charts.tipoDisenoMini ||
            state.charts.estadoMini ||
            state.charts.prioridadesMini
        );

        if (!chartsLoaded) {
            mostrarNotificacion("Por favor espera a que las gráficas terminen de cargar", "error");
            return null;
        }

        // Obtener datos de todas las gráficas (usamos las versiones grandes para exportar)
        return {
            empresas: getChartDataset(state.charts.empresas, "Solicitudes por Empresa"),
            tiposDiseno: getChartDataset(state.charts.tipoDiseno, "Solicitudes por Tipo de Diseño"),
            estados: getChartDataset(state.charts.estado, "Solicitudes por Estado"),
            prioridades: getChartDataset(state.charts.prioridades, "Solicitudes por Prioridad")
        };
    }

    // Función auxiliar para extraer datos de una gráfica
    function getChartDataset(chart, defaultLabel) {
        if (!chart || !chart.data) {
            console.warn(`Gràfica no disponible: ${defaultLabel}`);
            return { labels: [], datasets: [] };
        }

        return {
            labels: chart.data.labels || [],
            datasets: chart.data.datasets.map(dataset => ({
                label: dataset.label || defaultLabel,
                data: dataset.data || []
            }))
        };
    }

    // Función para exportar a CSV (actualizada)
    function exportToCSV() {
        // Mostrar loading
        const btnCSV = document.getElementById('exportar-csv');
        const originalText = btnCSV.innerHTML;
        btnCSV.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generando CSV...';

        setTimeout(() => {
            try {
                const data = getChartData();
                if (!data) {
                    btnCSV.innerHTML = originalText;
                    return;
                }

                let csvContent = "Datos de Gráficas\n\n";

                Object.entries(data).forEach(([chartName, chartData]) => {
                    if (chartData.labels.length === 0) return;

                    csvContent += `Gráfica: ${chartName}\n`;
                    csvContent += `Categoría,${chartData.datasets.map(d => d.label).join(",")}\n`;

                    chartData.labels.forEach((label, i) => {
                        const row = [label, ...chartData.datasets.map(dataset => dataset.data[i] || 0)];
                        csvContent += `${row.join(",")}\n`;
                    });

                    csvContent += "\n";
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `datos_graficas_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);

                mostrarNotificacion("Archivo CSV generado correctamente", "success");
            } catch (error) {
                console.error("Error al exportar a CSV:", error);
                mostrarNotificacion("Error al generar CSV: " + error.message, "error");
            } finally {
                btnCSV.innerHTML = originalText;
            }
        }, 100);
    }

    // Función para exportar a Excel (actualizada)
    function exportToExcel() {
        const btnExcel = document.getElementById('exportar-excel');
        const originalText = btnExcel.innerHTML;
        btnExcel.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generando Excel...';

        setTimeout(() => {
            try {
                const data = getChartData();
                if (!data) {
                    btnExcel.innerHTML = originalText;
                    return;
                }

                if (typeof XLSX === 'undefined') {
                    throw new Error("La librería SheetJS no está cargada");
                }

                const wb = XLSX.utils.book_new();

                Object.entries(data).forEach(([chartName, chartData]) => {
                    if (chartData.labels.length === 0) return;

                    const headers = ['Categoría', ...chartData.datasets.map(d => d.label)];
                    const rows = chartData.labels.map((label, i) => (
                        [label, ...chartData.datasets.map(dataset => dataset.data[i] || 0)]
                    ));

                    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                    XLSX.utils.book_append_sheet(wb, ws, chartName.slice(0, 31));
                });

                XLSX.writeFile(wb, `reporte_graficas_${new Date().toISOString().slice(0, 10)}.xlsx`);
                mostrarNotificacion("Archivo Excel generado correctamente", "success");
            } catch (error) {
                console.error("Error al exportar a Excel:", error);
                mostrarNotificacion("Error al generar Excel: " + error.message, "error");
            } finally {
                btnExcel.innerHTML = originalText;
            }
        }, 100);
    }

    // Función para exportar a PDF (actualizada)
    function exportToPDF() {
        const btnPDF = document.getElementById('exportar-pdf');
        const originalText = btnPDF.innerHTML;
        btnPDF.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generando PDF...';

        setTimeout(() => {
            try {
                const data = getChartData();
                if (!data) {
                    btnPDF.innerHTML = originalText;
                    return;
                }

                const jsPDF = window.jspdf?.jsPDF;
                if (!jsPDF) {
                    throw new Error("La librería jsPDF no está cargada");
                }

                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm'
                });

                let yPos = 15;
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 10;

                doc.setFontSize(16);
                doc.text('Reporte de Gráficas', pageWidth / 2, yPos, { align: 'center' });
                yPos += 10;

                Object.entries(data).forEach(([chartName, chartData], index) => {
                    if (chartData.labels.length === 0) return;

                    if (index > 0) {
                        doc.addPage();
                        yPos = 15;
                        doc.setFontSize(16);
                        doc.text('Reporte de Gráficas (continuación)', pageWidth / 2, yPos, { align: 'center' });
                        yPos += 10;
                    }

                    doc.setFontSize(12);
                    const title = chartName.charAt(0).toUpperCase() + chartName.slice(1).replace(/([A-Z])/g, ' $1');
                    doc.text(title, margin, yPos);
                    yPos += 8;

                    const headers = ['Categoría', ...chartData.datasets.map(d => d.label)];
                    const rows = chartData.labels.map((label, i) => (
                        [label, ...chartData.datasets.map(dataset => dataset.data[i] || 0)]
                    ));

                    doc.autoTable({
                        startY: yPos,
                        head: [headers],
                        body: rows,
                        margin: { left: margin, right: margin },
                        styles: {
                            fontSize: 8,
                            cellPadding: 2,
                            overflow: 'linebreak'
                        },
                        headStyles: {
                            fillColor: [5, 81, 79],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold'
                        },
                        alternateRowStyles: {
                            fillColor: [240, 240, 240]
                        }
                    });

                    yPos = doc.lastAutoTable.finalY + 5;
                });

                doc.save(`reporte_graficas_${new Date().toISOString().slice(0, 10)}.pdf`);
                mostrarNotificacion("Archivo PDF generado correctamente", "success");
            } catch (error) {
                console.error("Error al exportar a PDF:", error);
                mostrarNotificacion("Error al generar PDF: " + error.message, "error");
            } finally {
                btnPDF.innerHTML = originalText;
            }
        }, 100);
    }

    // Configurar botones de exportación (actualizada)
    function setupExportButtons() {
        const exportarCSV = document.getElementById('exportar-csv');
        const exportarExcel = document.getElementById('exportar-excel');
        const exportarPDF = document.getElementById('exportar-pdf');

        if (exportarCSV) {
            exportarCSV.addEventListener('click', exportToCSV);
            exportarCSV.style.cursor = 'pointer';
        }

        if (exportarExcel) {
            exportarExcel.addEventListener('click', exportToExcel);
            exportarExcel.style.cursor = 'pointer';
        }

        if (exportarPDF) {
            exportarPDF.addEventListener('click', exportToPDF);
            exportarPDF.style.cursor = 'pointer';
        }
    }

    // Función para cargar datos iniciales
    function cargarDatosIniciales() {
        mostrarNotificacion("Cargando datos iniciales...", "info");

        fetch("obtener_solicitudes.php")
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log("Datos recibidos del servidor:", data);
                if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
                if (data.length > 0) {
                    console.log("Rango de IDs recibidos:",
                        "Mínimo:", Math.min(...data.map(item => item.id)),
                        "Máximo:", Math.max(...data.map(item => item.id)));
                }

                // Procesar datos con valores por defecto
                state.data = data.map((item, index) => ({
                    folio: item.folio || '',
                    id: item.id || index + 1,
                    solicitante: item.solicitante || '',
                    email: item.email || '',
                    fecha: item.fecha || new Date().toISOString().split('T')[0],
                    centroCostos: item.centroCostos || '',
                    empresa: item.empresa || '',
                    proyecto: item.proyecto || '',
                    tipoDiseno: item.tipoDiseno || 'digital',
                    material: item.material || '',
                    archivo: item.archivo || '',
                    estado: item.estado || 'No revisado',
                    prioridad: item.prioridad || 'media',
                    duracion: item.duracion || 5
                }));

                renderTableRows(state.data);

                // Renderizar calendario solo si está visible
                if (elements.sections.calendario && elements.sections.calendario.style.display === "block") {
                    renderCalendar(state.data);
                }

                // Renderizar tabla de status si está visible
                if (elements.sections.status && elements.sections.status.style.display === "block") {
                    renderStatusTable(state.data);
                }

                // Configurar buscador
                const searchInput = document.getElementById("search-all");
                if (searchInput) {
                    searchInput.addEventListener("input", function () {
                        const searchTerm = this.value.toLowerCase();
                        const filteredData = state.data.filter(fila =>
                            (fila.solicitante && fila.solicitante.toLowerCase().includes(searchTerm)) ||
                            (fila.empresa && fila.empresa.toLowerCase().includes(searchTerm)) ||
                            (fila.folio && fila.folio.toLowerCase().includes(searchTerm))
                        );
                        renderTableRows(filteredData);

                        // Opcional: Mensaje si no hay resultados
                        if (filteredData.length === 0 && searchTerm.length > 0) {
                            mostrarNotificacion("No se encontraron coincidencias", "info");
                        }
                    });
                }

                mostrarNotificacion("Datos cargados correctamente", "success");
            })
            .catch(error => {
                console.error("Error al cargar los datos:", error);
                mostrarNotificacion(`Error al cargar los datos: ${error.message}`, "error");
            });
    }

    // Inicialización
    setupNavigation();
    cargarDatosIniciales();
});

function volverInicio() {
    window.location.href = "index.html";
}