import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Switch,
    FormControlLabel,
    ButtonGroup,
    Paper, MenuItem, FormControl, InputLabel, Select
} from "@mui/material";
import LiveMap from "../components/LiveMap";
import LiveTiming from "../components/LiveTiming";
import StatView from "../components/StatView";
import { CTM_Colors } from "../Helper";
import Leaderboard from "../components/Leaderboard";

const RunDetailPage = () => {
    const { id } = useParams();
    const [showStats, setShowStats] = useState(false);
    const [showAllDriversInGraph, setShowAllDriversInGraph] = useState(false);
    const [discipline, setDiscipline] = useState("Endurance");

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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Run {id}</Typography>

                {/* dropdown für Disziplin */}
                <FormControl sx={{ minWidth: 200 }}>
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
            </Box>

            {/* Layout */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 3,
                    height: "calc(100vh - 160px)",
                }}
            >
                {/* Map */}
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 3,
                        overflow: "hidden",
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

export default RunDetailPage;
