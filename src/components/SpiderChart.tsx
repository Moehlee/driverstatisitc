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
    ResponsiveContainer
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
    cones: number;
}

const SpiderChart: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [driverData, setDriverData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Lade alle Fahrer
            const driverRecords = await pb.collection("drivers").getFullList();
            setDrivers(driverRecords as any);

            // Lade alle Runden
            const lapRecords = await pb.collection("laps").getFullList();

            // Berechne für jeden Fahrer die Metriken
            const data = driverRecords.map((driver: any) => {
                const driverLaps = lapRecords.filter((lap: any) => lap.driver === driver.id);

                if (driverLaps.length === 0) {
                    return {
                        name: driver.name,
                        color: driver.color,
                        Speed: 0,
                        Consistency: 0,
                        'Clean Laps': 0
                    };
                }

                // Durchschnittliche Rundenzeit
                const lapTimes = driverLaps.map((lap: any) => parseFloat(lap.lapTime));
                const avgTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;

                // Speed Score (je kleiner die Zeit, desto besser)
                const fastestTime = Math.min(...lapTimes);
                const speedScore = Math.round((fastestTime / avgTime) * 100);

                // Consistency (Standardabweichung)
                const variance = lapTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / lapTimes.length;
                const stdDev = Math.sqrt(variance);
                const consistencyScore = Math.round(100 - (stdDev * 10));

                // Clean Laps
                const cleanLaps = driverLaps.filter((lap: any) => !lap.cones || lap.cones === 0).length;
                const cleanScore = Math.round((cleanLaps / driverLaps.length) * 100);

                return {
                    name: driver.name,
                    color: driver.color,
                    Speed: Math.min(100, speedScore),
                    Consistency: Math.min(100, consistencyScore),
                    'Clean Laps': cleanScore
                };
            });

            setDriverData(data);
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
                    <Typography sx={{ mt: 2 }}>Loading driver data...</Typography>
                </CardContent>
            </Card>
        );
    }

    if (drivers.length === 0) {
        return (
            <Card>
                <CardContent>
                    <Typography>No drivers found. Add drivers first.</Typography>
                </CardContent>
            </Card>
        );
    }

    // @ts-ignore
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                     Driver Performance Overview
                </Typography>

                {/* Spider Chart */}
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={driverData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#999' }} />
                        <Tooltip
                            formatter={(value: any) => [`${value}%`, 'Score']}
                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8 }}
                        />

                        {/* Speed Radar */}
                        <Radar
                            name="Speed"
                            dataKey="Speed"
                            stroke="#FF6B6B"
                            fill="#FF6B6B"
                            fillOpacity={0.3}
                        />

                        {/* Consistency Radar */}
                        <Radar
                            name="Consistency"
                            dataKey="Consistency"
                            stroke="#4ECDC4"
                            fill="#4ECDC4"
                            fillOpacity={0.3}
                        />

                        {/* Clean Laps Radar */}
                        <Radar
                            name="Clean Laps"
                            dataKey="Clean Laps"
                            stroke="#45B7D1"
                            fill="#45B7D1"
                            fillOpacity={0.3}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Einfache Legende */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#FF6B6B', borderRadius: 1 }} />
                        <Typography>Speed</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#4ECDC4', borderRadius: 1 }} />
                        <Typography>Consistency</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#45B7D1', borderRadius: 1 }} />
                        <Typography>Clean Laps</Typography>
                    </Box>
                </Box>

                {/* Einfache Tabelle */}
                <Box sx={{ mt: 4, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Driver</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Speed</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Consistency</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Clean</th>
                        </tr>
                        </thead>
                        <tbody>
                        {driverData.map((driver) => (
                            <tr key={driver.name} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, backgroundColor: driver.color, borderRadius: '50%' }} />
                                        {driver.name}
                                    </Box>
                                </td>
                                <td align="center">{driver.Speed}%</td>
                                <td align="center">{driver.Consistency}%</td>
                                <td align="center">{driver['Clean Laps']}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SpiderChart;