// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Añadir ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor de localización en tiempo real funcionando correctamente');
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        connections: io.engine.clientsCount,
        uptime: process.uptime()
    });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const locations = new Map();

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('register', (userId) => {
        console.log('Usuario registrado:', userId);
        socket.userId = userId;
        socket.emit('registered', userId);
    });

    socket.on('updateLocation', (data) => {
        if (socket.userId) {
            locations.set(socket.userId, {
                lat: data.lat,
                lng: data.lng,
                timestamp: Date.now()
            });
            io.emit('locations', Object.fromEntries(locations));
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            console.log('Usuario desconectado:', socket.userId);
            locations.delete(socket.userId);
            io.emit('locations', Object.fromEntries(locations));
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});