document.addEventListener("DOMContentLoaded", function () {
    const data = [
        { solicitante: "Juan Pérez", fecha: "2023-10-15", empresa: "Acme Corp", estado: "Revisado" },
        { solicitante: "Ana Gómez", fecha: "2023-10-20", empresa: "Globex", estado: "No revisado" },
    ];

    const eventos = data.map(fila => ({
        title: `Solicitud de ${fila.solicitante}`,
        start: fila.fecha,
        extendedProps: {
            solicitante: fila.solicitante,
            empresa: fila.empresa,
            estado: fila.estado,
        },
    }));

    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "es",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        events: eventos,
        eventClick: function (info) {
            alert(
                `Solicitante: ${info.event.extendedProps.solicitante}\n` +
                `Empresa: ${info.event.extendedProps.empresa}\n` +
                `Estado: ${info.event.extendedProps.estado}`
            );
        },
    });

    calendar.render();
});