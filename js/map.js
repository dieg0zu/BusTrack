const userId = `user_${Math.floor(Math.random() * 1000)}`; // ID único para cada usuario
const socket = new WebSocket("ws://localhost:8080");

let mapa, marcadorUsuario;
const marcadoresOtrosUsuarios = {};

// Inicializa el mapa
function inicializarMapa() {
    mapa = L.map("map").setView([0, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapa);

    // Escucha actualizaciones del servidor
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "locations") {
            actualizarMarcadores(data.locations);
        }
    };

    // Obtiene la ubicación inicial del usuario
    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Envía la ubicación al servidor
            socket.send(JSON.stringify({ type: "update", userId, lat, lng }));

            // Actualiza el marcador del usuario en el mapa
            if (!marcadorUsuario) {
                marcadorUsuario = L.marker([lat, lng])
                    .addTo(mapa)
                    .bindPopup("Mi ubicación");
            } else {
                marcadorUsuario.setLatLng([lat, lng]);
            }

            // Centra el mapa en la ubicación del usuario
            mapa.setView([lat, lng], 15);
        },
        (error) => {
            console.error("Error al obtener la ubicación: ", error);
        },
        { enableHighAccuracy: true }
    );
}

// Actualiza los marcadores de otros usuarios en el mapa
function actualizarMarcadores(locations) {
    for (const id in locations) {
        if (id !== userId) {
            const { lat, lng } = locations[id];

            if (!marcadoresOtrosUsuarios[id]) {
                // Crea un nuevo marcador para un usuario desconocido
                marcadoresOtrosUsuarios[id] = L.marker([lat, lng])
                    .addTo(mapa)
                    .bindPopup(`Usuario: ${id}`);
            } else {
                // Actualiza la posición del marcador existente
                marcadoresOtrosUsuarios[id].setLatLng([lat, lng]);
            }
        }
    }
}

// Inicializa el mapa al cargar la página
inicializarMapa();
