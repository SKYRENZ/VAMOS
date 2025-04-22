"use client"

import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./custom.css" // For custom styling on top of Bootstrap
import StorageInfo from "../components/StorageInfo" // Import the StorageInfo component
import useMemoryData from "../hooks/useMemoryData" // Import the custom hook for memory data
import SystemSpecs from "../components/SystemSpecs"
import SpeedTestNotification from "../components/SpeedTestNotification"
import GamingMode from "../components/GamingMode"
import VamosHeader from "../components/VamosHeader"
import CombinedGaugeChart from "../components/CombinedGaugeChart"
import useCPUStats from "../hooks/useCPUStats"
import useGPUStats from "../hooks/useGPUStats"
import ProcessModal from "../components/ProcessModal" // Import the ProcessModal component

interface TemperatureBarProps {
  isGamingMode: boolean
}

const TemperatureBar = ({ isGamingMode }: TemperatureBarProps) => {
  const [cpuTemp, setCpuTemp] = useState(50)
  const [gpuTemp, setGpuTemp] = useState(45)
  const [gpuStats, setGpuStats] = useState({
    gpu_clock_speed: 0,
    vram_clock_speed: 0,
  })
  const [isUsingMockData, setIsUsingMockData] = useState(false)

  useEffect(() => {
    const generateMockTemperature = () => {
      const baseTemp = 45
      const randomVariation = Math.floor(Math.random() * 30)
      return baseTemp + randomVariation
    }

    const fetchTemperatures = async () => {
      try {
        // Fetch CPU temperature
        const cpuResponse = await fetch("http://localhost:5000/cpu-temperature", {
          headers: { Accept: "application/json" },
        })
        const cpuData = await cpuResponse.json()

        // Fetch GPU temperature
        const gpuResponse = await fetch("http://localhost:5000/gpu-temperature", {
          headers: { Accept: "application/json" },
        })
        const gpuData = await gpuResponse.json()

        // Fetch GPU stats (clock speeds)
        const gpuStatsResponse = await fetch("http://localhost:5000/gpu-stats", {
          headers: { Accept: "application/json" },
        })
        const gpuStatsData = await gpuStatsResponse.json()

        if (cpuData.cpu_temperature !== undefined) {
          setCpuTemp(Math.round(cpuData.cpu_temperature))
        }
        if (gpuData.gpu_temperature !== undefined) {
          setGpuTemp(Math.round(gpuData.gpu_temperature))
        }
        if (gpuStatsData.gpu_clock_speed !== undefined && gpuStatsData.vram_clock_speed !== undefined) {
          setGpuStats({
            gpu_clock_speed: gpuStatsData.gpu_clock_speed,
            vram_clock_speed: gpuStatsData.vram_clock_speed,
          })
        }
        setIsUsingMockData(false)
      } catch (error) {
        console.log("Using mock temperature data")
        setIsUsingMockData(true)
        setCpuTemp(generateMockTemperature())
        setGpuTemp(generateMockTemperature() - 5)
        setGpuStats({
          gpu_clock_speed: Math.floor(Math.random() * 500) + 1200, // Random between 1200-1700
          vram_clock_speed: Math.floor(Math.random() * 1000) + 5000, // Random between 5000-6000
        })
      }
    }

    fetchTemperatures()
    const interval = setInterval(fetchTemperatures, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="temp-info">
      <div className="info-row">
        <span>CPU Temperature</span>
        <span className={cpuTemp > 80 ? "text-danger" : ""} style={cpuTemp > 80 ? {} : { color: "#00ff00" }}>
  {cpuTemp} °C
</span>

      </div>
      <div className="info-row">
        <span>GPU Temperature</span>
        <span className={gpuTemp > 80 ? "text-danger" : ""} style={gpuTemp > 80 ? {} : { color: "#00ff00" }}>
  {gpuTemp} °C
</span>

      </div>
      <div className="info-row">
        <span>GPU Clock</span>
        <span className={gpuStats.gpu_clock_speed > 2000 ? "text-danger" : ""} style={gpuStats.gpu_clock_speed > 2000 ? {} : { color: "#00ff00" }}>
  {gpuStats.gpu_clock_speed} MHz
</span>
      </div>
      <div className="info-row">
        <span>VRAM Clock</span>
        <span className={gpuStats.vram_clock_speed > 2000 ? "text-danger" : ""} style={gpuStats.vram_clock_speed > 2000 ? {} : { color: "#00ff00" }}>
  {gpuStats.vram_clock_speed} MHz
</span>
      </div>
    </div>
  )
}

interface SpeedTestResult {
  download: number
  upload: number
  ping: number
  server?: {
    name: string
    location: string
    sponsor: string
    latency: number
    distance: string
  }
}

interface HomeProps {
  networkState?: {
    speedTestCompleted: boolean
    speedTestData: SpeedTestResult | null
    isRunningSpeedTest: boolean
    scanProgress: number
    currentPhase: string
    error: string | null
    dataReady: boolean
  }
}

const Home = ({ networkState }: HomeProps) => {
  const { cpuStats, loading: cpuLoading } = useCPUStats()
  const { gpuStats, loading: gpuLoading } = useGPUStats()
  const { memory, error: memoryError } = useMemoryData()
  const [isGamingModeActive, setIsGamingModeActive] = useState(false)
  const [isGamingMode, setIsGamingMode] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false) // State for ProcessModal

  // Check gaming mode status
  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"
    const apiUrl = `${API_BASE_URL}/gaming-mode`

    const fetchGamingModeStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/status`)
        if (response.ok) {
          const data = await response.json()
          setIsGamingModeActive(data.gaming_mode)
          setIsGamingMode(data.gaming_mode)
        }
      } catch (err) {
        console.error("Failed to fetch gaming mode status:", err)
      }
    }

    fetchGamingModeStatus()
    const interval = setInterval(fetchGamingModeStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`dashboard ${isGamingModeActive ? "gaming-mode-dashboard" : ""}`}>
      <div className="dashboard-header">
        <h1>Monitor</h1>
        <div className="gaming-mode-container">
          <GamingMode className={isGamingModeActive ? "gaming-mode-glow" : ""} />
          <button
            className="btn btn-success ms-3"
            onClick={() => setShowProcessModal(true)}
          >
            View Processes
          </button>
        </div>
      </div>

      {/* Vamos header moved here, between the header and content */}
      <div className="vamos-header-container">
        <VamosHeader isGamingMode={isGamingModeActive} />
      </div>

      <div className="dashboard-content">
        {/* Top row - CPU and GPU gauges only */}
        <div className="top-row">
          {!cpuLoading && cpuStats && (
            <CombinedGaugeChart
              title="CPU Usage"
              value={cpuStats.cpu_usage}
              isGamingMode={isGamingModeActive}
            />
          )}
          {!gpuLoading && gpuStats && (
            <CombinedGaugeChart
              title="GPU Usage"
              value={gpuStats.gpu_clock_mhz || 0}
              isGamingMode={isGamingModeActive}
            />
          )}
        </div>

        {/* Bottom row - System specs, Storage+Temperature, Memory */}
        <div className="bottom-row">
          <div className={`rgb-border-container ${isGamingModeActive ? "active" : ""}`}>
            <div className="info-card card-hover">
              <h5 className="info-title">System</h5>
              <SystemSpecs />
            </div>
          </div>

          <div className={`rgb-border-container ${isGamingModeActive ? "active" : ""}`}>
            <div className="info-card card-hover">
              <h5 className="info-title">Storage & Temperature</h5>
              <div className="combined-info">
                <div className="storage-section">
                  <StorageInfo />
                </div>
                <div className="temperature-section">
                  <TemperatureBar isGamingMode={isGamingModeActive} />
                </div>
              </div>
            </div>
          </div>

          <div className={`rgb-border-container ${isGamingModeActive ? "active" : ""}`}>
            <div className="info-card">
              <h5 className="info-title">Memory</h5>
              {memoryError ? (
                <div className="text-danger">Error: {memoryError}</div>
              ) : memory ? (
                <>
                  <div className="usage-section">
                    <div className="usage-header">
                      <span className="usage-percent">
                        {Number.parseFloat(((memory.used / memory.total) * 100).toFixed(0))}%
                      </span>
                    </div>
                    <div className="usage-bar-container">
                      <div className="usage-bar-bg">
                        <div
                          className="usage-bar-fill memory"
                          style={{ width: `${((memory.used / memory.total) * 100).toFixed(0)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="memory-details">
                      <div className="info-row">
                        <span>Total</span>
                        <span>{(memory.total / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                      <div className="info-row">
                        <span>Used</span>
                        <span>{(memory.used / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                      <div className="info-row">
                        <span>Available</span>
                        <span>{(memory.available / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                      <div className="info-row">
                        <span>Cached</span>
                        <span>{(memory.cached / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>Loading...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {networkState && (
        <div className={`network-state-container ${isGamingModeActive ? "rgb-border" : ""}`}>
          <SpeedTestNotification networkState={networkState} />
        </div>
      )}

      {/* ProcessModal */}
      <ProcessModal
        showModal={showProcessModal}
        setShowModal={setShowProcessModal}
      />
    </div>
  )
}

export default Home
