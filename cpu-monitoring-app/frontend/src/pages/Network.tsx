"use client"

import { useState, useEffect, useRef } from "react"
import "./custom.css"
import { Tooltip } from 'react-tooltip'
import CircularGaugeSpeedTest from '../components/CircularGaugeSpeedTest'
import BandwidthUsageGraph from '../components/BandwidthUsageGraph'
import ConnectionQualityMonitor from '../components/ConnectionQualityMonitor'
import IOMonitor from '../components/IOMonitor'
import DataTransferGraph from '../components/DataTransferGraph'
import TotalDataTransfer from '../components/TotalDataTransfer'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Add CSS for animations
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.delay-1 {
  animation-delay: 0.1s;
}

.delay-2 {
  animation-delay: 0.3s;
}

.delay-3 {
  animation-delay: 0.5s;
}
`;

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

interface IOData {
  uploadSpeed: number
  downloadSpeed: number
  uploadPackets: number
  downloadPackets: number
  activeInterfaces: string[]
  bytesSent: number
  bytesReceived: number
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
  downloadFormatted?: string
  uploadFormatted?: string
}

interface DataTransferPoint {
  timestamp: string;
  totalBytesSent: number;
  totalBytesReceived: number;
  totalBytesSentFormatted: string;
  totalBytesReceivedFormatted: string;
}

interface NetworkProps {
  networkState: {
    speedTestCompleted: boolean;
    speedTestData: SpeedTestResult | null;
    isRunningSpeedTest: boolean;
    scanProgress: number;
    currentPhase: string;
    error: string | null;
    dataReady: boolean;
  };
  setNetworkState: React.Dispatch<React.SetStateAction<{
    speedTestCompleted: boolean;
    speedTestData: SpeedTestResult | null;
    isRunningSpeedTest: boolean;
    scanProgress: number;
    currentPhase: string;
    error: string | null;
    dataReady: boolean;
  }>>;
  onRunSpeedTest: () => Promise<void>;
}

// Add a global variable to store the background fetch interval
let backgroundFetchInterval: number | null = null;

// Add a variable to track if we need a quick refresh after initial test
let needsInitialQuickRefresh = false;

export const Network = ({ networkState, setNetworkState, onRunSpeedTest }: NetworkProps) => {
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
  const [ioData, setIOData] = useState<IOData | null>({
    uploadSpeed: 0,
    downloadSpeed: 0,
    uploadPackets: 0,
    downloadPackets: 0,
    activeInterfaces: [],
    bytesSent: 0,
    bytesReceived: 0
  })
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bandwidthHistory, setBandwidthHistory] = useState<BandwidthDataPoint[]>([])
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [timeRange, setTimeRange] = useState<'5min' | '1hour' | '1day'>('5min')
  const [dataTransferHistory, setDataTransferHistory] = useState<DataTransferPoint[]>([])
  const [totalDataTransfer, setTotalDataTransfer] = useState({
    totalSent: 0,
    totalReceived: 0,
    sentFormatted: "0 B",
    receivedFormatted: "0 B"
  })
  const contentRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const [initialRefreshDone, setInitialRefreshDone] = useState(false);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Export functions
  const exportAsPDF = async () => {
    if (contentRef.current) {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: '#000000'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`network-monitor-report-${new Date().toISOString().split('T')[0]}.pdf`);
    }
    setShowExportDropdown(false);
  };

  const exportAsJPG = async () => {
    if (contentRef.current) {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: '#000000'
      });

      const link = document.createElement('a');
      link.download = `network-monitor-report-${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.8);
      link.click();
    }
    setShowExportDropdown(false);
  };

  const exportAsJSON = () => {
    // Create a simplified version of bandwidthHistory with only the fields we have
    const simplifiedBandwidthHistory = bandwidthHistory.map(item => ({
      timestamp: item.timestamp,
      download: item.download,
      upload: item.upload
    }));

    const jsonData = {
      networkData,
      ioData,
      bandwidthHistory: simplifiedBandwidthHistory,
      latencyHistory,
      speedTestData: networkState.speedTestData,
      totalDataTransfer,
      lastUpdated: lastUpdated?.toISOString(),
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = `network-monitor-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    setShowExportDropdown(false);
  };

  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown);
  };

  // Use effect to watch for speed test completion and trigger a quick refresh
  useEffect(() => {
    // Watch for when speed test completes
    if (networkState.speedTestCompleted && !initialRefreshDone) {
      console.log("Speed test just completed - scheduling quick refresh");
      needsInitialQuickRefresh = true;

      // Immediate fetch to show data right away
      fetchData();

      // Set a quick 10-second refresh to get the most recent data after test
      const quickRefreshTimeout = setTimeout(() => {
        console.log("Running quick 10-second refresh after speed test");
        fetchData();
        setInitialRefreshDone(true);
      }, 10000);

      return () => clearTimeout(quickRefreshTimeout);
    }
  }, [networkState.speedTestCompleted]);

  // Initial data fetch and set up refresh interval
  useEffect(() => {
    // Fetch on mount
    fetchData();

    // Set up global interval for background fetching if not already running
    if (!backgroundFetchInterval) {
      console.log("Setting up background fetch interval");
      backgroundFetchInterval = window.setInterval(fetchData, 30000);
    }

    // Cleanup function
    return () => {
      // Don't clear the interval here to allow background data collection
      // Only clear history when component is unmounted
      fetch(`${API_URL}/clear-history`).catch(err =>
        console.error('Error clearing history:', err)
      );
    };
  }, []);

  // Function to force an immediate data refresh
  const forceRefresh = () => {
    fetchData();
  };

  // Modify fetchData to update UI immediately after speed test
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/all`);
      const data = await response.json();

      setNetworkData(data.networkData);
      setIOData(data.ioData);
      setConnectedDevices(data.connectedDevices);
      setBandwidthHistory(data.bandwidthHistory || []);
      setLatencyHistory(data.latencyHistory || []);
      setDataTransferHistory(data.dataTransferHistory || []);
      setTotalDataTransfer(data.totalDataTransfer ? {
        totalSent: data.totalDataTransfer.sent,
        totalReceived: data.totalDataTransfer.received,
        sentFormatted: data.totalDataTransfer.sentFormatted,
        receivedFormatted: data.totalDataTransfer.receivedFormatted
      } : {
        totalSent: 0,
        totalReceived: 0,
        sentFormatted: "0 B",
        receivedFormatted: "0 B"
      });
      setLastUpdated(new Date(data.lastUpdated));
      setError(null);

      // If we just finished a speed test, make sure to show data immediately
      if (networkState.speedTestCompleted && !networkState.dataReady) {
        console.log("Speed test completed - updating UI immediately");
        setNetworkState(prev => ({
          ...prev,
          dataReady: true
        }));
      }

      // Even if speed test hasn't been run yet, save the data for when it is
      if (!networkState.speedTestCompleted && !networkState.dataReady &&
        data.bandwidthHistory && data.bandwidthHistory.length > 0) {
        console.log("Collecting background data before initial speed test");

        // If we have substantial data, auto-show it without requiring a speed test
        // (e.g., after 5 data points, which would be ~2.5 minutes at 30s intervals)
        if (data.bandwidthHistory.length >= 5) {
          setNetworkState(prev => ({
            ...prev,
            dataReady: true
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError('Failed to fetch network data. Make sure the Python backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Fetch data transfer history
  const fetchDataTransferHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/data-transfer-history?timeframe=${timeRange}`)
      const data = await response.json()
      setDataTransferHistory(data)
    } catch (err) {
      console.error('Error fetching data transfer history:', err)
    }
  }

  // Handle time range change for bandwidth graph
  const handleTimeRangeChange = (newRange: '5min' | '1hour' | '1day') => {
    setTimeRange(newRange)
  }

  // Add a cleanup effect when component is completely unmounted from the app
  useEffect(() => {
    return () => {
      // Clear the interval only when the app is completely closed
      if (backgroundFetchInterval) {
        console.log("Clearing background fetch interval");
        window.clearInterval(backgroundFetchInterval);
        backgroundFetchInterval = null;
      }
    };
  }, []);

  // Fetch bandwidth and data transfer history when time range changes
  useEffect(() => {
    fetchBandwidthHistory()
    fetchDataTransferHistory()
  }, [timeRange])

  const getSignalQuality = (signal: number) => {
    if (signal === 0) return { text: "Not tested", color: "#808080" }
    if (signal >= 95) return { text: "Excellent", color: "#00FF00" }
    if (signal >= 85) return { text: "Very Good", color: "#66FF66" }
    if (signal >= 70) return { text: "Good", color: "#99FF99" }
    if (signal >= 60) return { text: "Fair", color: "#FFCC00" }
    if (signal >= 45) return { text: "Poor", color: "#FF9900" }
    if (signal >= 30) return { text: "Weak", color: "#FF6600" }
    return { text: "Very Weak", color: "#FF3333" }
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
    <div className="page-content d-flex flex-column min-vh-100" style={{
      backgroundColor: '#000000',
      width: '100vw',
      overflowX: 'hidden'
    }}>
      <style>{animationStyles}</style>

      {/* Main content container */}
      <div className="d-flex flex-column align-items-center w-100">
        {/* Capture container */}
        <div className="capture-container" ref={contentRef} style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: '#000000',
          padding: '0 40px 20px 40px'
        }}>
          {/* Header */}
          <div className="mb-4" style={{
            background: 'linear-gradient(to right, rgba(0, 255, 0, 0.15), transparent 80%)',
            borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
            padding: '1.5rem 20px',
            marginBottom: '2rem',
            position: 'relative'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <h1 style={{
                color: '#ffff',
                fontWeight: 'bold',
                margin: 0,
                fontSize: '1.5rem',
                letterSpacing: '0.05em',
              }}>NETWORK MONITOR</h1>

              <div className="position-relative" style={{ zIndex: 1000 }} ref={exportButtonRef}>
                <button
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#00FF00',
                    border: '1px solid #00FF00',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontWeight: 'bold'
                  }}
                  onClick={toggleExportDropdown}
                >
                  <i className="fas fa-download me-2"></i>
                  Export Data
                </button>

                {showExportDropdown && (
                  <div className="position-absolute end-0 mt-1" style={{
                    backgroundColor: '#121212',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    width: '150px',
                    overflow: 'hidden'
                  }}>
                    <button
                      className="btn btn-sm w-100 text-start"
                      style={{ color: '#FFFFFF', padding: '8px 12px', transition: 'all 0.2s ease' }}
                      onClick={exportAsPDF}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <i className="far fa-file-pdf me-2" style={{ color: '#ff4444' }}></i>
                      PDF
                    </button>
                    <button
                      className="btn btn-sm w-100 text-start"
                      style={{ color: '#FFFFFF', padding: '8px 12px', transition: 'all 0.2s ease' }}
                      onClick={exportAsJPG}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <i className="far fa-file-image me-2" style={{ color: '#44aaff' }}></i>
                      JPG
                    </button>
                    <button
                      className="btn btn-sm w-100 text-start"
                      style={{ color: '#FFFFFF', padding: '8px 12px', transition: 'all 0.2s ease' }}
                      onClick={exportAsJSON}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <i className="far fa-file-code me-2" style={{ color: '#ffaa44' }}></i>
                      JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="dashboard-content" style={{ padding: '0 20px' }}>
            <div className="row g-4 mx-0">
              {/* Speed Test Section */}
              <div className="col-12 px-0">
                <div className="card border-0 shadow-lg" style={{
                  backgroundColor: '#121212',
                  ...((!networkState.speedTestCompleted && !networkState.dataReady) && {
                    maxWidth: '900px',
                    margin: '2rem auto'
                  })
                }}>
                  <div className="card-body">
                    <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                      <i className="fas fa-tachometer-alt me-2"></i>
                      Speed Test
                      {!networkState.speedTestCompleted && !networkState.dataReady && (
                        <small style={{ color: '#CCCCCC', fontSize: '0.8rem', marginLeft: '10px' }}>
                          Run a speed test to see all network data
                        </small>
                      )}
                    </h5>

                    <CircularGaugeSpeedTest
                      isRunning={networkState.isRunningSpeedTest}
                      downloadSpeed={networkState.speedTestData?.download || null}
                      uploadSpeed={networkState.speedTestData?.upload || null}
                      ping={networkState.speedTestData?.ping || null}
                      onStartTest={onRunSpeedTest}
                      progress={networkState.scanProgress}
                      currentPhase={networkState.currentPhase}
                    />

                    {networkState.isRunningSpeedTest && (
                      <div className="test-server-info mt-3 text-center">
                        <p style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          {networkState.currentPhase} ({Math.round(networkState.scanProgress)}%)
                        </p>
                      </div>
                    )}

                    {!networkState.isRunningSpeedTest && networkState.speedTestData && networkState.speedTestData.server && (
                      <div className="test-server-info mt-3 text-center">
                        <p style={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                          <i className="fas fa-server me-2"></i>
                          {networkState.speedTestData.server.name && (
                            <>
                              Test Server: <span style={{ color: '#66FF66' }}>{networkState.speedTestData.server.name}</span>
                              <br />
                            </>
                          )}
                          {networkState.speedTestData.server.location && networkState.speedTestData.server.location !== "Unknown" && (
                            <>
                              Location: <span style={{ color: '#66FF66' }}>{networkState.speedTestData.server.location}</span>
                              <br />
                            </>
                          )}
                          {networkState.speedTestData.server.sponsor && networkState.speedTestData.server.sponsor !== "Unknown" && (
                            <>
                              Host: <span style={{ color: '#66FF66' }}>{networkState.speedTestData.server.sponsor}</span>
                              <br />
                            </>
                          )}
                          <small>
                            {networkState.speedTestData.server.distance && (
                              <>Distance: <span style={{ color: '#66FF66' }}>{networkState.speedTestData.server.distance}</span> • </>
                            )}
                            Latency: <span style={{ color: '#66FF66' }}>{networkState.speedTestData.server.latency.toFixed(2)} ms</span>
                          </small>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(networkState.speedTestCompleted || networkState.dataReady) && (
                <>
                  <div className="col-lg-6 px-3 fade-in delay-1"> {/* Added fade-in animation */}
                    <div className="card border-0 shadow-lg h-100" style={{ backgroundColor: '#121212' }}>
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

                  <div className="col-lg-6 px-3 fade-in delay-2"> {/* Added fade-in animation */}
                    <div className="card border-0 shadow-lg h-100" style={{ backgroundColor: '#121212' }}>
                      <div className="card-body">
                        <h5 className="card-title mb-3" style={{ color: '#00FF00' }}>
                          <i className="fas fa-network-wired me-2"></i>
                          Network Performance
                        </h5>

                        <ul className="list-group list-group-flush">
                          <li className="list-group-item d-flex justify-content-between align-items-center"
                            style={{
                              backgroundColor: '#1a1a1a',
                              borderColor: '#333333',
                              borderWidth: '0',
                              padding: '15px 12px',
                              marginBottom: '8px'
                            }}>
                            <span style={{ color: '#00FF00', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              <i className={`fas ${networkData?.connectionType === "Wi-Fi" ? "fa-wifi" : "fa-ethernet"} me-2`}></i>
                              Connection Type
                            </span>
                            <span style={{ color: '#FFFFFF', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {networkData?.connectionType === "wi-fi" ?
                                "Wi-Fi" :
                                networkData?.connectionType === "Ethernet" ?
                                  "Ethernet" : "Wi-Fi"}
                              <div style={{ color: '#CCCCCC', fontSize: '0.85rem', textAlign: 'right', marginTop: '2px' }}>
                                {networkData?.connectionType === "Ethernet" ?
                                  "Wired Connection" :
                                  "Wireless Connection"}
                              </div>
                            </span>
                          </li>
                          <li className="list-group-item d-flex justify-content-between align-items-center border-secondary "
                            style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                            <span style={{ color: '#CCCCCC' }}>
                              <i className="fas fa-stopwatch me-2"></i>
                              Current Ping
                            </span>
                            <span style={{ color: '#00FF00' }}>{networkData?.ping || 0} <small style={{ color: '#CCCCCC' }}>ms</small></span>
                          </li>
                          {networkState.speedTestData && (
                            <li className="list-group-item d-flex justify-content-between align-items-center"
                              style={{ backgroundColor: '#121212', borderColor: '#333333', borderWidth: '0' }}>
                              <span style={{ color: '#66FF66' }}>
                                <i className="fas fa-tachometer-alt me-2"></i>
                                Speed Test Ping
                              </span>
                              <span style={{ color: '#00FF00' }}>{networkState.speedTestData.ping} ms</span>
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
                  </div>

                  <div className="col-12 px-3 fade-in delay-3"> {/* Added fade-in animation */}
                    <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
                      {ioData && (
                        <IOMonitor
                          uploadSpeed={ioData.uploadSpeed}
                          downloadSpeed={ioData.downloadSpeed}
                          uploadPackets={ioData.uploadPackets}
                          downloadPackets={ioData.downloadPackets}
                          activeInterfaces={ioData.activeInterfaces}
                          bytesSent={ioData.bytesSent}
                          bytesReceived={ioData.bytesReceived}
                        />
                      )}
                    </div>
                  </div>

                  <div className="col-12 px-3 fade-in delay-3">
                    <div className="card border-0 shadow-lg" style={{ backgroundColor: '#121212' }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="card-title mb-0" style={{ color: '#00FF00' }}>
                            <i className="fas fa-chart-area me-2"></i>
                            Network Usage
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
                          <BandwidthUsageGraph
                            bandwidthHistory={bandwidthHistory}
                            timeRange={timeRange}
                            totalDataTransfer={totalDataTransfer}
                          />
                        ) : (
                          <div className="text-center py-5" style={{ color: '#CCCCCC' }}>
                            <i className="fas fa-chart-area mb-3" style={{ fontSize: '2rem' }}></i>
                            <p>
                              {networkState.speedTestCompleted ?
                                "No network data available yet. Data will appear as your connection is monitored." :
                                "Run a speed test to start collecting network data."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer text-center py-3 mt-auto" style={{ color: '#CCCCCC' }}>
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

