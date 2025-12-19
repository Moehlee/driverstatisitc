import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Modal,
    TextField
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

interface Driver {
    id: string;
    name: string;
    color: string;
}

interface LapRecord {
    id: string;
    driver: string; // Driver ID
    lapTime: string;
    cones: number;
    timeStamp: string;
    sectors?: string[];
    sectorCount?: number;
    expand?: {
        driver?: Driver;
    };
}

interface LocalLap {
    time: number;
    timeStamp: number;
    sectors?: number[];
    sectorCount?: number;
}

const LiveTiming: React.FC = () => {
    const [laps, setLaps] = useState<LapRecord[]>([]);
    const [localLaps, setLocalLaps] = useState<LocalLap[]>([]);
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");
    const [openDriverModal, setOpenDriverModal] = useState(false);
    const [newDriverName, setNewDriverName] = useState("");
    const [newDriverColor, setNewDriverColor] = useState("#6bb5ff");

    // Farbpalette für Driver
    const colorPalette = [
        "#6bb5ff", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
        "#FF6B6B", "#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#073B4C"
    ];

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                const records = await pb.collection("drivers").getFullList();
                setDrivers(records as any);
                if (records.length > 0 && !selectedDriverId) {
                    setSelectedDriverId(records[0].id);
                    localStorage.setItem("selectedDriverId", records[0].id);
                }
            } catch (err) {
                console.error("Error loading drivers:", err);
            }
        };

        const loadLaps = async () => {
            try {
                const records = await pb.collection("laps").getFullList(50, {
                    sort: "-created",
                    expand: "driver",

                });
                setLaps(records as any);
            } catch (err) {
                console.error("Error loading laps:", err);
                toast.error("Failed to load laps");
            } finally {
                setLoading(false);
            }
        };

        loadDrivers();
        loadLaps();

        // Live updates
        const unsub = pb.collection("laps").subscribe("*", (e) => {
            console.log("Live update:", e);
            toast.info(`Update: ${e.action}`);
            loadLaps();
        });

        const timer = setInterval(() => {
            const t = localStorage.getItem("latestLap");
            const ts = localStorage.getItem("lapTimeStamp");
            const sectorTimesStr = localStorage.getItem("sectorTimes");
            const sectorCountStr = localStorage.getItem("sectorCount");

            if (t !== null && ts !== null) {
                const newLap: LocalLap = {
                    time: Number(t),
                    timeStamp: Number(ts)
                };

                // Sektorzeiten hinzufügen falls vorhanden
                if (sectorTimesStr) {
                    try {
                        newLap.sectors = JSON.parse(sectorTimesStr);
                    } catch (e) {
                        console.error("Error parsing sector times:", e);
                    }
                }

                if (sectorCountStr) {
                    try {
                        newLap.sectorCount = JSON.parse(sectorCountStr);
                    } catch (e) {
                        console.error("Error parsing sector count:", e);
                    }
                }

                setLocalLaps(prev => [
                    ...prev,
                    newLap
                ]);

                localStorage.removeItem("latestLap");
                localStorage.removeItem("lapTimeStamp");
                localStorage.removeItem("sectorTimes");
                localStorage.removeItem("sectorCount");
            }
        }, 500);

        return () => {
            clearInterval(timer);
            pb.collection("laps").unsubscribe("*");
        };
    }, []);

    const handleCreateDriver = async () => {
        if (!newDriverName.trim()) {
            toast.error("Driver name is required");
            return;
        }

        try {
            const data = {
                name: newDriverName,
                color: newDriverColor
            };

            const record = await pb.collection("drivers").create(data);
            toast.success(`Driver "${newDriverName}" created!`);

            // Update drivers list
            setDrivers(prev => [...prev, record as any]);
            setSelectedDriverId(record.id);
            localStorage.setItem("selectedDriverId", record.id);

            // Reset form
            setNewDriverName("");
            setNewDriverColor(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
            setOpenDriverModal(false);
        } catch (err) {
            console.error("Error creating driver:", err);
            toast.error("Failed to create driver");
        }
    };

    if (loading) {
        return (
            <Typography color={CTM_Colors.white}>Loading laps...</Typography>
        );
    }

    const sectorColors = ["#6bb5ff", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

    //  Local Laps nach Zeit schnellste
    const sortedLocalLaps = [...localLaps]
        .filter(lap => lap.time > 0) // Nur gültige Runden
        .sort((a, b) => a.time - b.time); // Aufsteigend

    // Finde die schnellste Runde
    const fastestLapTime = sortedLocalLaps.length > 0
        ? sortedLocalLaps[0].time
        : null;

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{
                minHeight: "100vh",
                color: CTM_Colors.black,
                padding: 3,
            }}>

            {/* Driver Selection */}
            <Box sx={{ width: "80%", mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Select Driver</InputLabel>
                    <Select
                        value={selectedDriverId}
                        label="Select Driver"
                        onChange={(e) => {
                            setSelectedDriverId(e.target.value);
                            localStorage.setItem("selectedDriverId", e.target.value);
                            toast.success(`Driver selected: ${drivers.find(d => d.id === e.target.value)?.name}`);
                        }}
                    >
                        {drivers.map((driver) => (
                            <MenuItem key={driver.id} value={driver.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            backgroundColor: driver.color,
                                            borderRadius: '50%'
                                        }}
                                    />
                                    {driver.name}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    onClick={() => setOpenDriverModal(true)}
                    sx={{
                        borderColor: CTM_Colors.ctm_green,
                        color: CTM_Colors.ctm_green,
                        '&:hover': {
                            borderColor: CTM_Colors.grey,
                            backgroundColor: 'rgba(28, 150, 0, 0.1)'
                        }
                    }}
                >
                    + New Driver
                </Button>

                <Box sx={{ ml: 'auto' }}>
                    <Typography variant="body2">
                        Selected: <span style={{ fontWeight: 'bold', color: drivers.find(d => d.id === selectedDriverId)?.color }}>
                            {drivers.find(d => d.id === selectedDriverId)?.name || "No driver selected"}
                        </span>
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    border: 1,
                    borderColor: CTM_Colors.ctm_green,
                    borderRadius: 1,
                    width: "80%",
                    padding: 2,
                    mb: 3,
                }}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                    Server Lap Times
                </Typography>
                {laps.length === 0 ? (
                    <Typography textAlign="center">No laps recorded yet</Typography>
                ) : (
                    laps.map((lap) => {
                        const driver = lap.expand?.driver || drivers.find(d => d.id === lap.driver);
                        return (
                            <Box key={lap.id}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 1,
                                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                    }}>
                                    <Typography fontWeight="bold" sx={{ color: driver?.color }}>
                                        {driver?.name || "Unknown Driver"}
                                    </Typography>
                                    <Typography fontWeight="bold">{lap.lapTime}s</Typography>
                                    <Typography>Cones: {lap.cones}</Typography>
                                    {lap.sectorCount && (

                                        <Typography variant="body2">
                                            Sectors: {lap.sectorCount}
                                        </Typography>
                                    )}
                                    <Typography variant="body2">
                                        {new Date(lap.timeStamp).toLocaleTimeString()}
                                    </Typography>
                                </Box>

                                {lap.sectors && lap.sectors.length > 0 && (
                                    <Box sx={{

                                        padding: 1,
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                            Sectortimes:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {lap.sectors.map((sectorTime, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '2px 8px',
                                                        backgroundColor: sectorColors[index % sectorColors.length],
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    S{index + 1}: {sectorTime}s
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>

            {/* Local Lap Times  */}
            <Box
                sx={{
                    border: 1,
                    borderColor: "red",
                    borderRadius: 1,
                    width: "80%",
                    padding: 2,
                    mb: 3,
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="h6">
                        Local Lap Times
                    </Typography>
                    {fastestLapTime && (
                        <Typography variant="body2" sx={{ color: '#800080', fontWeight: 'bold' }}>
                            Fastest: {(fastestLapTime / 1000).toFixed(3)}s
                        </Typography>
                    )}
                </Box>

                {sortedLocalLaps.length === 0 ? (
                    <Typography textAlign="center">No local laps yet</Typography>
                ) : (
                    sortedLocalLaps.map((lap, i) => {
                        const selectedDriver = drivers.find(d => d.id === selectedDriverId);
                        const isFastest = fastestLapTime && lap.time === fastestLapTime;

                        return (
                            <Box key={i}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: 1,
                                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                                        backgroundColor: isFastest
                                            ? 'rgba(128, 0, 128, 0.2)' // Lila/Purple für schnellste Runde
                                            : i % 2 === 0
                                                ? 'rgba(255,0,0,0.05)'
                                                : 'rgba(255,0,0,0.02)',
                                        borderLeft: isFastest ? '4px solid #800080' : 'none',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isFastest ? '#800080' : '#666',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {i + 1}
                                        </Box>
                                        <Typography fontWeight="bold" sx={{ color: selectedDriver?.color }}>
                                            {selectedDriver?.name || "Unkknown Driver"}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            fontWeight="bold"
                                            sx={{
                                                fontSize: isFastest ? '1.1rem' : '1rem',
                                                color: isFastest ? '#800080' : 'inherit'
                                            }}
                                        >
                                            {(lap.time / 1000).toFixed(3)}s
                                        </Typography>
                                        {isFastest && (
                                            <Box
                                                sx={{
                                                    backgroundColor: '#800080',
                                                    color: 'white',
                                                    padding: '0 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                FASTEST
                                            </Box>
                                        )}
                                    </Box>

                                    {lap.sectorCount && (
                                        <Typography variant="body2">
                                            Sectors: {lap.sectorCount}
                                        </Typography>
                                    )}
                                    <Typography variant="body2">
                                        {new Date(lap.timeStamp).toLocaleTimeString()}
                                    </Typography>
                                </Box>

                                {lap.sectors && lap.sectors.length > 0 && (
                                    <Box sx={{
                                        padding: 1,
                                        backgroundColor: isFastest
                                            ? 'rgba(128, 0, 128, 0.1)'
                                            : 'rgba(255,0,0,0.02)',
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    }}>
                                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                            Sectoritmes:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {lap.sectors.map((sectorTime, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '2px 8px',
                                                        backgroundColor: isFastest
                                                            ? '#800080' // Lila für schnellste Runde
                                                            : sectorColors[index % sectorColors.length],
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    S{index + 1}: {(sectorTime / 1000).toFixed(3)}s
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>

            <Button
                variant="contained"
                sx={{
                    mt: 3,
                    backgroundColor: CTM_Colors.ctm_green,
                    color: CTM_Colors.black,
                    "&:hover": { backgroundColor: CTM_Colors.grey }
                }}
                onClick={() => {
                    window.location.reload();
                    toast.success("Data refreshed");
                }}
            >
                Refresh
            </Button>

            {/* Driver Creation Modal */}
            <Modal
                open={openDriverModal}
                onClose={() => setOpenDriverModal(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Box
                    sx={{
                        backgroundColor: 'white',
                        padding: 3,
                        borderRadius: 2,
                        minWidth: 400,
                        maxWidth: 500
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Create New Driver
                    </Typography>
                    <TextField
                        fullWidth
                        label="Driver Name"
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        sx={{ mb: 3 }}
                        autoFocus
                    />
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Select Color:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {colorPalette.map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setNewDriverColor(color)}
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border: newDriverColor === color ? '3px solid #333' : '1px solid #ccc',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: newDriverColor,
                                    borderRadius: '50%'
                                }}
                            />
                            <Typography variant="body2">
                                Selected: <span style={{ color: newDriverColor, fontWeight: 'bold' }}>{newDriverColor}</span>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={() => setOpenDriverModal(false)}
                            sx={{ color: CTM_Colors.black }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateDriver}
                            sx={{
                                backgroundColor: CTM_Colors.ctm_green,
                                color: CTM_Colors.black,
                                '&:hover': {
                                    backgroundColor: CTM_Colors.grey
                                }
                            }}
                        >
                            Create Driver
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Grid>
    );
};

export default LiveTiming;