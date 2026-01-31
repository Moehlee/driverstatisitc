import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress
} from "@mui/material";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

interface LeaderboardEntry {
    position: number;
    driverId: string;
    driverName: string;
    driverColor: string;
    bestTime: number;
    lapId: string;
    timeStamp: string;
    cones?: number;
}

interface Driver {
    id: string;
    name: string;
    color: string;
}

interface LapRecord {
    id: string;
    driver: string;
    lapTime: string;
    timeStamp: string;
    cones: number;
    expand?: {
        driver?: Driver;
    };
}

const Leaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);

            // Hole alle Runden mit expand driver
            const laps: LapRecord[] = await pb.collection("laps").getFullList({
                expand: "driver",
                sort: "lapTime"
            });

            // Gruppiere nach Fahrer und finde beste Runde jedes Fahrers
            const driverBestLaps = new Map<string, LapRecord>();

            laps.forEach(lap => {
                const currentBest = driverBestLaps.get(lap.driver);
                const lapTime = parseFloat(lap.lapTime);

                if (!currentBest || lapTime < parseFloat(currentBest.lapTime)) {
                    driverBestLaps.set(lap.driver, lap);
                }
            });

            // Konvertiere zu Leaderboard Array
            const leaderboardData: LeaderboardEntry[] = Array.from(driverBestLaps.entries())
                .map(([driverId, lap], index) => {
                    const driver = lap.expand?.driver;

                    return {
                        position: index + 1,
                        driverId,
                        driverName: driver?.name || "Unknown Driver",
                        driverColor: driver?.color || "#999999",
                        bestTime: parseFloat(lap.lapTime),
                        lapId: lap.id,
                        timeStamp: lap.timeStamp,
                        cones: lap.cones
                    };
                })
                .sort((a, b) => a.bestTime - b.bestTime) // Sortiere nach Bestzeit
                .map((entry, index) => ({
                    ...entry,
                    position: index + 1 // Positionen neu zuweisen nach Sortierung
                }));

            setLeaderboard(leaderboardData);
        } catch (err) {
            console.error("Error loading leaderboard:", err);
            setError("Failed to load leaderboard data");
        } finally {
            setLoading(false);
        }
    };

    const getPositionColor = (position: number) => {
        switch(position) {
            case 1: return '#FFD700'; // Gold
            case 2: return '#C0C0C0'; // Silver
            case 3: return '#CD7F32'; // Bronze
            default: return CTM_Colors.ctm_green;
        }
    };

    const getPositionEmoji = (position: number) => {
        switch(position) {
            case 1: return '1';
            case 2: return '2';
            case 3: return '3';
            default: return position.toString();
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress sx={{ color: CTM_Colors.ctm_green }} />
                <Typography sx={{ mt: 2 }}>Loading leaderboard...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>No lap times recorded yet.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{
                color: CTM_Colors.black,
                fontWeight: 'bold',
                textAlign: 'center',
                mb: 3
            }}>
                Current Leaderboard
            </Typography>

            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: CTM_Colors.ctm_green,
                            '& th': {
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }
                        }}>
                            <TableCell>Pos</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell align="right">Best Time</TableCell>
                            <TableCell align="center">Cones</TableCell>
                            <TableCell align="right">Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaderboard.map((entry) => (
                            <TableRow
                                key={entry.driverId}
                                sx={{
                                    '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                                    '&:hover': { backgroundColor: '#f0f0f0' },
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={getPositionEmoji(entry.position)}
                                            size="small"
                                            sx={{
                                                backgroundColor: getPositionColor(entry.position),
                                                color: entry.position <= 3 ? 'white' : CTM_Colors.black,
                                                fontWeight: 'bold',
                                                fontSize: entry.position <= 3 ? '1.1rem' : '0.875rem',
                                                minWidth: 40,
                                                height: 32
                                            }}
                                        />
                                        {entry.position > 3 && (
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {entry.position}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            backgroundColor: entry.driverColor,
                                            borderRadius: '50%',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                        <Typography fontWeight="bold">
                                            {entry.driverName}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                        color={entry.driverColor}
                                        sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    >
                                        {entry.bestTime.toFixed(3)}s
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {entry.cones && entry.cones > 0 ? (
                                        <Chip
                                            label={`+${entry.cones}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: '#ff4444',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">
                                            Clean
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="textSecondary">
                                        {new Date(entry.timeStamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Refresh Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={loadLeaderboard}
                    style={{
                        backgroundColor: CTM_Colors.ctm_green,
                        color: CTM_Colors.black,
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(28, 150, 0, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = CTM_Colors.grey}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = CTM_Colors.ctm_green}
                >
                    Refresh Leaderboard
                </button>
            </Box>

            {/* Stats Summary */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Leaderboard Stats
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <Typography variant="body2">
                        <strong>Total Drivers:</strong> {leaderboard.length}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Fastest:</strong> {leaderboard[0]?.bestTime.toFixed(3)}s
                    </Typography>
                    <Typography variant="body2">
                        <strong>Time Gap:</strong> {(leaderboard[leaderboard.length-1]?.bestTime - leaderboard[0]?.bestTime).toFixed(3)}s
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Leaderboard;