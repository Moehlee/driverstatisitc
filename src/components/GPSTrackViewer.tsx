import React, { useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";

const gpsIcon = L.icon({
    iconUrl: "https://cdn-icons-png.freepik.com/512/2/2013.png",
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

function decodeGPSFrame(hex: string) {
    const bytes = hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16));

    const latRaw =
        (bytes[0] << 24) |
        (bytes[1] << 16) |
        (bytes[2] << 8) |
        bytes[3];

    const lonRaw =
        (bytes[4] << 24) |
        (bytes[5] << 16) |
        (bytes[6] << 8) |
        bytes[7];

    const lat = latRaw / 1e7;
    const lon = lonRaw / 1e7;

    return [lat, lon] as [number, number];
}

export default function GPSTrackViewer() {
    const [points, setPoints] = useState<[number, number][]>([]);

    const onFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            const extractedPoints: [number, number][] = [];
            const lines = text.split("\n");

            for (const line of lines) {
                const match = line.match(/560#([0-9A-Fa-f]{16})/);
                if (match) {
                    const hex = match[1];
                    extractedPoints.push(decodeGPSFrame(hex));
                }
            }

            setPoints(extractedPoints);
        };

        reader.readAsText(file);
    };

    return (
        <div style={{ width: "100%", height: "100%", padding: "10px" }}>
            <h3>GPS Log Viewer</h3>
            <input type="file" accept=".log,.txt" onChange={onFileLoad} />

            <div style={{ width: "100%", height: "80%", marginTop: "10px" }}>
                <MapContainer
                    center={[47.2645, 11.34436]}
                    zoom={17}
                    style={{ width: "100%", height: "100%" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {points.length > 0 && (
                        <>
                            <Polyline positions={points} color="blue" />
                            <Marker position={points[points.length - 1]} icon={gpsIcon} />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
