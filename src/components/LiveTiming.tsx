import React, { useEffect, useState, useRef } from "react";
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
}

const LiveTiming: React.FC = () => {
    const [laps, setLaps] = useState<LapRecord[]>([]);
    const [localLaps, setLocalLaps] = useState<{ time: number, timeStamp: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        pb.autoCancellation(false);
    }, []);

    useEffect(() => {
        const loadLaps = async () => {
            try {
                setLoading(true);
                const records = await pb.collection("laps").getFullList({
                    sort: "-created",
                    requestKey: null
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

        const setupLiveUpdates = async () => {
            try {
                unsubscribeRef.current = await pb.collection("laps").subscribe("*",
                    (e) => {
                        console.log("Live update:", e);
                        toast.info(`Update: ${e.action}`);
                        loadLaps();
                    }
                );
                console.log("Live updates subscribed successfully");
            } catch (error) {
                console.error("Failed to subscribe to live updates:", error);
                const pollingInterval = setInterval(loadLaps, 5000);
                return () => clearInterval(pollingInterval);
            }
        };

        setupLiveUpdates();

        // Local storage polling
        const timer = setInterval(() => {
            const t = localStorage.getItem("latestLap");
            const ts = localStorage.getItem("lapTimeStamp");

            if (t !== null && ts !== null) {
                const newLap = {
                    time: Number(t),
                    timeStamp: Number(ts)
                };

                setLocalLaps(prev => {
                    const exists = prev.some(lap =>
                        lap.time === newLap.time && lap.timeStamp === newLap.timeStamp
                    );
                    return exists ? prev : [...prev, newLap];
                });

                localStorage.removeItem("latestLap");
                localStorage.removeItem("lapTimeStamp");
            }
        }, 1000);

        return () => {
            clearInterval(timer);
            if (unsubscribeRef.current) {
                console.log("Unsubscribing from live updates");
                unsubscribeRef.current();
            }
        };
    }, []);

    // Debug local storage
    useEffect(() => {
        const checkStorage = () => {
            console.log("LocalStorage check:",
                localStorage.getItem("latestLap"),
                localStorage.getItem("lapTimeStamp")
            );
        };

        checkStorage();
        const storageInterval = setInterval(checkStorage, 2000);
        return () => clearInterval(storageInterval);
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const records = await pb.collection("laps").getFullList({
                sort: "-created",
                requestKey: null
            });
            setLaps(records as any);
            toast.success("Data refreshed");
        } catch (err) {
            console.error("Error refreshing laps:", err);
            toast.error("Failed to refresh laps");
        } finally {
            setLoading(false);
        }
    };

    if (loading && laps.length === 0) {
        return (
            <Typography color={CTM_Colors.white}>Loading laps...</Typography>
        );
    }

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
                    Lap Times
                </Typography>
                {laps.length === 0 ? (
                    <Typography textAlign="center">No laps recorded yet</Typography>
                ) : (
                    laps.map((lap) => (
                        <Box
                            key={lap.id}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 1,
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                            }}>
                            <Typography>{lap.driver}</Typography>
                            <Typography>{lap.lapTime}s</Typography>
                            <Typography>Cones: {lap.cones}</Typography>
                            <Typography variant="body2">
                                {new Date(lap.timeStamp).toLocaleTimeString()}
                            </Typography>
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
                    "&:hover": {
                        backgroundColor: CTM_Colors.grey
                    }
                }}
                onClick={handleRefresh}
                disabled={loading}
            >
                {loading ? "Refreshing..." : "Refresh"}
            </Button>
        </Grid>
    );
};

export default LiveTiming;