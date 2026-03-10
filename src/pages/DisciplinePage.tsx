import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Chip,
    Paper,
    CircularProgress
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { CTM_Colors } from "../Helper";
import pb from "../api/pocketbase";

interface Run {
    id: string;
    name: string;
    discipline: string;
    date: string;
    description?: string;
    logFile?: string;
    trackName?: string;
    status?: string;
}

const DisciplinePage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newRun, setNewRun] = useState({
        name: "",
        discipline: name || "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        trackName: "",
        status: "planned"
    });

    useEffect(() => {
        loadRuns();
    }, [name]);


    const loadRuns = async () => {
        try {
            setLoading(true);
            const records = await pb.collection("runs").getFullList({
                filter: `discipline = "${name}"`,
                sort: "-date"
            });
            setRuns(records as any);
        } catch (err) {
            console.error("Error loading runs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRun = async () => {
        try {
            const record = await pb.collection("runs").create({
                ...newRun,
                status: "planned"
            });

            setRuns(prev => [record as any, ...prev]);
            setOpenDialog(false);
            setNewRun({
                name: "",
                discipline: name || "",
                date: new Date().toISOString().split('T')[0],
                description: "",
                trackName: "",
                status: "planned"
            });
        } catch (err) {
            console.error("Error creating run:", err);
            alert("Failed to create run");
        }
    };

    const handleDeleteRun = async (runId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Verhindert Navigation

        if (window.confirm("Are you sure you want to delete this run?")) {
            try {
                await pb.collection("runs").delete(runId);
                setRuns(prev => prev.filter(run => run.id !== runId));
            } catch (err) {
                console.error("Error deleting run:", err);
                alert("Failed to delete run");
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case "completed": return "#4CAF50";
            case "active": return "#FFC107";
            case "planned": return "#9E9E9E";
            default: return "#9E9E9E";
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: CTM_Colors.ctm_green }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{
                fontWeight: 'bold',
                color: CTM_Colors.black,
                textTransform: 'uppercase'
            }}>
                {name} – Runs
            </Typography>

            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{
                    mt: 2,
                    mb: 3,
                    backgroundColor: CTM_Colors.ctm_green,
                    color: CTM_Colors.black,
                    '&:hover': { backgroundColor: CTM_Colors.grey }
                }}
            >
                New Run
            </Button>

            {runs.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                    <Typography variant="body1" color="textSecondary">
                        No runs yet. Click "New Run" to create your first run!
                    </Typography>
                </Paper>
            ) : (
                <List>
                    {runs.map((run) => (
                        <ListItem
                            key={run.id}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    onClick={(e) => handleDeleteRun(run.id, e)}
                                    sx={{ color: '#ff4444' }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                            sx={{ mb: 1 }}
                        >
                            <ListItemButton
                                onClick={() => navigate(`/run/${run.id}`)}
                                sx={{
                                    border: `1px solid ${CTM_Colors.ctm_green}`,
                                    borderRadius: 1,
                                    backgroundColor: 'white',
                                    '&:hover': {
                                        backgroundColor: `${CTM_Colors.ctm_green}10`,
                                    },
                                    mr: 5 // Platz für den Delete Button
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="h6" sx={{ color: CTM_Colors.ctm_green }}>
                                                {run.name}
                                            </Typography>
                                            <Chip
                                                label={run.status || 'planned'}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(run.status || 'planned'),
                                                    color: 'white',
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                 {new Date(run.date).toLocaleDateString('de-DE')}
                                            </Typography>
                                            {run.trackName && (
                                                <Typography variant="body2" color="textSecondary">
                                                     Track: {run.trackName}
                                                </Typography>
                                            )}
                                            {run.description && (
                                                <Typography variant="body2" color="textSecondary">
                                                     {run.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Dialog für neuen Run */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    backgroundColor: CTM_Colors.ctm_green,
                    color: CTM_Colors.black,
                    fontWeight: 'bold'
                }}>
                    Create New Run
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Run Name"
                        value={newRun.name}
                        onChange={(e) => setNewRun({ ...newRun, name: e.target.value })}
                        sx={{ mb: 2 }}
                        required
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        label="Date"
                        type="date"
                        value={newRun.date}
                        onChange={(e) => setNewRun({ ...newRun, date: e.target.value })}
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        label="Track Name (optional)"
                        value={newRun.trackName}
                        onChange={(e) => setNewRun({ ...newRun, trackName: e.target.value })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={newRun.description}
                        onChange={(e) => setNewRun({ ...newRun, description: e.target.value })}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="caption" color="textSecondary">
                        Discipline: <strong>{name}</strong>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateRun}
                        variant="contained"
                        disabled={!newRun.name.trim()}
                        sx={{
                            backgroundColor: CTM_Colors.ctm_green,
                            color: CTM_Colors.black,
                            '&:hover': { backgroundColor: CTM_Colors.grey }
                        }}
                    >
                        Create Run
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DisciplinePage;