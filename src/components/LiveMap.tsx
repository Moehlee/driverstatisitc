import React, { useEffect, useRef, useState } from "react";
import l from "leaflet";
import "leaflet/dist/leaflet.css";
import { CTM_Colors } from "../Helper";

const icon = l.icon({
    iconUrl: "https://cdn-icons-png.freepik.com/512/2/2013.png",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
});

function decodeCanGps(hexString: string): [number, number] {
    const payload = hexString.includes("#")
        ? hexString.split("#")[1]
        : hexString;

    const bytes = Uint8Array.from(
        payload.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const latRaw = new DataView(bytes.buffer).getInt32(0, true);
    const lonRaw = new DataView(bytes.buffer).getInt32(4, true);

    return [ latRaw / 1e7, lonRaw / 1e7];
}


// Log Parser
function parseGpsFromLog(text: string): [number, number][] {
    const lines = text.split("\n");
    const gps: [number, number][] = [];

    const regex = /can-gps\s+[0-9A-Fa-f]+#([0-9A-Fa-f]{16})/;

    for (const line of lines) {
        const match = line.match(regex);
        if (!match) continue;

        const hex = match[1];
        const coords = decodeCanGps(hex);
        if (coords) gps.push(coords);
    }
    return gps;
}

const LiveMap: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const polyRef = useRef<L.Polyline | null>(null);

    const [path, setPath] = useState<[number, number][]>([]);

    useEffect(() => {
        async function loadLog() {
            try {
                const res = await fetch("/runs/demo.log");
                const text = await res.text();

                const gps = parseGpsFromLog(text);

                if (gps.length === 0) {
                    console.warn(" Keine GPS-Daten in Logdatei gefunden.");
                    return;
                }

                setPath(gps);

                if (!mapRef.current) {
                    mapRef.current = l.map("map").setView(gps[0], 17);

                    l.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution: "© OpenStreetMap contributors",
                    }).addTo(mapRef.current);

                    markerRef.current = l.marker(gps[0], { icon }).addTo(mapRef.current);
                    polyRef.current = l.polyline(gps, {
                        color: CTM_Colors.ctm_green,
                        weight: 4,
                    }).addTo(mapRef.current);

                    gps.forEach((pos) => {
                        l.circleMarker(pos, {
                            radius: 4,
                            color: "#1c9600",
                            weight: 2
                        }).addTo(mapRef.current!);
                    });
                }
            } catch (e) {
                console.error("Fehler beim Laden der Logdatei:", e);
            }
        }

        loadLog();
    }, []);

    useEffect(() => {
        if (path.length === 0) return;

        if (markerRef.current) markerRef.current.setLatLng(path[path.length - 1]);
        if (polyRef.current) polyRef.current.setLatLngs(path);
        mapRef.current?.setView(path[path.length - 1]);
    }, [path]);

    return (
        <div
            id="map"
            style={{
                width: "100%",
                height: "100%",
                borderRadius: "10px",
            }}
        />
    );
};

export default LiveMap;
