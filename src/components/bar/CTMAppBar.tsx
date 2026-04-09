import { AppBar, Button, Switch, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { CTM_Colors } from "../../Helper";


const switch_xs = {
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: CTM_Colors.dark_grey,
        '&:hover': {
            backgroundColor: 'rgba(128, 128, 128, 0.08)',
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
        backgroundColor: CTM_Colors.dark_grey,
    },
};

interface CTM_AppBarProps {
    isDarkmode: boolean;
    onThemeChange: (arg0: boolean) => void
    logoutHandler: () => void
}

const CTMAppBar: React.FC<CTM_AppBarProps> = ({ isDarkmode, onThemeChange, logoutHandler }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate("/");
    }
    return (
        <AppBar position="sticky" style={{ backgroundColor: CTM_Colors.ctm_green, color: 'black', backgroundImage: "none" }}>
            <Toolbar>
                <img
                    src="/img.png"
                    alt="CTM Logo"
                    style={{
                        height: '40px',
                        marginRight: '20px'
                    }}
                    onClick={handleClick}
                />
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                    CTM Live Timing
                </Typography>
                <Switch checked={isDarkmode} sx={switch_xs} onChange={(event) => onThemeChange(event.target.checked)} />
                <Button
                    variant="contained"
                    onClick={logoutHandler}
                    sx={{
                        boxShadow: 'none',
                        backgroundColor: CTM_Colors.ctm_green,
                        color: 'black',
                        '&:hover': {
                            backgroundColor: '#6AA963'
                        }
                    }}
                >
                    Logout
                </Button>

                <Button
                    color="inherit"
                    onClick={() => navigate('/live-data')}
                >
                    Live Data
                </Button>

            </Toolbar>
        </AppBar>
    )
}

export default CTMAppBar;