import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useState, useEffect, useRef } from "react";
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
    map.invalidateSize();

    if (position) {
      map.flyTo(position, 16, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [map, position]);

  return null;
};

const getSavedName = () => {
  const savedName = window.localStorage.getItem("tracker-display-name");
  return savedName?.trim() || "";
};

const getPositionFromPayload = (payload) => {
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
};

const Map = () => {
  const [positions, setPositions] = useState({});
  const [mySocketId, setMySocketId] = useState(null);
  const [displayName, setDisplayName] = useState(getSavedName);
  const [nameInput, setNameInput] = useState(getSavedName);
  const lastLocationRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => {
      setMySocketId(socket.id);
      socket.emit("get-active-users");
    };

    const handleActiveUsers = (users) => {
      if (!Array.isArray(users)) {
        return;
      }

      setPositions(
        users.reduce((nextPositions, user) => {
          const position = getPositionFromPayload(user);

          if (user.id && position) {
            nextPositions[user.id] = {
              name: user.name,
              position,
            };
          }

          return nextPositions;
        }, {}),
      );
    };

    const handleReceiveLocation = (data) => {
      const position = getPositionFromPayload(data);

      if (!data?.id || !position) {
        return;
      }

      setPositions((currentPositions) => ({
        ...currentPositions,
        [data.id]: {
          name: data.name,
          position,
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
    socket.on("active-users", handleActiveUsers);
    socket.on("receive-location", handleReceiveLocation);
    socket.on("user-disconnected", handleUserDisconnected);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("active-users", handleActiveUsers);
      socket.off("receive-location", handleReceiveLocation);
      socket.off("user-disconnected", handleUserDisconnected);
    };
  }, []);

  useEffect(() => {
    if (!displayName || !navigator.geolocation) {
      return undefined;
    }

    const emitCurrentLocation = ({ latitude, longitude }) => {
      lastLocationRef.current = { latitude, longitude };
      socket.emit("send-location", { latitude, longitude, name: displayName });
    };

    const fetchAndEmitCurrentLocation = () => {
      if (lastLocationRef.current) {
        emitCurrentLocation(lastLocationRef.current);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => emitCurrentLocation(position.coords),
        (error) => {
          console.error("Location refresh failed:", error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        },
      );
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => emitCurrentLocation(position.coords),
      (error) => {
        console.error("Location tracking failed:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    const handleConnect = () => {
      socket.emit("get-active-users");
      fetchAndEmitCurrentLocation();
    };

    socket.on("connect", handleConnect);
    socket.on("request-location", fetchAndEmitCurrentLocation);

    if (socket.connected) {
      handleConnect();
    } else {
      fetchAndEmitCurrentLocation();
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("connect", handleConnect);
      socket.off("request-location", fetchAndEmitCurrentLocation);
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
