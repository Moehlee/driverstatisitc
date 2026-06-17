import React, { useEffect, useRef, useState } from "react";
import l from "leaflet";
import "leaflet/dist/leaflet.css";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";
import { useData } from "../contexts/DataContext";
import UndoIcon from '@mui/icons-material/Undo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Chip, Typography, Tooltip } from "@mui/material";

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

    const [history, setHistory] = useState<{ type: 'start' | 'sector', point: [number, number] }[]>([]);
    const [showHelp, setShowHelp] = useState(() => {
        return localStorage.getItem('mapHelpShown') !== 'true';
    });

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
                setHistory(prev => [...prev, { type: 'sector', point }]);
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
                setHistory(prev => [...prev, { type: 'start', point }]);
                l.circleMarker(point, {
                    radius: 8,
                    color: "red",
                    weight: 3
                })
                    .bindPopup("Start / Finish")
                    .addTo(mapRef.current!);
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

    // Undo Funktion
    const handleUndo = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];

        if (lastAction.type === 'start') {
            setStartFinish(null);
            if (mapRef.current) {
                mapRef.current.eachLayer((layer) => {
                    if (layer instanceof l.CircleMarker) {  // l. statt L.
                        const popup = layer.getPopup();
                        if (popup) {
                            const content = popup.getContent();
                            const contentString = typeof content === 'string' ? content : '';
                            if (contentString.includes("Start / Finish")) {
                                mapRef.current!.removeLayer(layer);
                            }
                        }
                    }
                });
            }
        } else if (lastAction.type === 'sector') {
            setSectors(prev => prev.slice(0, -1));
            if (mapRef.current) {
                const sectorMarkers: l.CircleMarker[] = [];  // l. statt L.
                mapRef.current.eachLayer((layer) => {
                    if (layer instanceof l.CircleMarker) {  // l. statt L.
                        const popup = layer.getPopup();
                        if (popup) {
                            const content = popup.getContent();
                            const contentString = typeof content === 'string' ? content : '';
                            if (contentString.includes("Sector")) {
                                sectorMarkers.push(layer);
                            }
                        }
                    }
                });
                if (sectorMarkers.length > 0) {
                    mapRef.current.removeLayer(sectorMarkers[sectorMarkers.length - 1]);
                }
            }
        }

        setHistory(prev => prev.slice(0, -1));
    };

// Clear All Funktion
    const handleClearAll = () => {
        if (mapRef.current) {
            const markersToRemove: l.CircleMarker[] = [];  // l. statt L.
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof l.CircleMarker) {  // l. statt L.
                    const popup = layer.getPopup();
                    if (popup) {
                        const content = popup.getContent();
                        const contentString = typeof content === 'string' ? content : '';
                        if (contentString.includes("Start") || contentString.includes("Sector")) {
                            markersToRemove.push(layer);
                        }
                    }
                }
            });
            markersToRemove.forEach(marker => {
                if (mapRef.current) {
                    mapRef.current.removeLayer(marker);
                }
            });
        }
        setStartFinish(null);
        setSectors([]);
        setHistory([]);
    };

    const handleCloseHelp = () => {
        setShowHelp(false);
        localStorage.setItem('mapHelpShown', 'true');
    };

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <div id="map" style={{ width: "100%", height: "100%", borderRadius: "10px" }} />

            {/* Hilfe Overlay */}
            {showHelp && (
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    borderRadius: '10px'
                }}>
                    <Box sx={{
                        backgroundColor: 'white',
                        padding: 4,
                        borderRadius: 3,
                        maxWidth: 500,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h5" sx={{ mb: 2, color: CTM_Colors.ctm_green }}>
                            Map Controls
                        </Typography>
                        <Box sx={{ textAlign: 'left', mb: 3 }}>
                            <Typography sx={{ mb: 1 }}><strong>Click:</strong> Set Start/Finish Line</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Ctrl + Click:</strong> Add Sector Point</Typography>
                            <Typography sx={{ mb: 1 }}><strong>Undo:</strong> Remove last placed marker</Typography>
                            <Typography><strong>Clear All:</strong> Remove all markers</Typography>
                        </Box>
                        <Button variant="contained" onClick={handleCloseHelp}
                                sx={{ backgroundColor: CTM_Colors.ctm_green, color: CTM_Colors.black,
                                    '&:hover': { backgroundColor: CTM_Colors.grey } }}>
                            Got it!
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Control Buttons */}
            <Box sx={{
                position: 'absolute', bottom: 20, left: 20,
                display: 'flex', gap: 1, zIndex: 1000, flexWrap: 'wrap'
            }}>
                <Button variant="contained" size="small" onClick={handleUndo} disabled={history.length === 0}
                        sx={{ backgroundColor: history.length > 0 ? '#ff9800' : '#ccc', color: 'white',
                            '&:hover': { backgroundColor: history.length > 0 ? '#f57c00' : '#ccc' }, minWidth: 40 }}>
                    <UndoIcon />
                </Button>

                <Button variant="contained" size="small" onClick={handleClearAll} disabled={history.length === 0}
                        sx={{ backgroundColor: history.length > 0 ? '#f44336' : '#ccc', color: 'white',
                            '&:hover': { backgroundColor: history.length > 0 ? '#d32f2f' : '#ccc' } }}>
                    X
                </Button>

                <Button variant="outlined" size="small" onClick={() => setShowHelp(true)}
                        sx={{ borderColor: CTM_Colors.ctm_green, color: CTM_Colors.ctm_green,
                            '&:hover': { backgroundColor: 'rgba(28, 150, 0, 0.1)' } }}>
                    ?
                </Button>
            </Box>

            {/* Status Info */}
            <Box sx={{
                position: 'absolute', bottom: 20, right: 20,
                zIndex: 1000, display: 'flex', gap: 1, flexWrap: 'wrap'
            }}>
                {startFinish && <Chip label="Start/Finish set" size="small" sx={{ backgroundColor: '#4CAF50', color: 'white' }} />}
                {sectors.length > 0 && <Chip label={`${sectors.length} Sectors`} size="small" sx={{ backgroundColor: '#2196F3', color: 'white' }} />}
                {history.length > 0 && <Chip label={`${history.length} actions`} size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />}
            </Box>
        </Box>
    );
};

export default LiveMap;