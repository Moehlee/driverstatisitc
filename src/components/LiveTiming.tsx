import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

interface LapRecord {
    id: string;
    driver: string;
    lapTime: string;
    cones: number;
    timeStamp: string;
    sectors?: string[]; // Sektorzeiten als Array
    sectorCount?: number; // Anzahl der Sektoren
}

interface LocalLap {
    time: number;
    timeStamp: number;
    sectors?: number[]; // Sektorzeiten in ms
    sectorCount?: number;
}

const LiveTiming: React.FC = () => {
    const [laps, setLaps] = useState<LapRecord[]>([]);
    const [localLaps, setLocalLaps] = useState<LocalLap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLaps = async () => {
            try {
                const records = await pb.collection("laps").getFullList(50, {
                    sort: "-created",
                });
                setLaps(records as any);
            } catch (err) {
                console.error("Error loading laps:", err);
                toast.error("Failed to load laps");
            } finally {
                setLoading(false);
            }
        };

        loadLaps();

        // Live updates
        const unsub = pb.collection("laps").subscribe("*", (e) => {
            console.log("Live update:", e);
            toast.info(`Update: ${e.action}`);
            loadLaps(); // reload on any change
        });

        const timer = setInterval(() => {
            const t = localStorage.getItem("latestLap");
            const ts = localStorage.getItem("lapTimeStamp");
            const sectorTimesStr = localStorage.getItem("sectorTimes");
            const sectorCountStr = localStorage.getItem("sectorCount");

            if (t !== null && ts !== null) {
                const newLap: LocalLap = {
                    time: Number(t),
                    timeStamp: Number(ts)
                };

                // Sektorzeiten hinzufügen falls vorhanden
                if (sectorTimesStr) {
                    try {
                        newLap.sectors = JSON.parse(sectorTimesStr);
                    } catch (e) {
                        console.error("Error parsing sector times:", e);
                    }
                }

                if (sectorCountStr) {
                    try {
                        newLap.sectorCount = JSON.parse(sectorCountStr);
                    } catch (e) {
                        console.error("Error parsing sector count:", e);
                    }
                }

                setLocalLaps(prev => [
                    ...prev,
                    newLap
                ]);

                localStorage.removeItem("latestLap");
                localStorage.removeItem("lapTimeStamp");
                localStorage.removeItem("sectorTimes");
                localStorage.removeItem("sectorCount");
            }
        }, 500);

        return () => {
            clearInterval(timer);
            pb.collection("laps").unsubscribe("*");
        };
    }, []);

    if (loading) {
        return (
            <Typography color={CTM_Colors.white}>Loading laps...</Typography>
        );
    }

    const sectorColors = ["#6bb5ff", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{
                minHeight: "100vh",
                color: CTM_Colors.black,
                padding: 3,
            }}>

            <Box
                sx={{
                    border: 1,
                    borderColor: CTM_Colors.ctm_green,
                    borderRadius: 1,
                    width: "80%",
                    padding: 2,
                    mb: 3,
                }}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                    Server Lap Times
                </Typography>
                {laps.length === 0 ? (
                    <Typography textAlign="center">No laps recorded yet</Typography>
                ) : (
                    laps.map((lap) => (
                        <Box key={lap.id}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 1,
                                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                }}>
                                <Typography fontWeight="bold">{lap.driver}</Typography>
                                <Typography fontWeight="bold">{lap.lapTime}s</Typography>
                                <Typography>Cones: {lap.cones}</Typography>
                                {lap.sectorCount && (
                                    <Typography variant="body2">
                                        Sektoren: {lap.sectorCount}
                                    </Typography>
                                )}
                                <Typography variant="body2">
                                    {new Date(lap.timeStamp).toLocaleTimeString()}
                                </Typography>

                            </Box>

                            {lap.sectors && lap.sectors.length > 0 && (
                                <Box sx={{
                                    padding: 1,
                                    backgroundColor: 'rgba(0,0,0,0.02)',
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        Sektorzeiten:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {lap.sectors.map((sectorTime, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '2px 8px',
                                                    backgroundColor: sectorColors[index % sectorColors.length],
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                S{index + 1}: {sectorTime}s
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ))
                )}
            </Box>

            <Box
                sx={{
                    border: 1,
                    borderColor: "red",
                    borderRadius: 1,
                    width: "80%",
                    padding: 2,
                    mb: 3,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                    Local Lap Times
                </Typography>

                {localLaps.length === 0 ? (
                    <Typography textAlign="center">No local laps yet</Typography>
                ) : (
                    localLaps.map((lap, i) => (
                        <Box key={i}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 1,
                                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: 'rgba(255,0,0,0.05)',
                                }}
                            >
                                <Typography>Driver</Typography>
                                <Typography fontWeight="bold">{(lap.time / 1000).toFixed(3)}s</Typography>
                                {lap.sectorCount && (
                                    <Typography variant="body2">
                                        Sektoren: {lap.sectorCount}
                                    </Typography>
                                )}
                                <Typography variant="body2">
                                    {new Date(lap.timeStamp).toLocaleTimeString()}
                                </Typography>
                            </Box>

                            {lap.sectors && lap.sectors.length > 0 && (
                                <Box sx={{
                                    padding: 1,
                                    backgroundColor: 'rgba(255,0,0,0.02)',
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                }}>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        Sektorzeiten:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {lap.sectors.map((sectorTime, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '2px 8px',
                                                    backgroundColor: sectorColors[index % sectorColors.length],
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                S{index + 1}: {(sectorTime / 1000).toFixed(3)}s
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ))
                )}
            </Box>

            <Button
                variant="contained"
                sx={{
                    mt: 3,
                    backgroundColor: CTM_Colors.ctm_green,
                    color: CTM_Colors.black,
                    "&:hover": { backgroundColor: CTM_Colors.grey }
                }}
                onClick={() => toast.success("Manual refresh triggered")}
            >
                Refresh
            </Button>
        </Grid>
    );
};

export default LiveTiming;