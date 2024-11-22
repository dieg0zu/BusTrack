const http = require("http");
const WebSocket = require("ws");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const ubicaciones = {}; // Almacena las ubicaciones de los usuarios

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "update") {
            // Actualiza la ubicación del usuario
            ubicaciones[data.userId] = { lat: data.lat, lng: data.lng };

            // Envía la lista de ubicaciones a todos los clientes conectados
            const actualizacion = JSON.stringify({
                type: "locations",
                locations: ubicaciones,
            });

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(actualizacion);
                }
            });
        }
    });

    // Limpia la ubicación cuando un cliente se desconecta
    ws.on("close", () => {
        for (const userId in ubicaciones) {
            if (ubicaciones[userId].ws === ws) {
                delete ubicaciones[userId];
                break;
            }
        }
    });
});

server.listen(8080, () => {
    console.log("Servidor WebSocket escuchando en http://localhost:8080");
});
