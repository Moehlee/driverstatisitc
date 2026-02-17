import React, { useEffect, useRef, useState } from "react";
import l from "leaflet";
import "leaflet/dist/leaflet.css";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";
import { useData } from "../contexts/DataContext";

const icon = l.icon({
    iconUrl: "https://cdn-icons-png.freepik.com/512/2/2013.png",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
});

const LiveMap: React.FC = () => {
    const { gpsPoints } = useData();

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
    const sectorCrossTimes = useRef<number[]>([]);

    // Pfad aus DataContext aktualisieren
    useEffect(() => {
        if (gpsPoints.length > 0) {
            const newPath = gpsPoints.map(p => [p.lat, p.lon] as [number, number]);
            setPath(newPath);
        }
    }, [gpsPoints]);

    // Karte initialisieren
    useEffect(() => {
        if (path.length === 0 || mapRef.current) return;

        mapRef.current = l.map("map").setView(path[0], 17);

        mapRef.current.on("click", (e: any) => {
            const point: [number, number] = [e.latlng.lat, e.latlng.lng];

            if (e.originalEvent.ctrlKey) {
                setSectors(prev => [...prev, point]);
                l.circleMarker(point, {
                    radius: 6,
                    color: "blue",
                    weight: 3,
                    fillColor: "blue",
                    fillOpacity: 0.5
                })
                    .bindPopup(`Sector ${sectors.length + 1}`)
                    .addTo(mapRef.current!);
                console.log(`Sector ${sectors.length + 1} placed:`, point);
            } else {
                setStartFinish(point);
                l.circleMarker(point, {
                    radius: 8,
                    color: "red",
                    weight: 3
                }).addTo(mapRef.current!);
                console.log("Start/Finish placed:", point);
            }
        });

        l.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(mapRef.current);

        markerRef.current = l.marker(path[0], { icon }).addTo(mapRef.current);
        polyRef.current = l.polyline(path, {
            color: CTM_Colors.ctm_green,
            weight: 4,
        }).addTo(mapRef.current);

        path.forEach((pos) => {
            l.circleMarker(pos, {
                radius: 4,
                color: "#1c9600",
                weight: 2
            }).addTo(mapRef.current!);
        });

    }, [path]);

    // Animation und Rundenzeiten (bleibt gleich)
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

                        const finalSectorTimes: number[] = [];

                        if (sectors.length > 0) {
                            finalSectorTimes[0] = sectorCrossTimes.current[0] - lastCrossTime.current;
                            for (let i = 1; i < sectors.length; i++) {
                                finalSectorTimes[i] = sectorCrossTimes.current[i] - sectorCrossTimes.current[i-1];
                            }
                            finalSectorTimes[sectors.length] = now - sectorCrossTimes.current[sectors.length-1];
                        }

                        setLapTimes(prev => [...prev, lapTimeMs]);

                        localStorage.setItem("latestLap", lapTimeMs.toString());
                        localStorage.setItem("lapTimeStamp", Date.now().toString());
                        localStorage.setItem("sectorTimes", JSON.stringify(finalSectorTimes));
                        localStorage.setItem("sectorCount", JSON.stringify(sectors.length));

                        const selectedDriverId = localStorage.getItem("selectedDriverId");
                        const selectedDiscipline = localStorage.getItem("selectedDiscipline") || "Acceleration";

                        if (!selectedDriverId) return;

                        pb.collection("laps").create({
                            driver: selectedDriverId,
                            lapTime: (lapTimeMs / 1000).toFixed(3),
                            timeStamp: new Date().toISOString(),
                            cones: 0,
                            sectors: finalSectorTimes.map(time => (time / 1000).toFixed(3)),
                            sectorCount: sectors.length + 1,
                            discipline: selectedDiscipline
                        });
                    }

                    lastCrossTime.current = now;
                    currentSectorRef.current = 0;
                    sectorTimesRef.current = [];
                    sectorCrossTimes.current = [];
                }
            }

            markerRef.current.setLatLng(pos);
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