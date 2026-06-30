import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import socket from "../socket.js";

const redMarkerIcon = L.icon({
  className: "tracker-marker-red",
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RecenterMap = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [map, position]);

  return null;
};

const Map = () => {
  const [positions, setPositions] = useState({});
  const [mySocketId, setMySocketId] = useState(null);

  useEffect(() => {
    const handleConnect = () => setMySocketId(socket.id);

    const handleReceiveLocation = (data) => {
      setPositions((currentPositions) => ({
        ...currentPositions,
        [data.id]: [data.latitude, data.longitude],
      }));
    };

    const handleUserDisconnected = (id) => {
      setPositions((currentPositions) => {
        const nextPositions = { ...currentPositions };
        delete nextPositions[id];
        return nextPositions;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("receive-location", handleReceiveLocation);
    socket.on("user-disconnected", handleUserDisconnected);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("receive-location", handleReceiveLocation);
      socket.off("user-disconnected", handleUserDisconnected);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        socket.emit("send-location", { latitude, longitude });
      },
      (error) => {
        console.error("Location tracking failed:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const myPosition = mySocketId ? positions[mySocketId] : null;

  return (
    <main className="tracker-shell" aria-label="Realtime location tracker">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="tracker-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap position={myPosition} />
        {Object.entries(positions).map(([id, position]) => (
          <Marker key={id} icon={redMarkerIcon} position={position}>
            <Popup>{id === mySocketId ? "You are here" : `User ${id}`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </main>
  );
};

export default Map;
