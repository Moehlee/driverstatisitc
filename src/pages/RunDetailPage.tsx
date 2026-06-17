import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    ButtonGroup,
    Paper,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
    Grid
} from "@mui/material";
import { DataProvider, useData } from "../contexts/DataContext";
import LiveMap from "../components/LiveMap";
import LiveTiming from "../components/LiveTiming";
import StatView from "../components/StatView";
import { CTM_Colors } from "../Helper";

const RunContent = () => {
    const { id } = useParams();
    const [showStats, setShowStats] = useState(false);
    const [showAllDriversInGraph, setShowAllDriversInGraph] = useState(false);
    const [discipline, setDiscipline] = useState("Endurance");

    const { latestTemp, gpsPoints, loading } = useData();

    useEffect(() => {
        localStorage.setItem("selectedDiscipline", discipline);
    }, [discipline]);

    return (
        <Box sx={{ p: 3, height: "100vh" }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                    Run {id}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Live telemetry, lap timing and performance analysis
                </Typography>
            </Box>

            {/* Temperatur-Anzeige */}
            {latestTemp && (
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 3,
                    p: 1.5,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    fontSize: '0.9rem'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#ff6b6b', borderRadius: '50%' }} />
                        <span>Temp: <strong>{latestTemp.temp.toFixed(1)}°C</strong></span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#4ecdc4', borderRadius: '50%' }} />
                        <span>Luftfeuchtigkeit: <strong>{latestTemp.hum.toFixed(1)}%</strong></span>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#45b7d1', borderRadius: '50%' }} />
                        <span>Asphalt: <strong>{latestTemp.tempA.toFixed(1)}°C</strong></span>
                    </Box>
                </Box>
            )}

            {/* GPS Info */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                     GPS Punkte: {gpsPoints.length} |
                    {gpsPoints.length > 0 && ` Letzter: ${gpsPoints[gpsPoints.length-1].lat.toFixed(6)}, ${gpsPoints[gpsPoints.length-1].lon.toFixed(6)}`}
                </Typography>
            </Box>

            {/* Main Toggle */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <ButtonGroup>
                    <Button
                        onClick={() => setShowStats(false)}
                        variant={!showStats ? "contained" : "outlined"}
                        sx={{
                            backgroundColor: !showStats ? CTM_Colors.ctm_green : "transparent",
                            color: !showStats ? CTM_Colors.black : CTM_Colors.ctm_green,
                            borderColor: CTM_Colors.ctm_green,
                            px: 4,
                        }}
                    >
                        Live Timing
                    </Button>

                    <Button
                        onClick={() => setShowStats(true)}
                        variant={showStats ? "contained" : "outlined"}
                        sx={{
                            backgroundColor: showStats ? CTM_Colors.ctm_green : "transparent",
                            color: showStats ? CTM_Colors.black : CTM_Colors.ctm_green,
                            borderColor: CTM_Colors.ctm_green,
                            px: 4,
                        }}
                    >
                        Statistics
                    </Button>
                </ButtonGroup>

                <FormControl sx={{ minWidth: 200, ml: 2 }}>
                    <InputLabel>Discipline</InputLabel>
                    <Select
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                        label="Discipline"
                    >
                        <MenuItem value="Acceleration">Acceleration</MenuItem>
                        <MenuItem value="Skidpad">Skidpad</MenuItem>
                        <MenuItem value="Endurance">Endurance</MenuItem>
                        <MenuItem value="Efficiency">Efficiency</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Layout */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 3,
                    height: "calc(100vh - 280px)",
                }}
            >
                {/* Map */}
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        height: "700px"
                    }}
                >
                    <LiveMap />
                </Paper>

                {/* Right Panel */}
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        height: "700px"
                    }}
                >
                    {/* Stats Option */}
                    {showStats && (
                        <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showAllDriversInGraph}
                                        onChange={(e) =>
                                            setShowAllDriversInGraph(e.target.checked)
                                        }
                                        sx={{
                                            "& .MuiSwitch-switchBase.Mui-checked": {
                                                color: CTM_Colors.ctm_green,
                                            },
                                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                                backgroundColor: CTM_Colors.ctm_green,
                                            },
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        {showAllDriversInGraph
                                            ? "Compare all drivers"
                                            : "Single driver view"}
                                    </Typography>
                                }
                            />
                        </Box>
                    )}

                    {/* Content */}
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                        {!showStats ? (
                            <LiveTiming />
                        ) : (
                            <StatView showAllDriversInGraph={showAllDriversInGraph} />
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

// Hauptkomponente mit DataProvider
const RunDetailPage = () => {
    return (
        <DataProvider>
            <RunContent />
        </DataProvider>
    );
};

export default RunDetailPage;