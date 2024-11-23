class LocationTracker {
    constructor() {
        this.userId = `user_${Math.floor(Math.random() * 1000000)}`;
        this.socket = null;
        this.map = null;
        this.userMarker = null;
        this.otherMarkers = new Map();
        
        this.initializeMap();
        this.connectSocket();
    }

    initializeMap() {
        this.map = L.map("map").setView([0, 0], 2);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(this.map);

        const statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.className = 'status-indicator';
        document.body.appendChild(statusDiv);
    }

    connectSocket() {
        // Cambiar esta URL cuando despliegues tu servidor
        const serverUrl = 'https://tu-servidor.onrender.com';
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
            this.updateStatus('Conectado', 'connected');
            this.socket.emit('register', this.userId);
            this.startLocationTracking();
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            this.updateStatus('Desconectado', 'disconnected');
        });

        this.socket.on('registered', (userId) => {
            console.log('Registrado con ID:', userId);
        });

        this.socket.on('locations', (locations) => {
            this.updateMarkers(locations);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            this.updateStatus('Error de conexión', 'error');
        });
    }

    startLocationTracking() {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                
                this.socket.emit('updateLocation', { lat, lng });
                this.updateUserMarker(lat, lng);
            },
            (error) => {
                console.error("Error obteniendo ubicación:", error);
                this.updateStatus('Error de GPS', 'error');
            },
            { 
                enableHighAccuracy: true, 
                timeout: 5000, 
                maximumAge: 0 
            }
        );
    }

    updateUserMarker(lat, lng) {
        if (!this.userMarker) {
            this.userMarker = L.marker([lat, lng], {
                icon: this.createCustomIcon('blue')
            }).addTo(this.map)
              .bindPopup("Mi ubicación");
            this.map.setView([lat, lng], 15);
        } else {
            this.userMarker.setLatLng([lat, lng]);
        }
    }

    updateMarkers(locations) {
        const currentMarkers = new Set();

        for (const [id, location] of Object.entries(locations)) {
            if (id === this.userId) continue;
            
            currentMarkers.add(id);
            const { lat, lng } = location;

            if (!this.otherMarkers.has(id)) {
                const marker = L.marker([lat, lng], {
                    icon: this.createCustomIcon('red')
                }).addTo(this.map)
                  .bindPopup(`Usuario: ${id}`);
                this.otherMarkers.set(id, marker);
            } else {
                this.otherMarkers.get(id).setLatLng([lat, lng]);
            }
        }

        // Eliminar marcadores de usuarios que ya no están
        for (const [id, marker] of this.otherMarkers) {
            if (!currentMarkers.has(id)) {
                this.map.removeLayer(marker);
                this.otherMarkers.delete(id);
            }
        }
    }

    createCustomIcon(color) {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${color};
                width: 15px;
                height: 15px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [15, 15],
            iconAnchor: [7, 7]
        });
    }

    updateStatus(message, className) {
        const statusDiv = document.getElementById('connection-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `status-indicator ${className}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tracker = new LocationTracker();
});