import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Chip,
    CircularProgress
} from "@mui/material";
import { CTM_Colors } from "../Helper";

interface CANData {
    timestamp: number;
    values: Record<string, any>;
}

const LiveDataPage: React.FC = () => {
    const [wsConnected, setWsConnected] = useState(false);
    const [canData, setCanData] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // WebSocket Verbindung herstellen
        const wsUrl = "wss://ctm-vcw.meiki.me/";
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connected");
            setWsConnected(true);
            setError(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setCanData(data);
                setLastUpdate(new Date());
            } catch (err) {
                console.error("Error parsing data:", err);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setError("Connection error");
            setWsConnected(false);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setWsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <Box sx={{ p: 4, height: '100vh', overflow: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color={CTM_Colors.black}>
                    Live CAN Data
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Chip
                        label={wsConnected ? "CONNECTED" : "DISCONNECTED"}
                        sx={{
                            backgroundColor: wsConnected ? '#4CAF50' : '#f44336',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                    {lastUpdate && (
                        <Typography variant="body2" color="textSecondary">
                            Last update: {lastUpdate.toLocaleTimeString()}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Error Message */}
            {error && (
                <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            )}

            {/* Loading / No Data */}
            {!canData && wsConnected && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress sx={{ color: CTM_Colors.ctm_green }} />
                    <Typography sx={{ ml: 2 }}>Waiting for data...</Typography>
                </Box>
            )}

            {/* CAN Data Display */}
            {canData && (
                <>
                    {/* Raw Data Card */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ color: CTM_Colors.ctm_green }}>
                                Raw CAN Data
                            </Typography>
                            <Box sx={{
                                backgroundColor: '#f5f5f5',
                                padding: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: 400
                            }}>
                                <pre style={{ margin: 0, fontSize: '12px' }}>
                                    {JSON.stringify(canData, null, 2)}
                                </pre>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Extracted Values - ohne Grid, mit Flexbox */}
                    {canData.values && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ color: CTM_Colors.ctm_green }}>
                                    Signal Values
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                    mt: 2
                                }}>
                                    {Object.entries(canData.values).map(([key, value]: [string, any]) => (
                                        <Box key={key} sx={{
                                            flex: '1 1 auto',
                                            minWidth: { xs: '100%', sm: '200px', md: '250px' }
                                        }}>
                                            <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', height: '100%' }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    {key}
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {value?.value !== undefined && value?.value !== null
                                                        ? value.value
                                                        : 'No data'}
                                                </Typography>
                                                {value?.human_format && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {value.human_format}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* TIMEOUT Signals */}
                    {canData.values && Object.values(canData.values).some((v: any) => v?.value === null) && (
                        <Card sx={{ backgroundColor: '#fff3e0' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="warning">
                                    Signals with TIMEOUT
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Object.entries(canData.values)
                                        .filter(([_, v]: [string, any]) => v?.value === null)
                                        .map(([key]) => (
                                            <Chip
                                                key={key}
                                                label={key}
                                                size="small"
                                                sx={{ backgroundColor: '#ff9800', color: 'white' }}
                                            />
                                        ))}
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </Box>
    );
};

export default LiveDataPage;