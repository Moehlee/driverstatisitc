import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { CTM_Colors } from "../Helper";
import SpiderChart from "../components/SpiderChart";

const disciplines = [
    { name: "Acceleration", color: CTM_Colors.ctm_green },
    { name: "Skidpad", color: CTM_Colors.ctm_green },
    { name: "Endurance", color: CTM_Colors.ctm_green },
    { name: "Efficiency", color: CTM_Colors.ctm_green },
];

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 4 }}>
            {/* Buttons nebeneinander mit Flexbox */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
                maxWidth: 800,
                margin: '0 auto',
                mb: 4
            }}>
                {disciplines.map((disc) => (
                    <Button
                        key={disc.name}
                        variant="contained"
                        sx={{
                            bgcolor: disc.color,
                            color: "#000000",
                            p: 2,
                            height: 80,
                            minWidth: 150,
                            fontSize: '1.1rem',
                            flex: '1 1 auto',
                            '&:hover': {
                                bgcolor: CTM_Colors.grey
                            }
                        }}
                        onClick={() => navigate(`/discipline/${disc.name.toLowerCase()}`)}
                    >
                        {disc.name}
                    </Button>
                ))}
            </Box>

            {/* SpiderChart */}
            <Box sx={{ mt: 4 }}>
                <SpiderChart />
            </Box>
        </Box>
    );
};

export default HomePage;