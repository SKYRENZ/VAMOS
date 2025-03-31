"use client"

import { useState, useEffect } from "react"
import "./custom.css"
import { Tooltip } from 'react-tooltip'
import SpeedTestProgress from '../components/SpeedTestProgress'

const API_URL = 'http://localhost:5000/api'

interface NetworkData {
  connectionType: string
  signalStrength: number
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  packetLoss: number
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

export const Network = () => {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null)
  const [speedTestData, setSpeedTestData] = useState<SpeedTestResult | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false)
  const [speedTestPhase, setSpeedTestPhase] = useState<'preparing' | 'download' | 'upload' | 'complete'>('preparing')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch all network data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/all`)
      const data = await response.json()

      setNetworkData(data.networkData)
      setConnectedDevices(data.connectedDevices)
      setLastUpdated(new Date(data.lastUpdated))
      setError(null)
    } catch (err) {
      console.error('Error fetching network data:', err)
      setError('Failed to fetch network data. Make sure the Python backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  // Run speed test
  const handleRunSpeedTest = async () => {
    try {
      setIsRunningSpeedTest(true)
      setSpeedTestData(null)

      // Simulate phases (in reality, these would come from the backend)
      setSpeedTestPhase('preparing')
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSpeedTestPhase('download')
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSpeedTestPhase('upload')
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch(`${API_URL}/speedtest`)
      const data = await response.json()
      setSpeedTestData(data)
      setSpeedTestPhase('complete')
    } catch (err) {
      console.error('Error running speed test:', err)
      setError('Failed to run speed test.')
    } finally {
      setIsRunningSpeedTest(false)
    }
  }

  // Initial data fetch and set up refresh interval
  useEffect(() => {
    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const getSignalQuality = (signal: number) => {
    if (signal > 80) return { text: "Excellent", color: "#00ff00" }
    if (signal > 60) return { text: "Good", color: "#aaff00" }
    if (signal > 40) return { text: "Fair", color: "#ffaa00" }
    return { text: "Poor", color: "#ff0000" }
  }

  const formatSpeed = (speed: number) => {
    return speed.toFixed(1)
  }

  const formatIP = (ip: string | undefined) => {
    return ip || "Not available"
  }

  if (isLoading && !networkData) {
    return (
      <div className="page-content" style={{ backgroundColor: '#000000' }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading network data...</p>
        </div>
      </div>
    )
  }

  if (error && !networkData) {
    return (
      <div className="page-content" style={{ backgroundColor: '#000000' }}>
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchData}>Retry</button>
        </div>
      </div>
    )
  }

  const quality = getSignalQuality(networkData?.signalStrength || 0)

  return (
    <div className="page-content" style={{ backgroundColor: '#000000' }}>
      <div className="dashboard-header" style={{ borderBottom: '1px solid #00ff00' }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-12">
              <h1 className="m-0" style={{ color: '#00ff00', fontWeight: 'normal' }}>NETWORK MONITOR</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card mb-4 border-0 shadow-lg" style={{ backgroundColor: '#1E2124' }}>
              <div className="card-body">
                <h5 className="card-title mb-3 d-flex align-items-center" style={{ color: '#00ff00' }}>
                  <i className="fas fa-wifi me-2"></i>
                  Connection Status
                </h5>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="mb-0" style={{ color: '#808080' }}>{networkData?.connectionType || "Unknown"}</h3>
                    <p style={{ color: '#808080' }}>Connected</p>
                  </div>
                  <div className="text-end">
                    <h4 style={{ color: quality.color }}>{quality.text}</h4>
                    <p style={{ color: '#808080' }}>Signal Strength: {networkData?.signalStrength || 0}%</p>
                  </div>
                </div>

                <div className="progress" style={{ backgroundColor: '#000000', height: "10px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${networkData?.signalStrength || 0}%`,
                      backgroundColor: quality.color,
                      transition: 'width 0.5s ease-in-out'
                    }}
                    aria-valuenow={networkData?.signalStrength || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>

                <div className="row">
                  <div className="col-12 mb-3">
                    <div className="card" style={{ backgroundColor: '#1E2124' }} data-tooltip-id="current-usage-tooltip">
                      <div className="card-body">
                        <h5 className="text-center mb-3" style={{ color: '#00ff00' }}>
                          <i className="fas fa-chart-line me-2"></i>
                          Current Network Usage
                        </h5>
                        <div className="row">
                          <div className="col-6">
                            <div className="text-center">
                              <h6 style={{ color: '#808080' }}>Download</h6>
                              <h4 className="mb-0 display-6" style={{ color: '#00ff00' }}>
                                {formatSpeed(networkData?.downloadSpeed || 0)} <small style={{ color: '#808080' }}>Mbps</small>
                              </h4>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center">
                              <h6 style={{ color: '#808080' }}>Upload</h6>
                              <h4 className="mb-0 display-6" style={{ color: '#00ff00' }}>
                                {formatSpeed(networkData?.uploadSpeed || 0)} <small style={{ color: '#808080' }}>Mbps</small>
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Tooltip id="current-usage-tooltip" place="top">
                      Shows the actual bandwidth being used right now by all network activity
                    </Tooltip>
                  </div>

                  {speedTestData && (
                    <div className="col-12">
                      <div className="card" style={{ backgroundColor: '#1E2124' }} data-tooltip-id="speed-test-tooltip">
                        <div className="card-body">
                          <h5 className="text-center mb-3" style={{ color: '#00ff00' }}>
                            <i className="fas fa-tachometer-alt me-2"></i>
                            Maximum Speed (Last Test)
                          </h5>
                          <div className="row">
                            <div className="col-6">
                              <div className="text-center">
                                <h6 style={{ color: '#4CAF50' }}>Download</h6>
                                <h4 className="mb-0 display-6" style={{ color: '#00ff00' }}>
                                  {formatSpeed(speedTestData.download)} <small>Mbps</small>
                                </h4>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <h6 style={{ color: '#4CAF50' }}>Upload</h6>
                                <h4 className="mb-0 display-6" style={{ color: '#00ff00' }}>
                                  {formatSpeed(speedTestData.upload)} <small>Mbps</small>
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Tooltip id="speed-test-tooltip" place="bottom">
                        Shows your connection's maximum capability as measured by the speed test
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card mb-4 border-0 shadow-lg" style={{ backgroundColor: '#1E2124' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#00ff00' }}>
                  <i className="fas fa-network-wired me-2"></i>
                  Network Performance
                </h5>

                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-cente border-secondary "
                    style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                    <span style={{ color: '#808080'}}>
                      <i className="fas fa-stopwatch me-2"></i>
                      Current Ping
                    </span>
                    <span style={{ color: '#00ff00' }}>{networkData?.ping || 0} <small style={{ color: '#808080' }}>ms</small></span>
                  </li>
                  {speedTestData && (
                    <li className="list-group-item d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                      <span style={{ color: '#4CAF50' }}>
                        <i className="fas fa-tachometer-alt me-2"></i>
                        Speed Test Ping
                      </span>
                      <span style={{ color: '#00ff00' }}>{speedTestData.ping} ms</span>
                    </li>
                  )}
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                    <span style={{ color: '#808080' }}>
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Packet Loss
                    </span>
                    <span style={{ color: networkData?.packetLoss === 0 ? '#00ff00' : '#ffaa00' }}>
                      {networkData?.packetLoss || 0}%
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                    <span style={{ color: '#808080' }}>
                      <i className="fas fa-globe me-2"></i>
                      IP Address
                    </span>
                    <span style={{ color: '#00ff00' }}>{formatIP(networkData?.ipAddress)}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                    <span style={{ color: '#808080' }}>
                      <i className="fas fa-server me-2"></i>
                      DNS Server
                    </span>
                    <span style={{ color: '#00ff00' }}>{formatIP(networkData?.dnsServer)}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#1E2124', borderColor: '#00ff00', borderWidth: '0' }}>
                    <span style={{ color: '#808080' }}>
                      <i className="fas fa-microchip me-2"></i>
                      MAC Address
                    </span>
                    <span style={{ color: '#00ff00' }}>{networkData?.macAddress || "Not available"}</span>
                  </li>
                </ul>

                <div className="mt-4">
                  {(isRunningSpeedTest || speedTestData) ? (
                    <SpeedTestProgress
                      isRunning={isRunningSpeedTest}
                      currentPhase={speedTestPhase}
                      downloadSpeed={speedTestData?.download || null}
                      uploadSpeed={speedTestData?.upload || null}
                      ping={speedTestData?.ping || null}
                    />
                  ) : (
                    <button
                      className="btn w-100"
                      onClick={handleRunSpeedTest}
                      disabled={isRunningSpeedTest}
                      data-tooltip-id="speed-test-button-tooltip"
                      style={{
                        backgroundColor: '#1E2124',
                        color: '#00ff00',
                        border: '1px solid #00ff00'
                      }}
                    >
                      <i className="fas fa-tachometer-alt me-2"></i>
                      Run Speed Test
                    </button>
                  )}
                  <Tooltip id="speed-test-button-tooltip">
                    Measures your connection's maximum download and upload speeds
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-lg" style={{ backgroundColor: '#1E2124' }}>
              <div className="card-body">
                <h5 className="card-title mb-3" style={{ color: '#808080' }}>
                  <i className="fas fa-laptop-house me-2"></i>
                  Connected Devices
                </h5>
                <div className="connected-devices-list">
                  {connectedDevices.map((device, index) => (
                    <div
                      key={device.id}
                      className="device-card p-3 mb-2 rounded"
                      style={{
                        backgroundColor: '#1E2124',
                        border: '1px solid #00ff00'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold" style={{ color: '#00ff00' }}>
                            <i className="fas fa-desktop me-2"></i>
                            {device.name}
                          </span>
                          <br />
                          <small style={{ color: '#808080' }}>
                            <i className="fas fa-network-wired me-2"></i>
                            {device.ipAddress}
                          </small>
                        </div>
                        <span className={`badge ${device.status === "Active" ? "bg-success" : "bg-secondary"}`}
                          style={{ backgroundColor: device.status === "Active" ? '#00ff00' : '#4CAF50', color: '#000' }}>
                          <i className={`fas fa-${device.status === "Active" ? "check" : "times"} me-1`}></i>
                          {device.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer text-center py-3" style={{ color: '#808080' }}>
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

