"use client"

import { useState, useEffect } from "react"
import "./custom.css"
import { Tooltip } from 'react-tooltip'
import CircularGaugeSpeedTest from '../components/CircularGaugeSpeedTest'
import BandwidthUsageGraph from '../components/BandwidthUsageGraph'
import ConnectionQualityMonitor from '../components/ConnectionQualityMonitor'

const API_URL = 'http://localhost:5000/api'

interface NetworkData {
  connectionType: string
  signalStrength: number
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
  stability: number
  ipAddress: string
  dnsServer: string
  macAddress: string
}

interface SpeedTestResult {
  download: number
  upload: number
  ping: number
}

interface ConnectedDevice {
  id: string
  name: string
  status: string
  ipAddress: string
  macAddress: string
}

interface BandwidthDataPoint {
  timestamp: string
  download: number
  upload: number
}

export const Network = () => {
  const [networkData, setNetworkData] = useState<NetworkData | null>({
    connectionType: "Unknown",
    signalStrength: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    ping: 0,
    jitter: 0,
    packetLoss: 0,
    stability: 0,
    ipAddress: "Not available",
    dnsServer: "Not available",
    macAddress: "Not available"
  })
  const [speedTestData, setSpeedTestData] = useState<SpeedTestResult | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bandwidthHistory, setBandwidthHistory] = useState<BandwidthDataPoint[]>([])
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [timeRange, setTimeRange] = useState<'5min' | '1hour' | '1day'>('5min')

  // Fetch all network data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/all`)
      const data = await response.json()

      setNetworkData(data.networkData)
      setConnectedDevices(data.connectedDevices)
      setBandwidthHistory(data.bandwidthHistory || [])
      setLatencyHistory(data.latencyHistory || [])
      setLastUpdated(new Date(data.lastUpdated))
      setError(null)
    } catch (err) {
      console.error('Error fetching network data:', err)
      setError('Failed to fetch network data. Make sure the Python backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch bandwidth history
  const fetchBandwidthHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/bandwidth-history?timeframe=${timeRange}`)
      const data = await response.json()
      setBandwidthHistory(data)
    } catch (err) {
      console.error('Error fetching bandwidth history:', err)
    }
  }

  // Run speed test
  const handleRunSpeedTest = async () => {
    try {
      setIsRunningSpeedTest(true)
      setSpeedTestData(null)

      // Simulate a delay for the test
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await fetch(`${API_URL}/speedtest`)
      const data = await response.json()
      setSpeedTestData(data)
    } catch (err) {
      console.error('Error running speed test:', err)
      setError('Failed to run speed test.')
    } finally {
      setIsRunningSpeedTest(false)
    }
  }

  // Handle time range change for bandwidth graph
  const handleTimeRangeChange = (newRange: '5min' | '1hour' | '1day') => {
    setTimeRange(newRange)
  }

  // Initial data fetch and set up refresh interval
  useEffect(() => {
    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fetch bandwidth history when time range changes
  useEffect(() => {
    fetchBandwidthHistory()
  }, [timeRange])

  const getSignalQuality = (signal: number) => {
    if (signal === 0) return { text: "Not tested", color: "#808080" }
    if (signal > 80) return { text: "Excellent", color: "#00FF00" }
    if (signal > 60) return { text: "Good", color: "#66FF66" }
    if (signal > 40) return { text: "Fair", color: "#FFCC00" }
    return { text: "Poor", color: "#FF3333" }
  }

  const formatSpeed = (speed: number) => {
    return speed.toFixed(1)
  }

  const formatIP = (ip: string | undefined) => {
    return ip || "Not available"
  }

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes("router")) return "fa-wifi";
    if (name.includes("phone") || name.includes("mobile") || name.includes("android") || name.includes("iphone")) return "fa-mobile-alt";
    if (name.includes("this device")) return "fa-desktop";
    return "fa-laptop";
  }

  if (error) {
    return (
      <div className="page-content" style={{ backgroundColor: '#000000' }}>
        <div className="error-container">
          <h2 style={{ color: '#FFFFFF' }}>Error</h2>
          <p style={{ color: '#CCCCCC' }}>{error}</p>
          <button
            className="btn"
            onClick={fetchData}
            style={{
              backgroundColor: 'transparent',
              color: '#00FF00',
              border: '1px solid #00FF00'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const quality = getSignalQuality(networkData?.signalStrength || 0)

  return (
    <div className="page-content" style={{ backgroundColor: '#000000' }}>
      <div className="dashboard-header" style={{ borderBottom: '1px solid #00FF00' }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-12">
              <h1 className="m-0" style={{ color: '#00FF00', fontWeight: 'normal' }}>NETWORK MONITOR</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        {/* Speed Test Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Speed Test
                </h5>

                <CircularGaugeSpeedTest
                  isRunning={isRunningSpeedTest}
                  downloadSpeed={speedTestData?.download || null}
                  uploadSpeed={speedTestData?.upload || null}
                  ping={speedTestData?.ping || null}
                  onStartTest={handleRunSpeedTest}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card mb-4 border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <h5 className="card-title mb-3 d-flex align-items-center" style={{ color: '#00FF00' }}>
                  <i className="fas fa-wifi me-2"></i>
                  Connection Status
                </h5>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="mb-0" style={{ color: '#CCCCCC' }}>{networkData?.connectionType || "Unknown"}</h3>
                    <p style={{ color: '#CCCCCC' }}>Connected</p>
                  </div>
                  <div className="text-end">
                    <h4 style={{ color: quality.color }}>{quality.text}</h4>
                    <p style={{ color: '#CCCCCC' }}>Signal Strength: {networkData?.signalStrength || 0}%</p>
                  </div>
                </div>

                <div className="progress" style={{ backgroundColor: '#000000', height: "10px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${networkData?.signalStrength || 0}%`,
                      backgroundColor: networkData?.signalStrength === 0 ? '#808080' : quality.color,
                      transition: 'width 0.5s ease-in-out'
                    }}
                    aria-valuenow={networkData?.signalStrength || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            </div>

            {/* Connection Quality Section */}
            <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                  <i className="fas fa-chart-line me-2"></i>
                  Connection Quality
                </h5>

                <ConnectionQualityMonitor
                  ping={networkData?.ping || 0}
                  jitter={networkData?.jitter || 0}
                  packetLoss={networkData?.packetLoss || 0}
                  stability={networkData?.stability || 0}
                  latencyHistory={latencyHistory}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card mb-4 border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                  <i className="fas fa-network-wired me-2"></i>
                  Network Performance
                </h5>

                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-cente border-secondary "
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-stopwatch me-2"></i>
                      Current Ping
                    </span>
                    <span style={{ color: '#00FF00' }}>{networkData?.ping || 0} <small style={{ color: '#CCCCCC' }}>ms</small></span>
                  </li>
                  {speedTestData && (
                    <li className="list-group-item d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                      <span style={{ color: '#66FF66' }}>
                        <i className="fas fa-tachometer-alt me-2"></i>
                        Speed Test Ping
                      </span>
                      <span style={{ color: '#00FF00' }}>{speedTestData.ping} ms</span>
                    </li>
                  )}
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-random me-2"></i>
                      Jitter
                    </span>
                    <span style={{ color: '#00FF00' }}>{networkData?.jitter || 0} <small style={{ color: '#CCCCCC' }}>ms</small></span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Packet Loss
                    </span>
                    <span style={{ color: networkData?.packetLoss === 0 ? '#00FF00' : '#FFCC00' }}>
                      {networkData?.packetLoss || 0}%
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-globe me-2"></i>
                      IP Address
                    </span>
                    <span style={{ color: '#00FF00' }}>{formatIP(networkData?.ipAddress)}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-server me-2"></i>
                      DNS Server
                    </span>
                    <span style={{ color: '#00FF00' }}>{formatIP(networkData?.dnsServer)}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                    <span style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-microchip me-2"></i>
                      MAC Address
                    </span>
                    <span style={{ color: '#00FF00' }}>{networkData?.macAddress || "Not available"}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                  <i className="fas fa-laptop-house me-2"></i>
                  Connected Devices
                </h5>
                <div className="connected-devices-list">
                  {connectedDevices && connectedDevices.length > 0 ? (
                    connectedDevices.map((device) => (
                      <div
                        key={device.id}
                        className="device-card p-3 mb-2 rounded"
                        style={{
                          backgroundColor: '#121212',
                          border: '1px solid #333333'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-bold" style={{ color: '#00FF00' }}>
                              <i className={`fas ${getDeviceIcon(device.name)} me-2`}></i>
                              {device.name}
                            </span>
                            <br />
                            <small style={{ color: '#CCCCCC' }}>
                              <i className="fas fa-network-wired me-2"></i>
                              {device.ipAddress}
                            </small>
                            {device.macAddress && device.macAddress !== "Unknown" && (
                              <>
                                <br />
                                <small style={{ color: '#AAAAAA', fontSize: '0.8em' }}>
                                  <i className="fas fa-fingerprint me-2"></i>
                                  {device.macAddress}
                                </small>
                              </>
                            )}
                          </div>
                          <span className={`badge`}
                            style={{ backgroundColor: device.status === "Active" ? '#00FF00' : '#666666', color: '#000' }}>
                            <i className={`fas fa-${device.status === "Active" ? "check" : "times"} me-1`}></i>
                            {device.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-3" style={{ color: '#CCCCCC' }}>
                      <i className="fas fa-search me-2"></i>
                      {isLoading ? "Scanning for devices..." : "No devices found"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bandwidth Usage Graph - Moved to the bottom */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0" style={{ color: '#00FF00' }}>
                    <i className="fas fa-chart-area me-2"></i>
                    Bandwidth Usage
                  </h5>
                  <div className="time-range-buttons">
                    <button
                      className={`btn btn-sm me-2 ${timeRange === '5min' ? 'active' : ''}`}
                      style={{
                        backgroundColor: timeRange === '5min' ? '#00FF00' : 'transparent',
                        color: timeRange === '5min' ? '#000000' : '#CCCCCC',
                        border: timeRange === '5min' ? 'none' : '1px solid #333333'
                      }}
                      onClick={() => handleTimeRangeChange('5min')}
                    >
                      5 Min
                    </button>
                    <button
                      className={`btn btn-sm me-2 ${timeRange === '1hour' ? 'active' : ''}`}
                      style={{
                        backgroundColor: timeRange === '1hour' ? '#00FF00' : 'transparent',
                        color: timeRange === '1hour' ? '#000000' : '#CCCCCC',
                        border: timeRange === '1hour' ? 'none' : '1px solid #333333'
                      }}
                      onClick={() => handleTimeRangeChange('1hour')}
                    >
                      1 Hour
                    </button>
                    <button
                      className={`btn btn-sm ${timeRange === '1day' ? 'active' : ''}`}
                      style={{
                        backgroundColor: timeRange === '1day' ? '#00FF00' : 'transparent',
                        color: timeRange === '1day' ? '#000000' : '#CCCCCC',
                        border: timeRange === '1day' ? 'none' : '1px solid #333333'
                      }}
                      onClick={() => handleTimeRangeChange('1day')}
                    >
                      1 Day
                    </button>
                  </div>
                </div>
                {bandwidthHistory.length > 0 ? (
                  <BandwidthUsageGraph bandwidthHistory={bandwidthHistory} timeRange={timeRange} />
                ) : (
                  <div className="text-center py-5" style={{ color: '#CCCCCC' }}>
                    <i className="fas fa-chart-area mb-3" style={{ fontSize: '2rem' }}></i>
                    <p>No bandwidth data available yet. Data will appear as your connection is monitored.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer text-center py-3" style={{ color: '#CCCCCC' }}>
        <i className="fas fa-clock me-2"></i>
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
        <span className="ms-2">
          {lastUpdated && `(${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago)`}
        </span>
      </div>
    </div>
  )
}

export default Network

