"use client"

import { useState, useEffect } from "react"
import "./custom.css"

export const Battery = () => {
  const [batteryLevel, setBatteryLevel] = useState(75)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    // Simulate battery level changes
    const interval = setInterval(() => {
      setBatteryLevel((prev) => {
        if (isCharging && prev < 100) {
          return prev + 1
        } else if (!isCharging && prev > 0) {
          return prev - 1
        }
        return prev
      })
    }, 3000)

    // Simulate charging status changes
    const chargingInterval = setInterval(() => {
      setIsCharging((prev) => !prev)
    }, 15000)

    return () => {
      clearInterval(interval)
      clearInterval(chargingInterval)
    }
  }, [isCharging])

  const getBatteryColor = () => {
    if (batteryLevel > 60) return "#00ff00"
    if (batteryLevel > 20) return "#ffaa00"
    return "#ff0000"
  }

  return (
    <div className="bg-black text-white h-screen w-screen flex flex-col justify-center items-center overflow-hidden">
      <div className="dashboard-header py-2 w-full text-center absolute top-0">
        <h1 className="m-0 fs-4">BATTERY MONITOR</h1>
      </div>

      {/* Giant Battery Visualization */}
      <div
        className="battery-container position-relative"
        style={{ width: "80vw", height: "60vh", maxWidth: "1200px" }}
      >
        <div
          className="battery-body border border-4 border-light rounded"
          style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
        >
          <div
            className="battery-level"
            style={{
              width: `${batteryLevel}%`,
              height: "100%",
              backgroundColor: getBatteryColor(),
              transition: "width 1s ease, background-color 1s ease",
            }}
          ></div>
          <div
            className="battery-percentage position-absolute top-50 start-50 translate-middle fw-bold"
            style={{ fontSize: "10vw", textShadow: "0 0 10px rgba(0,0,0,0.7)" }}
          >
            {batteryLevel}%
          </div>
        </div>
        <div
          className="battery-cap position-absolute"
          style={{
            right: "-20px",
            top: "40%",
            width: "20px",
            height: "20%",
            backgroundColor: "#aaa",
            borderTopRightRadius: "6px",
            borderBottomRightRadius: "6px",
          }}
        ></div>

        {isCharging && (
          <div className="charging-indicator position-absolute" style={{ top: "10%", right: "10%", fontSize: "8vw" }}>
            <span className="text-warning">⚡</span>
          </div>
        )}
      </div>

      {/* Battery Status */}
      <div className="battery-status mt-4 text-center">
        <h2 className="mb-2" style={{ fontSize: "3vw" }}>
          {isCharging ? "CHARGING" : "DISCHARGING"}
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: "1.5vw" }}>
          {isCharging
            ? `Approximately ${100 - batteryLevel} minutes until fully charged`
            : `Approximately ${batteryLevel * 5} minutes remaining`}
        </p>
      </div>

      {/* Battery Information - Small at bottom */}
      <div className="position-absolute bottom-0 w-100 p-3 d-flex justify-content-between">
        <div className="text-start">
          <div className="d-flex align-items-center">
            <span className="me-2">Health:</span>
            <span className="text-success">92%</span>
          </div>
          <div className="d-flex align-items-center">
            <span className="me-2">Cycles:</span>
            <span className="text-success">142</span>
          </div>
        </div>
        <div className="text-end">
          <div className="d-flex align-items-center justify-content-end">
            <span className="me-2">Temperature:</span>
            <span className="text-success">38°C</span>
          </div>
          <div className="d-flex align-items-center justify-content-end">
            <span className="me-2">Power Draw:</span>
            <span className="text-success">{isCharging ? "+22W" : "-18W"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Battery

