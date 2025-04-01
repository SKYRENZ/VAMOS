"use client"

import { useState, useEffect } from "react"
import "./custom.css"
import ChargeCycle from "../components/ChargeCycle"
import BatteryTemperature from "../components/BatteryTemperature"
import ChargerConnected from "../assets/Charger.gif"

interface ChargeCycleProps {
  cycles: number;
}

export const Battery = () => {
  const [batteryLevel, setBatteryLevel] = useState(75)
  const [isCharging, setIsCharging] = useState(false)
  const [showChargingGif, setShowChargingGif] = useState(false) // GIF Control
  const [batteryHealth, setBatteryHealth] = useState(92)
  const [chargeCycles, setChargeCycles] = useState(142)
  const [batteryTemperature, setBatteryTemperature] = useState(38)
  const [powerDraw, setPowerDraw] = useState(18)
  const [batteryTimeLeft, setBatteryTimeLeft] = useState(300)

  useEffect(() => {
    // Battery level simulation
    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        if (isCharging && prev < 100) return prev + 1
        if (!isCharging && prev > 0) return prev - 1
        return prev
      })
    }, 3000)

    // Simulate charging status changes
    const chargingInterval = setInterval(() => {
      setIsCharging((prev) => {
        if (!prev) {
          setShowChargingGif(true) // Show GIF when charging starts
          setTimeout(() => setShowChargingGif(false), 50) // Hide GIF after 3s
        }
        return !prev
      })
    }, 15000)

    return () => {
      clearInterval(interval)
      clearInterval(chargingInterval)
    }
  }, [])

  const getBatteryColor = () => {
    if (batteryLevel > 60) return "#00ff00"
    if (batteryLevel > 20) return "#ffaa00"
    return "#ff0000"
  }

  return (
    <div className="text-[#cccccc] font-[Arial] vh-100 vw-100 flex flex-col items-center overflow-y-auto overflow-x-hidden">
      
      {showChargingGif && (
        <div className="charging-gif-container">
          <img src={ChargerConnected} alt="Charging Animation" className="charging-gif" />
        </div>
      )}

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
              }}
            ></div>
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
            }}
          ></div>

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

      {/* Battery Information & Charge Cycle */}
      <div className="bg-transparent text-white d-flex justify-start align-items-start rounded-lg mt-4 vw-100"
        style={{ height: "36vh", maxWidth: "72vw", margin: "0 auto" }}
      >
        {/* Battery Information */}
        <div className="p-3 rounded-lg w-100"
          style={{ maxWidth: "40vh", minWidth: "250px", backgroundColor: "#121212", borderRadius: "10px", marginRight: "20px" }}
        >
          <h5 className="mb-3 text-start" style={{ color: "#00ff00" }}>Battery Information</h5>
          <div className="d-flex flex-column">
            <p className="d-flex justify-content-between">
              <span style={{ color: "#cccccc" }}>Health:</span> <span style={{ color: "#00ff00" }}>{batteryHealth}%</span>
            </p>
            <p className="d-flex justify-content-between">
              <span style={{ color: "#cccccc" }}>Cycles:</span> <span style={{ color: "#00ff00" }}>{chargeCycles}</span>
            </p>
            <p className="d-flex justify-content-between">
              <span style={{ color: "#cccccc" }}>Power Draw:</span> <span style={{ color: "#00ff00" }}>{isCharging ? "+22W" : `-${powerDraw}W`}</span>
            </p>
            <p className="d-flex justify-content-between">
              <span style={{ color: "#cccccc" }}>Estimated Time Left:</span> <span style={{ color: "#00ff00" }}>{batteryTimeLeft} min</span>
            </p>
            <p className="d-flex justify-content-between">
              <span style={{ color: "#cccccc" }}>Temperature:</span> <span style={{ color: "#00ff00" }}>{batteryTemperature}°C</span>
            </p>
          </div>
        </div>

        {/* ChargeCycle Component beside Battery Info */}
        <div className="charge-cycle-container p-3" style={{ flexGrow: 1, backgroundColor: "#121212", borderRadius: "10px", height: "35.5vh", width: "30vh" }}>
          <ChargeCycle cycles={chargeCycles} />
        </div>
      </div>

      {/* Battery Temperature Graph */}
      <div className="bg-transparent text-white d-flex justify-start align-items-start rounded-lg mt-4 vw-100"
        style={{ height: "60vh", maxWidth: "72vw", margin: "0 auto", marginBottom: "20px" }}
      >
        <div className="charge-cycle-container p-3" style={{ flexGrow: 1, backgroundColor: "#121212", borderRadius: "10px", height: "47vh" }}>
          <BatteryTemperature />
        </div>
      </div>

    </div>
  )
}

export default Battery
