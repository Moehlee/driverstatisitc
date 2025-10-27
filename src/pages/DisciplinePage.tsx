import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from "@mui/material";

const mockRuns = [
    { id: "1", name: "Run 1", date: "2025-10-10" },
    { id: "2", name: "Run 2", date: "2025-10-11" },
];

const DisciplinePage = () => {
    const { name } = useParams();
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4">{name?.toUpperCase()} – Runs</Typography>

            <Button
                variant="contained"
                sx={{ mt: 2, mb: 3 }}
                onClick={() => alert("Neuen Run starten (später implementieren)")}
            >Neuen Run starten
            </Button>

            <List>
                {mockRuns.map((run) => (
                    <ListItem key={run.id} disablePadding>
                        <ListItemButton onClick={() => navigate(`/run/${run.id}`)}>
                            <ListItemText primary={run.name} secondary={run.date} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default DisciplinePage;
