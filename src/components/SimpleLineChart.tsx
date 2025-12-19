import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SimpleLineChartProps {
    data: Array<{
        lap: number;
        time: number;
        cones?: number;
    }>;
    title?: string;
    color?: string;
    height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
                                                             data,
                                                             title = "Lap Time Progression",
                                                             color = "#6bb5ff",
                                                             height = 300
                                                         }) => {
    if (data.length === 0) {
        return (
            <div style={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 20
            }}>
                <p>No data available for chart</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', marginBottom: 20 }}>
            {title && <h3 style={{ marginBottom: 10 }}>{title}</h3>}

            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="lap"
                        label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <Tooltip
                        formatter={(value) => [`${value}s`, "Time"]}
                        labelFormatter={(label) => `Lap ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="time"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        activeDot={{ r: 6, fill: color }}
                        name="Lap Time"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SimpleLineChart;