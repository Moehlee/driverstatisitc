import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    LinearProgress
} from "@mui/material";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface Driver {
    id: string;
    name: string;
    color: string;
}

interface LapData {
    id: string;
    driver: string;
    lapTime: string;
    discipline: string;
}

const SpiderChart: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const disciplines = ["Acceleration", "Skidpad", "Endurance", "Efficiency"];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Lade alle Fahrer
            const driverRecords = await pb.collection("drivers").getFullList() as Driver[];
            setDrivers(driverRecords);

            // Lade alle Runden
            const lapRecords = await pb.collection("laps").getFullList() as LapData[];

            // Für jeden Fahrer die beste Zeit pro Disziplin finden
            const driverPerformances = driverRecords.map(driver => {
                const driverLaps = lapRecords.filter(lap => lap.driver === driver.id);

                // Daten für RadarChart: Jede Disziplin bekommt einen Wert
                const performance: any = {
                    name: driver.name,
                    color: driver.color
                };

                // Für jede Disziplin die beste Zeit holen
                disciplines.forEach(discipline => {
                    const disciplineLaps = driverLaps
                        .filter(lap => lap.discipline === discipline)
                        .map(lap => parseFloat(lap.lapTime));

                    if (disciplineLaps.length > 0) {
                        // Beste Zeit für diese Disziplin
                        const bestTime = Math.min(...disciplineLaps);
                        // Normalisieren: Je kleiner die Zeit, desto besser
                        // 100% = beste Zeit, 0% = schlechteste
                        performance[discipline] = 100; // Placeholder, wird später normalisiert
                        performance[`${discipline}_raw`] = bestTime;
                    } else {
                        performance[discipline] = 0;
                        performance[`${discipline}_raw`] = null;
                    }
                });

                return performance;
            });

            // Normalisiere die Werte (beste Zeit = 100%)
            disciplines.forEach(discipline => {
                // Finde die beste Zeit aller Fahrer für diese Disziplin
                const allTimes = driverPerformances
                    .map(p => p[`${discipline}_raw`])
                    .filter(t => t !== null) as number[];

                if (allTimes.length > 0) {
                    const bestOverallTime = Math.min(...allTimes);

                    // Setze normalisierte Werte (beste Zeit = 100, andere relativ dazu)
                    driverPerformances.forEach(p => {
                        if (p[`${discipline}_raw`]) {
                            p[discipline] = Math.round((bestOverallTime / p[`${discipline}_raw`]) * 100);
                        }
                    });
                }
            });

            setChartData(driverPerformances);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <LinearProgress />
                    <Typography sx={{ mt: 2 }}>Loading...</Typography>
                </CardContent>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography>No data available</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Who's good at what?
                </Typography>

                <ResponsiveContainer width="100%" height={500}>
                    <RadarChart data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis
                            dataKey="name"
                            tick={{ fill: '#666', fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: '#999' }}
                        />
                        <Tooltip
                            formatter={(value: any, name: string) => {
                                const driver = chartData.find(d => d.name === name);
                                if (driver) {
                                    const rawValue = driver[`${value}raw`];
                                    return rawValue ? [`${rawValue}s`, name] : ['No data', name];
                                }
                                return [`${value}%`, name];
                            }}
                        />
                        <Legend />

                        {/* Für jede Disziplin einen Radar */}
                        {disciplines.map((discipline, index) => {
                            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];
                            return (
                                <Radar
                                    key={discipline}
                                    name={discipline}
                                    dataKey={discipline}
                                    stroke={colors[index % colors.length]}
                                    fill={colors[index % colors.length]}
                                    fillOpacity={0.2}
                                />
                            );
                        })}
                    </RadarChart>
                </ResponsiveContainer>

                {/* Einfache Erklärung */}
                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {disciplines.map((discipline, index) => {
                        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];
                        // Finde den besten Fahrer in dieser Disziplin
                        const bestDriver = [...chartData]
                            .filter(d => d[discipline] > 0)
                            .sort((a, b) => b[discipline] - a[discipline])[0];

                        return (
                            <Box
                                key={discipline}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    borderLeft: `3px solid ${colors[index % colors.length]}`,
                                    bgcolor: '#f8f9fa',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    {discipline}:
                                </Typography>
                                {bestDriver ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 10, height: 10, bgcolor: bestDriver.color, borderRadius: '50%' }} />
                                        <Typography variant="body2" sx={{ color: bestDriver.color }}>
                                            {bestDriver.name}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No data
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </CardContent>
        </Card>
    );
};

export default SpiderChart;