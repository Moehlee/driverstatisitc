import React, { createContext, useContext, useEffect, useState } from 'react';

export interface GpsPoint {
    timestamp: number;
    lat: number;
    lon: number;
}

export interface TempData {
    timestamp: number;
    temp: number;
    tempA: number;
    hum: number;
}

interface DataContextType {
    // Daten
    gpsPoints: GpsPoint[];
    temperatures: TempData[];
    latestTemp: TempData | null;

    // Status
    loading: boolean;
    error: string | null;

    // Methoden
    loadLogFile: (filename: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
    const [temperatures, setTemperatures] = useState<TempData[]>([]);
    const [latestTemp, setLatestTemp] = useState<TempData | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // CAN Decoder
    const decodeCanGps = (hexString: string): [number, number] => {
        const payload = hexString.includes("#") ? hexString.split("#")[1] : hexString;
        const bytes = Uint8Array.from(
            payload.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        const latRaw = new DataView(bytes.buffer).getInt32(0, true);
        const lonRaw = new DataView(bytes.buffer).getInt32(4, true);
        return [latRaw / 1e7, lonRaw / 1e7];
    };

    const decodeCanTemp = (payload: string): number => {
        if (!payload || payload.length < 4) return 0;

        const bytes = new Uint8Array(2);
        bytes[0] = parseInt(payload.substring(0, 2), 16);
        bytes[1] = parseInt(payload.substring(2, 4), 16);

        const value = new DataView(bytes.buffer).getInt16(0, true);
        return value / 100;
    };

    const decodeCanHum = (payload: string): number => {
        if (!payload || payload.length < 4) return 0;

        const bytes = new Uint8Array(2);
        bytes[0] = parseInt(payload.substring(0, 2), 16);
        bytes[1] = parseInt(payload.substring(2, 4), 16);

        const value = new DataView(bytes.buffer).getInt16(0, true);
        return value / 100;
    };

    const decodeCanTempA = (payload: string): number => {
        if (!payload || payload.length < 4) return 0;

        const bytes = new Uint8Array(2);
        bytes[0] = parseInt(payload.substring(0, 2), 16);
        bytes[1] = parseInt(payload.substring(2, 4), 16);

        const value = new DataView(bytes.buffer).getInt16(0, true);
        return value / 100;
    };


    // Log Datei laden
    const loadLogFile = async (filename: string) => {
        try {
            setLoading(true);
            setError(null);

            // Arrays für die neuen Daten
            const newGpsPoints: GpsPoint[] = [];
            const newTemperatures: TempData[] = [];

            const res = await fetch(`/runs/${filename}`);
            if (!res.ok) throw new Error(`Failed to load ${filename}`);

            const text = await res.text();
            const lines = text.split('\n');

            let currentTemp: Partial<TempData> = {};

            lines.forEach(line => {
                // Format: (1752525000.210000) can-temp 610#7D05000000000000
                const regex = /\(?([^)]+)\)?\s*(can-gps|can-temp|can-hum|can-tempA)\s+(\w+)#([0-9A-Fa-f]+)/;
                const match = line.match(regex);

                if (!match) return;

                const timestamp = parseFloat(match[1].replace(/[()]/g, ''));
                const type = match[2];
                const data = match[4];

                switch(type) {
                    case 'can-gps': {
                        const coords = decodeCanGps(data);
                        newGpsPoints.push({
                            timestamp,
                            lat: coords[0],
                            lon: coords[1]
                        });
                        break;
                    }
                    case 'can-temp': {
                        currentTemp.timestamp = timestamp;
                        currentTemp.temp = decodeCanTemp(data);
                        break;
                    }
                    case 'can-hum': {
                        currentTemp.timestamp = timestamp;
                        currentTemp.hum = decodeCanHum(data);
                        break;
                    }
                    case 'can-tempA': {
                        currentTemp.timestamp = timestamp;
                        currentTemp.tempA = decodeCanTempA(data);
                        break;
                    }
                }

                // Wenn wir alle 3 Temperaturdaten haben
                if (currentTemp.temp !== undefined &&
                    currentTemp.hum !== undefined &&
                    currentTemp.tempA !== undefined) {

                    const tempData: TempData = {
                        timestamp: currentTemp.timestamp!,
                        temp: currentTemp.temp,
                        tempA: currentTemp.tempA,
                        hum: currentTemp.hum
                    };

                    newTemperatures.push(tempData);
                    currentTemp = {};
                }
            });

            // ALLE Daten auf einmal setzen (viel effizienter!)
            setGpsPoints(newGpsPoints);
            setTemperatures(newTemperatures);

            if (newTemperatures.length > 0) {
                setLatestTemp(newTemperatures[newTemperatures.length - 1]);
            }

            console.log(`Geladen: ${newGpsPoints.length} GPS, ${newTemperatures.length} Temperatur`);
            console.log("Erster Temperaturwert:", newTemperatures[0]);
            console.log("Letzter Temperaturwert:", newTemperatures[newTemperatures.length - 1]);

        } catch (err) {
            setError(`Fehler beim Laden: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Demo.log automatisch laden
    useEffect(() => {
        loadLogFile("demo.log");
    }, []);

    return (
        <DataContext.Provider value={{
            gpsPoints,
            temperatures,
            latestTemp,
            loading,
            error,
            loadLogFile
        }}>
            {children}
        </DataContext.Provider>
    );
};