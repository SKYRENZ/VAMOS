"use client"

import { useState, useEffect } from "react"
import "./custom.css"
export const Network = () => {
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [ping, setPing] = useState(0)
  const [packetLoss, setPacketLoss] = useState(0)
  const [networkType, setNetworkType] = useState("Wi-Fi")
  const [signalStrength, setSignalStrength] = useState(85)

  useEffect(() => {
    // Simulate network metrics
    const interval = setInterval(() => {
      setDownloadSpeed(Math.floor(Math.random() * 500) + 100)
      setUploadSpeed(Math.floor(Math.random() * 100) + 50)
      setPing(Math.floor(Math.random() * 30) + 5)
      setPacketLoss(Math.random() * 2)
      setSignalStrength(Math.floor(Math.random() * 20) + 75)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getSignalQuality = () => {
    if (signalStrength > 80) return { text: "Excellent", color: "#00ff00" }
    if (signalStrength > 60) return { text: "Good", color: "#aaff00" }
    if (signalStrength > 40) return { text: "Fair", color: "#ffaa00" }
    return { text: "Poor", color: "#ff0000" }
  }

  const quality = getSignalQuality()

  return (
    <div className="page-content bg-black text-white">
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-12">
              <h1 className="m-0">NETWORK MONITOR</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card bg-dark text-white mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">Connection Status</h5>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="mb-0">{networkType}</h3>
                    <p className="text-muted mb-0">Connected</p>
                  </div>
                  <div className="text-end">
                    <h4 style={{ color: quality.color }}>{quality.text}</h4>
                    <p className="text-muted mb-0">Signal Strength: {signalStrength}%</p>
                  </div>
                </div>

                <div className="progress bg-secondary mb-3">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${signalStrength}%`, backgroundColor: quality.color }}
                    aria-valuenow={signalStrength}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <div className="card bg-dark border-secondary mb-3">
                      <div className="card-body text-center">
                        <h5>Download</h5>
                        <h3 className="text-success mb-0">
                          {downloadSpeed} <small>Mbps</small>
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-dark border-secondary mb-3">
                      <div className="card-body text-center">
                        <h5>Upload</h5>
                        <h3 className="text-success mb-0">
                          {uploadSpeed} <small>Mbps</small>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card bg-dark text-white mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">Network Performance</h5>

                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>Ping</span>
                    <span className="text-success">{ping} ms</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>Packet Loss</span>
                    <span className="text-success">{packetLoss.toFixed(2)}%</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>IP Address</span>
                    <span className="text-success">192.168.1.105</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>DNS Server</span>
                    <span className="text-success">8.8.8.8</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>MAC Address</span>
                    <span className="text-success">A1:B2:C3:D4:E5:F6</span>
                  </li>
                </ul>

                <div className="mt-4">
                  <button className="btn btn-outline-success w-100">Run Speed Test</button>
                </div>
              </div>
            </div>

            <div className="card bg-dark text-white">
              <div className="card-body">
                <h5 className="card-title mb-3">Connected Devices</h5>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>This Device</span>
                    <span className="badge bg-success">Active</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>Smartphone</span>
                    <span className="badge bg-success">Active</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                    <span>Smart TV</span>
                    <span className="badge bg-secondary">Idle</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Network

