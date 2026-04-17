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
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CANData {
    timestamp: number;
    values: Record<string, any>;
}

const LiveDataPage: React.FC = () => {
    const [wsConnected, setWsConnected] = useState(false);
    const [canData, setCanData] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [timeoutExpanded, setTimeoutExpanded] = useState(false);

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

                            {/* Tabelle */}
                            <Box sx={{
                                maxHeight: 400,
                                overflow: 'auto',
                                border: '1px solid #e0e0e0',
                                borderRadius: 1
                            }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '13px'
                                }}>
                                    <thead>
                                    <tr style={{
                                        backgroundColor: CTM_Colors.ctm_green,
                                        color: 'white',
                                        position: 'sticky',
                                        top: 0
                                    }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Signal</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Value</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Unit</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {canData.values && Object.entries(canData.values).map(([key, value]: [string, any], index) => (
                                        <tr key={key} style={{
                                            backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{key}</td>
                                            <td style={{ padding: '8px' }}>
                                                {value?.value !== undefined && value?.value !== null
                                                    ? value.value
                                                    : '—'}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {value?.unit || '—'}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {value?.value === null ? (
                                                    <span style={{ color: '#ff9800', fontWeight: 'bold' }}>TIMEOUT</span>
                                                ) : (
                                                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>OK</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </Box>

                            {/* Zusammenfassung */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Total Signals: {canData.values ? Object.keys(canData.values).length : 0}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Timestamp: {canData.timestamp ? new Date(canData.timestamp).toLocaleTimeString() : '—'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* TIMEOUT Signals */}
                    {canData.values && Object.values(canData.values).some((v: any) => v?.value === null) && (
                        <Card sx={{ backgroundColor: '#fff3e0' }}>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setTimeoutExpanded(!timeoutExpanded)}
                                >
                                    <Typography variant="h6" sx={{ color: '#ff9800' }}>
                                         Signals with TIMEOUT
                                    </Typography>
                                    <IconButton size="small">
                                        {timeoutExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>

                                <Collapse in={timeoutExpanded}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
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
                                </Collapse>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </Box>
    );
};

export default LiveDataPage;