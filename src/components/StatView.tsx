import React from "react";
import LiveMap from "./LiveMap";

const RunView: React.FC = () => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                backgroundColor: "#121212",
                color: "white",
                gap: "10px",
                padding: "10px",
            }}
        >
            <div
                style={{
                    flex: 2,
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                }}
            >
                <LiveMap />
            </div>

            <div
                style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "10px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#1e1e1e",
                        borderRadius: "10px",
                        padding: "10px",
                        textAlign: "center",
                    }}
                >
                    <h3>Geschwindigkeit</h3>
                    <p>— bald Graph hier —</p>
                </div>

                <div
                    style={{
                        backgroundColor: "#1e1e1e",
                        borderRadius: "10px",
                        padding: "10px",
                        textAlign: "center",
                    }}
                >
                    <h3>Distanz</h3>
                    <p>— bald Graph hier —</p>
                </div>

                <div
                    style={{
                        backgroundColor: "#1e1e1e",
                        borderRadius: "10px",
                        padding: "10px",
                        textAlign: "center",
                    }}
                >
                    <p>— bald Graph hier —</p>
                </div>
            </div>
        </div>
    );
};

export default RunView;
