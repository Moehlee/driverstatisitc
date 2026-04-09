import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CTMAppBar from "./components/bar/CTMAppBar";
import { CTM_Colors } from "./Helper";
import pb from "./api/pocketbase";
import HomePage from "./pages/HomePage";
import DisciplinePage from "./pages/DisciplinePage";
import RunDetailPage from "./pages/RunDetailPage";
import GPSTrackViewer from "./components/GPSTrackViewer";
import LiveDataPage from "./pages/LiveDataPage";

const dark_theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: CTM_Colors.ctm_green,
        },
        background: {
            default: CTM_Colors.dark_grey, // dark grey background for darkmode
        },
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1e1e1e', // color for the dialog
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                },
            },
        },
    },
});

const light_theme = createTheme({
    palette: {
        primary: {
            main: CTM_Colors.ctm_green,
        },
    },
});

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isDarkmode, setIsDarkmode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
    });

    // Save dark mode preference (in the localstorage) whenever it changes
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkmode));
    }, [isDarkmode]);

    // check if the user is already logged in
    useEffect(() => {
        if (pb.authStore.isValid) {
            setIsLoggedIn(true); // User is already authenticated
            console.log('User is already authenticated');
        }
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true); // Update the login state
        console.log('User is authenticated');
    };

    const handleLogout = () => {
        pb.authStore.clear(); // Clear auth token
        setIsLoggedIn(false);
    };

    return (
        <ThemeProvider theme={isDarkmode ? dark_theme : light_theme}>
            <CssBaseline />
                <CTMAppBar
                    isDarkmode={isDarkmode}
                    onThemeChange={setIsDarkmode}
                    logoutHandler={handleLogout}
                />
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/discipline/:name" element={<DisciplinePage/>} />
                    <Route path="/run/:id" element={<RunDetailPage/>} />
                    <Route path="/gps-viewer" element={<GPSTrackViewer />} />
                    <Route path="/live-data" element={<LiveDataPage />} />
                </Routes>
                <ToastContainer position="bottom-right" theme={isDarkmode ? "dark" : "light"}/>
        </ThemeProvider>
    );
}
export default App;

