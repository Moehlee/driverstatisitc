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
    const [sectors, setSectors] = useState<[number, number][]>([]);
    const [lapTimes, setLapTimes] = useState<number[]>([]);
    const lastCrossTime = useRef<number | null>(null);
    const sectorTimesRef = useRef<number[]>([]);
    const currentSectorRef = useRef<number>(0);
    const sectorCrossTimes = useRef<number[]>([]); // Neue Referenz für Sektor-Zeitstempel

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

                        // Strg + Linksklick = Sektor, normaler Linksklick = Start/Ziel
                        if (e.originalEvent.ctrlKey) {
                            // Sektor hinzufügen
                            setSectors(prev => [...prev, point]);

                            // Sektor anzeigen
                            l.circleMarker(point, {
                                radius: 6,
                                color: "blue",
                                weight: 3,
                                fillColor: "blue",
                                fillOpacity: 0.5
                            })
                                .bindPopup(`Sektor ${sectors.length + 1}`)
                                .addTo(mapRef.current!);

                            console.log(`Sektor ${sectors.length + 1} gesetzt:`, point);
                        } else {
                            // Start/Ziel setzen
                            setStartFinish(point);

                            // Startpunkt sichtbar machen
                            l.circleMarker(point, {
                                radius: 8,
                                color: "red",
                                weight: 3
                            }).addTo(mapRef.current!);

                            console.log("Start/Ziel gesetzt:", point);
                        }
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
            const now = performance.now();

            // Sektor-Erkennung
            if (sectors.length > 0) {
                for (let i = 0; i < sectors.length; i++) {
                    const sector = sectors[i];
                    const distToSector = Math.sqrt(
                        Math.pow(pos[0] - sector[0], 2) +
                        Math.pow(pos[1] - sector[1], 2)
                    );

                    if (distToSector < 0.00002 && currentSectorRef.current === i) {
                        const sectorTime = now - (sectorCrossTimes.current[i-1] || lastCrossTime.current || now);
                        sectorTimesRef.current[i] = sectorTime;
                        sectorCrossTimes.current[i] = now;
                        currentSectorRef.current = i + 1;
                        console.log(`Sektor ${i + 1} Zeit: ${(sectorTime / 1000).toFixed(3)}s`);
                    }
                }
            }

            // Start/Ziel-Erkennung
            if (startFinish) {
                const dist = Math.sqrt(
                    Math.pow(pos[0] - startFinish[0], 2) +
                    Math.pow(pos[1] - startFinish[1], 2)
                );

                if (dist < 0.00002) {
                    const now = performance.now();

                    if (lastCrossTime.current !== null) {
                        const lapTimeMs = now - lastCrossTime.current;

                        // Korrekte Sektorzeit-Berechnung
                        const finalSectorTimes: number[] = [];

                        // Start bis Sektor 1
                        if (sectors.length > 0) {
                            finalSectorTimes[0] = sectorCrossTimes.current[0] - lastCrossTime.current;

                            //Sektor i bis Sektor i+1
                            for (let i = 1; i < sectors.length; i++) {
                                finalSectorTimes[i] = sectorCrossTimes.current[i] - sectorCrossTimes.current[i-1];
                            }

                            // Lletzter Sektor bis Start/Ziel
                            finalSectorTimes[sectors.length] = now - sectorCrossTimes.current[sectors.length-1];
                        }

                        console.log("DEBUG - Lap time calculated:", lapTimeMs, "ms");
                        setLapTimes(prev => [...prev, lapTimeMs]);

                        localStorage.setItem("latestLap", lapTimeMs.toString());
                        localStorage.setItem("lapTimeStamp", Date.now().toString());

                        localStorage.setItem("sectorTimes", JSON.stringify(finalSectorTimes));
                        localStorage.setItem("sectorCount", JSON.stringify(sectors.length));

                        console.log("Runde beendet:", lapTimeMs / 1000, "s");
                        console.log("Sektorzeiten:", finalSectorTimes.map(time => (time / 1000).toFixed(3)));
                        console.log("Summe Sektorzeiten:", finalSectorTimes.reduce((a, b) => a + b, 0) / 1000, "s");

                        pb.collection("laps").create({
                            driver: "Driver",
                            lapTime: (lapTimeMs / 1000).toFixed(3),
                            timeStamp: new Date().toISOString(),
                            cones: 0,
                            sectors: finalSectorTimes.map(time => (time / 1000).toFixed(3)),
                            sectorCount: sectors.length + 1
                        })
                            .then(() => {
                                console.log("Lap saved to PocketBase");
                            })
                            .catch((err) => {
                                console.error("Error saving lap:", err);
                            });
                    }

                    lastCrossTime.current = now;
                    currentSectorRef.current = 0;
                    sectorTimesRef.current = [];
                    sectorCrossTimes.current = [];
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
    }, [path, startFinish, sectors]);

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