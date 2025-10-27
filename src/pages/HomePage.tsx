import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import {CTM_Colors} from "../Helper";

const disciplines = [
    { name: "Acceleration", color: "CTM_Colors.ctm_green" },
    { name: "Skidpad", color: "CTM_Colors.ctm_green" },
    { name: "Endurance", color: "CTM_Colors.ctm_green"},
    { name: "Efficiency", color: "CTM_Colors.ctm_green" },
];

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Formula Student Live Timing
            </Typography>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
                maxWidth: 800,
                margin: '0 auto'
            }}>
                {disciplines.map((disc) => (
                    <Button
                        key={disc.name}
                        variant="contained"
                        sx={{
                            bgcolor: disc.color,
                            color: "#fff",
                            p: 2,
                            height: 80,
                            fontSize: '1.1rem'
                        }}
                        onClick={() => navigate(`/discipline/${disc.name.toLowerCase()}`)}
                    >
                        {disc.name}
                    </Button>
                ))}
            </Box>
        </Box>
    );
};

export default HomePage;