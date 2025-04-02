"use client"

import { useState, useEffect } from "react"
import "./custom.css"
import ChargerConnected from "../assets/Charger.gif"

export const Battery = () => {
  const [batteryLevel, setBatteryLevel] = useState(75)
  const [isCharging, setIsCharging] = useState(false)
  const [batteryTimeLeft, setBatteryTimeLeft] = useState(300)
  interface BatteryData {
    charging_status?: boolean;
    system_power_usage?: number;
    battery_discharge_rate?: number;
    system_uptime?: string;
  }

  const [batteryData, setBatteryData] = useState<BatteryData>({})

  useEffect(() => {
    const fetchBatteryData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/battery"); // Port updated to 5000
        const data = await response.json();

        setBatteryLevel(data.battery_level);
        setIsCharging(data.is_charging);
        setBatteryTimeLeft(data.time_left);
        setBatteryData(data) // Save the full battery data to state
      } catch (error) {
        console.error("Error fetching battery data:", error);
      }
    };

    fetchBatteryData();
    const interval = setInterval(fetchBatteryData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBatteryColor = () => {
    if (batteryLevel > 60) return "#00ff00"
    if (batteryLevel > 20) return "#ffaa00"
    return "#ff0000"
  }

  return (
    <div className="text-[#cccccc] font-[Arial] vh-100 vw-100 flex flex-col items-center overflow-y-auto overflow-x-hidden">
      
      {/* Dashboard Header */}
      <div className="dashboard-header py-2 w-full text-center sticky top-0 bg-dark">
        <h1 className="m-0 fs-4">BATTERY MONITOR</h1>
      </div>

      {/* Giant Battery Visualization */}
      <div className="battery-visualization d-flex justify-content-center align-items-center mt-5" style={{ height: "40vh", width: "100%", maxWidth: "100vw" }}>
        <div className="battery-container position-relative" style={{ width: "80%", height: "40vh", maxWidth: "100vh" }}>
          <div className="battery-body border border-4 border-light rounded position-relative" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <div className="battery-level" style={{
              width: `${batteryLevel}%`,
              height: "100%",
              backgroundColor: getBatteryColor(),
              transition: "width 1s ease, background-color 1s ease",
            }}></div>
            <div className="battery-percentage position-absolute top-50 start-50 translate-middle fw-bold" style={{ fontSize: "10vw", textShadow: "0 0 10px rgba(0,0,0,0.7)" }}>
              {batteryLevel}%
            </div>
          </div>

          {/* 🔧 Fixed Battery Cap Position */}
          <div className="battery-cap position-absolute" style={{
            right: "-8px", /* Adjusted so it's visible */
            top: "40%",
            width: "12px",
            height: "20%",
            backgroundColor: "#aaa",
            borderTopRightRadius: "6px",
            borderBottomRightRadius: "6px",
          }}></div>

          {isCharging && (
            <div className="charging-indicator position-absolute" style={{ top: "30%", right: "10%", fontSize: "8vw" }}>
              <span className="text-warning">⚡</span>
            </div>
          )}
        </div>
      </div>

      {/* Battery Status */}
      <div className="battery-status mt-4 text-center">
        <h2 className="mb-2" style={{ fontSize: "3vw", color: isCharging ? "#00ff00" : "#ff0000" }}>
          {isCharging ? "CHARGING" : "UNPLUGGED"}
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: "1.5vw" }}>
          {isCharging
            ? `Approximately ${100 - batteryLevel} minutes until fully charged`
            : `Approximately ${batteryLevel * 5} minutes remaining`}
        </p>
      </div>

      {/* Battery Info */}
  <div style={{ height: "60vh", display: "flex", justifyContent: "center"}}>
  <div className="battery-info mt-5 w-full text-center" style={{ backgroundColor:"#121212" ,width: "100vh", height: "35vh", padding: "2rem", borderRadius: "8px" }}>
  <div className="info-row flex justify-between" style={{ display: "flex", marginBottom: "1rem", fontSize: "2vw" , color:"#00ff00",}}>
      <div style={{ flex: 1, textAlign: "left" }}><strong>Battery Information</strong></div>
    </div>
    <div className="info-row flex justify-between" style={{ display: "flex", marginBottom: "1rem", fontSize: "1.5vw" }}>
      <div style={{ flex: 1, textAlign: "left" , color:"#cccccc"}}><strong>Charging Status:</strong></div>
      <div style={{ flex: 1, textAlign: "right", color:"#00ff00" }}>{batteryData.charging_status ? "Charging" : "Not Charging"}</div>
    </div>
    <div className="info-row flex justify-between" style={{ display: "flex", marginBottom: "1rem", fontSize: "1.5vw" }}>
      <div style={{ flex: 1, textAlign: "left" , color:"#cccccc"}}><strong>Power Usage (W):</strong></div>
      <div style={{ flex: 1, textAlign: "right" , color:"#00ff00"}}>{batteryData.system_power_usage} W</div>
    </div>
    <div className="info-row flex justify-between" style={{ display: "flex", marginBottom: "1rem", fontSize: "1.5vw" }}>
      <div style={{ flex: 1, textAlign: "left" , color:"#cccccc"}}><strong>Discharge Rate (W):</strong></div>
      <div style={{ flex: 1, textAlign: "right" , color:"#00ff00"}}>{batteryData.battery_discharge_rate} W</div>
    </div>
    <div className="info-row flex justify-between" style={{ display: "flex", marginBottom: "1rem", fontSize: "1.5vw" }}>
      <div style={{ flex: 1, textAlign: "left" , color:"#cccccc"}}><strong>System Uptime:</strong></div>
      <div style={{ flex: 1, textAlign: "right" , color:"#00ff00"}}>{batteryData.system_uptime}</div>
    </div>
  </div>
</div>

    </div>
  )
}

export default Battery
