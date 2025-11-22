import React, { useEffect, useRef, useState } from "react";
import l from "leaflet";
import "leaflet/dist/leaflet.css";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

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

    const [startFinish, setStartFinish] = useState<[number, number] | null>(null);
    const [lapTimes, setLapTimes] = useState<number[]>([]);
    const lastCrossTime = useRef<number | null>(null);


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

                    mapRef.current.on("click", (e: any) => {
                        const point: [number, number] = [e.latlng.lat, e.latlng.lng];
                        setStartFinish(point);

                        // Startpunkt sichtbar machen
                        l.circleMarker(point, {
                            radius: 8,
                            color: "red",
                            weight: 3
                        }).addTo(mapRef.current!);

                        console.log("Start/Ziel gesetzt:", point);
                    });

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

        let index = 0;

        const interval = setInterval(() => {
            if (!markerRef.current || !mapRef.current) return;
            if (index >= path.length) {
                clearInterval(interval);
                return;
            }
            const pos = path[index];

            if (startFinish) {
                const dist = Math.sqrt(
                    Math.pow(pos[0] - startFinish[0], 2) +
                    Math.pow(pos[1] - startFinish[1], 2)
                );


                // DEBUG: Prüfe ob wir nahe genug sind
                console.log("DEBUG - Distance:", dist, "Threshold: 0.00005", "Within range:", dist < 0.00005);

                if (dist < 0.00002) { // 5 m Radius
                    const now = performance.now();

                    if (lastCrossTime.current !== null) {
                        const lapTimeMs = now - lastCrossTime.current;
                        console.log("DEBUG - Lap time calculated:", lapTimeMs, "ms");

                        setLapTimes(prev => [...prev, lapTimeMs]);

                        localStorage.setItem("latestLap", lapTimeMs.toString());
                        localStorage.setItem("lapTimeStamp", Date.now().toString());


                        console.log("Runde beendet:", lapTimeMs / 1000, "s");

                        pb.collection("laps").create({
                            driver: "Driver",
                            lapTime: (lapTimeMs / 1000).toFixed(3),
                            timeStamp: new Date().toISOString(),
                            cones: 0,
                        })
                            .then(() => {
                                console.log("Lap saved to PocketBase");
                            })
                            .catch((err) => {
                                console.error("Error saving lap:", err);
                            });
                    }

                    lastCrossTime.current = now;
                }
            }

            // Marker bewegen
            markerRef.current.setLatLng(pos);

            // Karte folgen
            // mapRef.current.setView(pos);

            if (polyRef.current) {
                polyRef.current.setLatLngs(path.slice(0, index + 1));
            }

            index++;
        }, 150);

        return () => clearInterval(interval);
    }, [path, startFinish]); // startFinish als Dependency hinzufügen

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
