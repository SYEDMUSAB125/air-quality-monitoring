"use client"
import React, { useState, useEffect } from "react";
import { FaTemperatureHigh, FaTint, FaMapMarkerAlt, FaLeaf } from "react-icons/fa";
import { MdOutlineAir, MdLocationOn } from "react-icons/md";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Dynamically import Leaflet components with no SSR
const DynamicMapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const DynamicTileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const DynamicMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function AirQualityDashboard() {
  const [selectedParam, setSelectedParam] = useState("pm25");
  const [showMap, setShowMap] = useState(false);
  const [locationName, setLocationName] = useState("Fetching location...");
  const [mapReady, setMapReady] = useState(false);

  // Fix for Leaflet marker icons in Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true);
      const L = require('leaflet');
      delete L.Icon.Default.prototype._getIconUrl;
      
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
      });
    }
  }, []);

  // Sample data
  const data = {
    pm25: { value: 6, unit: "µg/m³", name: "PM2.5", description: "Fine Particles", color: "rgb(168, 85, 247)", bgColor: "rgba(168, 85, 247, 0.2)" },
    pm10: { value: 83, unit: "µg/m³", name: "PM10", description: "Coarse Particles", color: "rgb(16, 185, 129)", bgColor: "rgba(16, 185, 129, 0.2)" },
    co2: { value: 922, unit: "ppm", name: "CO₂", description: "Carbon Dioxide", color: "rgb(234, 179, 8)", bgColor: "rgba(234, 179, 8, 0.2)" },
    temp: { value: 25, unit: "°C", name: "Temperature", description: "Ambient", color: "rgb(239, 68, 68)", bgColor: "rgba(239, 68, 68, 0.2)" },
    humidity: { value: 74, unit: "%", name: "Humidity", description: "Relative", color: "rgb(59, 130, 246)", bgColor: "rgba(59, 130, 246, 0.2)" },
    location: { lat: 24.8607, lng: 67.0011 }, // Karachi
    readings: {
      hours: ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"],
      pm25: [8, 7, 6, 5, 6, 7, 8, 9],
      pm10: [70, 75, 80, 83, 85, 82, 80, 78],
      co2: [800, 850, 900, 920, 950, 930, 910, 890],
      temp: [22, 21, 23, 25, 27, 26, 24, 23],
      humidity: [80, 82, 78, 74, 70, 72, 76, 78],
    },
  };

  // Fetch location name using reverse geocoding
  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.location.lat}&lon=${data.location.lng}`
        );
        const result = await response.json();
        if (result.address) {
          const { city, town, village, county, state, country } = result.address;
          setLocationName(
            [city, town, village, county].find(Boolean) + 
            `, ${state || country}`
          );
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocationName("Karachi, Pakistan");
      }
    };

    fetchLocationName();
  }, []);

  // Main circular chart data
  const doughnutData = {
    labels: ["Current", "Remaining"],
    datasets: [
      {
        data: [data[selectedParam].value, 100 - data[selectedParam].value],
        backgroundColor: [data[selectedParam].color, data[selectedParam].bgColor],
        borderColor: ["rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)"],
        borderWidth: 1,
        cutout: "70%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Air Quality Trends (Last 24 Hours)",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Pollutant Levels Comparison",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Chart data
  const lineChartData = {
    labels: data.readings.hours,
    datasets: [
      {
        label: "PM2.5 (µg/m³)",
        data: data.readings.pm25,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.5)",
        tension: 0.3,
      },
      {
        label: "Temperature (°C)",
        data: data.readings.temp,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        tension: 0.3,
      },
      {
        label: "Humidity (%)",
        data: data.readings.humidity,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const barChartData = {
    labels: ["PM2.5", "PM10", "CO₂"],
    datasets: [
      {
        label: "Current Levels",
        data: [data.pm25.value, data.pm10.value, data.co2.value],
        backgroundColor: [
          "rgba(168, 85, 247, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(234, 179, 8, 0.7)",
        ],
        borderColor: [
          "rgb(168, 85, 247)",
          "rgb(16, 185, 129)",
          "rgb(234, 179, 8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // AQI calculation (simplified)
  const calculateAQI = (pm25, pm10) => {
    const aqi = Math.max(pm25 * 2, pm10);
    if (aqi <= 50) return { value: aqi, level: "Good", color: "bg-green-500" };
    if (aqi <= 100) return { value: aqi, level: "Moderate", color: "bg-yellow-500" };
    if (aqi <= 150) return { value: aqi, level: "Unhealthy for Sensitive", color: "bg-orange-500" };
    if (aqi <= 200) return { value: aqi, level: "Unhealthy", color: "bg-red-500" };
    return { value: aqi, level: "Very Unhealthy", color: "bg-purple-500" };
  };

  const aqi = calculateAQI(data.pm25.value, data.pm10.value);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Air Quality Monitoring</h1>
            <p className="text-blue-100">ESP32 Wireless Sensor Network - Real-time Data</p>
            <div className="mt-2 flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              <span>Karachi, Pakistan | {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Main Circular Chart Card or Map */}
        {showMap ? (
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-600">Sensor Location</h2>
              <button 
                onClick={() => setShowMap(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to see others Parameter
              </button>
            </div>
            <div className="h-64 rounded-lg overflow-hidden">
              {mapReady && (
                <DynamicMapContainer
                  center={data.location}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <DynamicTileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <DynamicMarker position={data.location}>
                    <DynamicPopup>
                      <div className="font-sans">
                        <h3 className="font-bold">ESP32 Air Quality Sensor</h3>
                        <p>{locationName}</p>
                        <p className="text-sm mt-1">
                          PM2.5: {data.pm25.value} µg/m³<br />
                          PM10: {data.pm10.value} µg/m³<br />
                          Temp: {data.temp.value}°C
                        </p>
                      </div>
                    </DynamicPopup>
                  </DynamicMarker>
                </DynamicMapContainer>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-center items-center">
              <div className="w-64 h-64 relative">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold" style={{ color: data[selectedParam].color }}>
                    {data[selectedParam].value}
                  </div>
                  <div className="text-sm text-gray-500">{data[selectedParam].unit}</div>
                  <div className="text-lg text-gray-600 font-semibold mt-2">{data[selectedParam].name}</div>
                </div>
              </div>
              <div className="md:ml-8 mt-4 md:mt-0">
                <h3 className="text-xl text-black font-semibold mb-2">Parameter Details</h3>
                <p className="text-gray-600 mb-4">{data[selectedParam].description}</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: data[selectedParam].color }}></div>
                    <span className="text-gray-600">Current: {data[selectedParam].value} {data[selectedParam].unit}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: data[selectedParam].bgColor }}></div>
                    <span className="text-gray-600">Scale: 0-100 {data[selectedParam].unit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sensor Cards - Now 6 cards with location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Location Card */}
        

          {/* Other sensor cards */}
          <div 
            className={`bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all ${selectedParam === "pm25" ? "ring-2 ring-purple-500" : ""}`}
            onClick={() => setSelectedParam("pm25")}
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <MdOutlineAir className="text-purple-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">PM2.5</div>
              <div className="text-xl text-gray-600 font-bold">{data.pm25.value} µg/m³</div>
              <div className="text-xs text-gray-400">Fine Particles</div>
            </div>
          </div>

          <div 
            className={`bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all ${selectedParam === "pm10" ? "ring-2 ring-green-500" : ""}`}
            onClick={() => setSelectedParam("pm10")}
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <MdOutlineAir className="text-green-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">PM10</div>
              <div className="text-xl text-gray-600 font-bold">{data.pm10.value} µg/m³</div>
              <div className="text-xs text-gray-400">Coarse Particles</div>
            </div>
          </div>

          <div 
            className={`bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all ${selectedParam === "co2" ? "ring-2 ring-yellow-500" : ""}`}
            onClick={() => setSelectedParam("co2")}
          >
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
              <FaLeaf className="text-yellow-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">CO₂</div>
              <div className="text-xl text-gray-600 font-bold">{data.co2.value} ppm</div>
              <div className="text-xs text-gray-400">Carbon Dioxide</div>
            </div>
          </div>

          <div 
            className={`bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all ${selectedParam === "temp" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setSelectedParam("temp")}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <FaTemperatureHigh className="text-red-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Temperature</div>
              <div className="text-xl text-gray-600 font-bold">{data.temp.value}°C</div>
              <div className="text-xs text-gray-400">Ambient</div>
            </div>
          </div>

          <div 
            className={`bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all ${selectedParam === "humidity" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedParam("humidity")}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <FaTint className="text-blue-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Humidity</div>
              <div className="text-xl text-gray-600 font-bold">{data.humidity.value}%</div>
              <div className="text-xs text-gray-400">Relative</div>
            </div>
          </div>
            <div 
            className="bg-white p-4 rounded-xl shadow flex flex-col items-center cursor-pointer transition-all hover:ring-2 hover:ring-blue-500"
            onClick={() => setShowMap(true)}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <MdLocationOn className="text-blue-600 text-2xl" />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Location</div>
              <div className="text-sm text-gray-600 font-semibold truncate w-full" title={locationName}>
                {locationName}
              </div>
              <div className="text-xs text-gray-400 mt-1">Click to view map</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
          
          {/* Bar Chart */}
          <div className="bg-white p-4 rounded-xl shadow">
            <Bar options={barChartOptions} data={barChartData} />
          </div>
        </div>

        {/* Status Footer */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-600">Sensor Status: Online</span>
          </div>
          <div className="text-sm text-gray-500 mt-2 sm:mt-0">
            Last updated: {new Date().toLocaleTimeString()} | Refresh rate: 5s
          </div>
        </div>
      </div>
    </div>
  );
}