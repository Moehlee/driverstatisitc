import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";
import PocketBase from "pocketbase";

interface LapRecord {
    id: string;
    driver: string;
    lapTime: string;
    cones: number;
    timestamp: string;
}

const LiveTiming: React.FC = () => {
    const [laps, setLaps] = useState<LapRecord[]>([]);
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

        return () => {
            pb.collection("laps").unsubscribe("*");
        };
    }, []);

    if (loading) {
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
                }}>
                {laps.length === 0 ? (
                    <Typography>No laps recorded yet</Typography>
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
                                {new Date(lap.timestamp).toLocaleTimeString()}
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
                    "&:hover": CTM_Colors.grey
                }}
                onClick={() => toast.success("Manual refresh triggered")}
            >
                Refresh
            </Button>
        </Grid>
    );
};

export default LiveTiming;
