import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    LinearProgress
} from "@mui/material";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import Leaderboard from "./Leaderboard";

interface Driver {
    id: string;
    name: string;
    color: string;
}

interface LapData {
    id: string;
    driver: string;
    lapTime: string;
    cones: number;
    timeStamp: string;
    sectors?: string[];
    expand?: {
        driver?: Driver;
    };
}

interface DriverStat {
    driverId: string;
    name: string;
    color: string;
    lapCount: number;
    bestTime: number;
    avgTime: number;
    totalCones: number;
}

interface StatViewProps {
    showAllDriversInGraph?: boolean;
}

const StatView: React.FC<StatViewProps> = ({ showAllDriversInGraph = false }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");
    const [driverStats, setDriverStats] = useState<DriverStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [allLaps, setAllLaps] = useState<LapData[]>([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [driverRecords, lapRecords] = await Promise.all([
                pb.collection("drivers").getFullList(),
                pb.collection("laps").getFullList({ expand: "driver", sort: "timeStamp" })
            ]);

            setDrivers(driverRecords as any);

            if (driverRecords.length > 0) {
                setSelectedDriverId(driverRecords[0].id);
            }
            setAllLaps(lapRecords as any);

            calculateStats(lapRecords as any, driverRecords as any);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (laps: LapData[], drivers: Driver[]) => {
        const stats: DriverStat[] = [];

        drivers.forEach(driver => {
            const driverLaps = laps.filter(lap => lap.driver === driver.id);

            if (driverLaps.length === 0) {
                stats.push({
                    driverId: driver.id,
                    name: driver.name,
                    color: driver.color,
                    lapCount: 0,
                    bestTime: 0,
                    avgTime: 0,
                    totalCones: 0
                });
                return;
            }

            const lapTimes = driverLaps.map(lap => parseFloat(lap.lapTime));
            const bestTime = Math.min(...lapTimes);
            const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
            const totalCones = driverLaps.reduce((sum, lap) => sum + (lap.cones || 0), 0);

            stats.push({
                driverId: driver.id,
                name: driver.name,
                color: driver.color,
                lapCount: driverLaps.length,
                bestTime,
                avgTime,
                totalCones
            });
        });

        setDriverStats(stats);
    };

    const getSelectedDriverLaps = () => {
        return driverStats.find(stats => stats.driverId === selectedDriverId);
    };

    // Daten für Single Driver Graph
    const getSingleDriverChartData = () => {
        if (!selectedDriverId) return [];

        const driverLaps = allLaps
            .filter(lap => lap.driver === selectedDriverId)
            .sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime());

        return driverLaps.map((lap, index) => ({
            lap: index + 1,
            time: parseFloat(lap.lapTime),
            cones: lap.cones || 0,
            date: new Date(lap.timeStamp).toLocaleTimeString()
        }));
    };

    // Daten für All Drivers Graph (NEU)
    const getAllDriversChartData = () => {
        if (drivers.length === 0) return [];

        // Für jeden Fahrer die Runden sammeln
        const allDriverData = drivers.map(driver => {
            const driverLaps = allLaps
                .filter(lap => lap.driver === driver.id)
                .sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime())
                .map((lap, index) => ({
                    lap: index + 1,
                    time: parseFloat(lap.lapTime),
                    driverName: driver.name,
                    driverColor: driver.color
                }));

            return driverLaps;
        });

        // Finde maximale Rundenanzahl
        const maxLaps = Math.max(...allDriverData.map(d => d.length));

        // Kombiniere alle Daten
        const combinedData = [];
        for (let lapNum = 1; lapNum <= maxLaps; lapNum++) {
            const lapData: any = { lap: lapNum };

            drivers.forEach(driver => {
                const driverData = allDriverData.find(d => d[0]?.driverName === driver.name);
                const lap = driverData?.find(d => d.lap === lapNum);

                if (lap) {
                    lapData[driver.name] = lap.time;
                }
            });

            combinedData.push(lapData);
        }

        return combinedData;
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2 }}>Loading statistics...</Typography>
            </Box>
        );
    }

    const selectedDriver = getSelectedDriverLaps();
    const singleChartData = getSingleDriverChartData();
    const allChartData = getAllDriversChartData();

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color={CTM_Colors.black}>
                    Driver Statistics
                </Typography>
            </Box>

            {/* Driver Selection (nur im Single Mode anzeigen) */}
            {!showAllDriversInGraph && (
                <Box sx={{ mb: 4 }}>
                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel>Select Driver for Details</InputLabel>
                        <Select
                            value={selectedDriverId}
                            label="Select Driver for Details"
                            onChange={(e) => setSelectedDriverId(e.target.value)}
                        >
                            {drivers.map((driver) => (
                                <MenuItem key={driver.id} value={driver.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: driver.color,
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography>{driver.name}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Info Text über den Graph */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color={CTM_Colors.ctm_green}>
                    {showAllDriversInGraph
                        ? "Showing all drivers comparison"
                        : `Showing ${selectedDriver?.name || "selected driver"}`
                    }
                </Typography>
            </Box>

            {selectedDriver && !showAllDriversInGraph && (
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    mb: 4,
                    '& > *': {
                        flex: '1 1 200px',
                        minWidth: '200px'
                    }
                }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Laps
                            </Typography>
                            <Typography variant="h4" color={selectedDriver.color}>
                                {selectedDriver.lapCount}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Best Lap Time
                            </Typography>
                            <Typography variant="h4" color={selectedDriver.color}>
                                {selectedDriver.bestTime.toFixed(3)}s
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Time
                            </Typography>
                            <Typography variant="h4" color={selectedDriver.color}>
                                {selectedDriver.avgTime.toFixed(3)}s
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Cones
                            </Typography>
                            <Typography variant="h4" color={selectedDriver.color}>
                                {selectedDriver.totalCones}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Graph Section */}
            {((showAllDriversInGraph && allChartData.length > 0) || (!showAllDriversInGraph && singleChartData.length > 0)) && (
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
                        {showAllDriversInGraph ? "All Drivers Lap Times" : "Lap Time Progression"}
                    </Typography>
                    <Card>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={showAllDriversInGraph ? allChartData : singleChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="lap"
                                        label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                                    />
                                    <YAxis
                                        label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (showAllDriversInGraph) {
                                                return [`${value}s`, name];
                                            }
                                            return [`${value}s`, 'Lap Time'];
                                        }}
                                        labelFormatter={(label) => `Lap ${label}`}
                                    />
                                    <Legend />

                                    {showAllDriversInGraph ? (
                                        // Alle Fahrer als separate Linien
                                        drivers.map(driver => (
                                            <Line
                                                key={driver.id}
                                                type="monotone"
                                                dataKey={driver.name}
                                                stroke={driver.color}
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name={driver.name}
                                            />
                                        ))
                                    ) : (
                                        // Nur ausgewählter Fahrer
                                        <Line
                                            type="monotone"
                                            dataKey="time"
                                            stroke={selectedDriver?.color || "#8884d8"}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Lap Time"
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    All Drivers Overview
                </Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell><strong>Driver</strong></TableCell>
                                <TableCell align="right"><strong>Laps</strong></TableCell>
                                <TableCell align="right"><strong>Best Time</strong></TableCell>
                                <TableCell align="right"><strong>Average</strong></TableCell>
                                <TableCell align="right"><strong>Cones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {driverStats.map((driver) => (
                                <TableRow
                                    key={driver.driverId}
                                    onClick={() => setSelectedDriverId(driver.driverId)}
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: driver.driverId === selectedDriverId ?
                                            `${driver.color}20` : 'transparent',
                                        '&:hover': {
                                            backgroundColor: `${driver.color}10`
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: driver.color,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <Typography>{driver.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography>{driver.lapCount}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography color={driver.color} fontWeight="bold">
                                            {driver.bestTime > 0 ? `${driver.bestTime.toFixed(3)}s` : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography>
                                            {driver.avgTime > 0 ? `${driver.avgTime.toFixed(3)}s` : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography>{driver.totalCones}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Box sx={{ mt: 4 }}>
                <Leaderboard />
            </Box>
        </Box>
    );
};

export default StatView;