import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import LiveMap from "../components/LiveMap";
import LiveTiming from "../components/LiveTiming";

const RunDetailPage = () => {
    const { id } = useParams();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4">Run {id}</Typography>
            <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <LiveMap />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <LiveTiming />
                </Box>
            </Box>
        </Box>
    );
};

export default RunDetailPage;
