import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LiveMap: React.FC = () => {
    return (
        <div style={{ height: "80vh", width: "100%", marginTop: "20px" }}>
            <MapContainer
                center={[47.2638611, 11.3457778]} // Innsbruck
                zoom={14}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
        </div>
    );
};

export default LiveMap;
