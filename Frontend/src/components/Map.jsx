import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
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

const getSavedName = () => {
  const savedName = window.localStorage.getItem("tracker-display-name");
  return savedName?.trim() || "";
};

const Map = () => {
  const [positions, setPositions] = useState({});
  const [mySocketId, setMySocketId] = useState(null);
  const [displayName, setDisplayName] = useState(getSavedName);
  const [nameInput, setNameInput] = useState(getSavedName);

  useEffect(() => {
    const handleConnect = () => {
      setMySocketId(socket.id);
    };

    const handleReceiveLocation = (data) => {
      setPositions((currentPositions) => ({
        ...currentPositions,
        [data.id]: {
          name: data.name,
          position: [data.latitude, data.longitude],
        },
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
    if (!displayName) {
      return;
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        socket.emit("send-location", { latitude, longitude, name: displayName });
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
  }, [displayName]);

  const myPosition = mySocketId ? positions[mySocketId]?.position : null;

  const handleNameSubmit = (event) => {
    event.preventDefault();

    const nextName = nameInput.trim().replace(/\s+/g, " ").slice(0, 40);

    if (!nextName) {
      return;
    }

    window.localStorage.setItem("tracker-display-name", nextName);
    setDisplayName(nextName);
  };

  return (
    <main className="tracker-shell" aria-label="Realtime location tracker">
      {!displayName && (
        <div className="name-overlay" role="dialog" aria-modal="true">
          <form className="name-card" onSubmit={handleNameSubmit}>
            <label htmlFor="display-name">Enter your name</label>
            <div className="name-row">
              <input
                id="display-name"
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                maxLength={40}
                autoComplete="name"
                autoFocus
                placeholder="Your name"
              />
              <button type="submit">Start</button>
            </div>
          </form>
        </div>
      )}
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
        {Object.entries(positions).map(([id, user]) => (
          <Marker key={id} icon={redMarkerIcon} position={user.position}>
            <Tooltip direction="top" offset={[0, -36]} permanent>
              {user.name}
            </Tooltip>
            <Popup>
              {id === mySocketId ? `${user.name} (You)` : user.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </main>
  );
};

export default Map;
