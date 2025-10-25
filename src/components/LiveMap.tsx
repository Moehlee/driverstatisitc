import React, {useEffect, useRef, useState} from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import l, {LatLngExpression} from "leaflet";
import {CTM_Colors} from "../Helper";

const icon = l.icon({
    iconUrl: "blob:null/01fa31bd-b919-4891-81a2-265e03ced77a",
    iconSize: [40, 20],
    iconAnchor: [20, 20]
})


const LiveMap: React.FC = () => {

    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);

    const [position, setPosition] = useState<[number, number]>([47.2638611, 11.3457778]);

    const [path, setPath] = useState<[number,number][]>([[47.2638611, 11.3457778]]);


    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = l.map("map").setView(position,16)

            l.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap contributors',
            }).addTo(mapRef.current);

            markerRef.current = l.marker(position, {icon: icon}).addTo(mapRef.current);

            //polyline initalisieren
            polylineRef.current = l.polyline(path, {
                color: CTM_Colors.ctm_green,
                weight: 4,
                opacity: 0.8,
            }).addTo(mapRef.current);
        }

        // Marker updaten
        if (markerRef.current) {
            markerRef.current.setLatLng(position);
        }

        // Polyline updaten
        if (polylineRef.current) {
            polylineRef.current.setLatLngs(path);
        }

        // Karte auf Marker zentrieren
        mapRef.current?.panTo(position);

    }, [position, path]);

    // Beispiel: Auto bewegt sich alle 2 Sekunden leicht weiter
    useEffect(() => {
        const interval = setInterval(() => {
            setPosition(([lat, lng]) => {
                const newPos: [number, number] = [lat + 0.0001, lng + 0.00005];

                setPath((prev: [number,number][]) => [...prev, newPos]);

                return newPos;
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);


    return <div id="map" style={{ width: "100%", height: "100%", borderRadius: "10px" }} />;
};

export default LiveMap;
