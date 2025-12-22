import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import LiveMap from "../components/LiveMap";
import LiveTiming from "../components/LiveTiming";
import StatView from "../components/StatView";
import { CTM_Colors } from "../Helper";

const RunDetailPage = () => {
    const { id } = useParams();
    const [showStats, setShowStats] = useState(false); // false = LiveTiming, true = StatView

    return (
        <Box sx={{ p: 4, height: '100vh' }}>
            <Typography variant="h4" gutterBottom>
                Run {id}
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={() => setShowStats(!showStats)}
                    sx={{
                        backgroundColor: CTM_Colors.ctm_green,
                        color: CTM_Colors.black,
                        '&:hover': { backgroundColor: CTM_Colors.grey }
                    }}
                >
                    {showStats ? "Show Live Timing" : "Show Statistics"}
                </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 3, height: 'calc(100vh - 120px)' }}>
                <Box sx={{ flex: 1 }}>
                    <LiveMap />
                </Box>

                <Box sx={{ flex: 1 }}>
                    {showStats ? <StatView /> : <LiveTiming />}
                </Box>
            </Box>
        </Box>
    );
};

export default RunDetailPage;