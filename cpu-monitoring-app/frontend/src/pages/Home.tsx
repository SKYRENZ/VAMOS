"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell } from "recharts"
import "bootstrap/dist/css/bootstrap.min.css"
import "./custom.css" // For custom styling on top of Bootstrap
import StorageInfo from "../components/StorageInfo" // Import the StorageInfo component
import { UsageBar } from "../components/UsageBar";
import useMemoryData from "../hooks/useMemoryData" // Import the custom hook for memory data
import SystemSpecs from "../components/SystemSpecs"; 

const RADIAN = Math.PI / 180
const cx = 150
const cy = 150
const iR = 100
const oR = 140
const segments = 10

// Updated color scheme to green
const generateColor = (index: number) => {
  const startColor = [0, 255, 0] // Bright green
  const endColor = [0, 100, 0] // Dark green
  const r = Math.round(startColor[0] + ((endColor[0] - startColor[0]) * index) / (segments - 1))
  const g = Math.round(startColor[1] + ((endColor[1] - startColor[1]) * index) / (segments - 1))
  const b = Math.round(startColor[2] + ((endColor[2] - startColor[2]) * index) / (segments - 1))
  return `rgb(${r},${g},${b})`
}

const generateData = () =>
  Array.from({ length: segments }, (_, i) => ({
    name: `Segment ${i + 1}`,
    value: 100 / segments,
    color: generateColor(i),
  }))

const needle = (value: number, cx: number, cy: number, iR: number, oR: number, color: string | undefined) => {
  const ang = 180 - (value * 180) / 100
  const length = (iR + 2 * oR) / 3
  const sin = Math.sin(-RADIAN * ang)
  const cos = Math.cos(-RADIAN * ang)
  const r = 5
  const x0 = cx
  const y0 = cy
  const xba = x0 + r * sin
  const yba = y0 - r * cos
  const xbb = x0 - r * sin
  const ybb = y0 + r * cos
  const xp = x0 + length * cos
  const yp = y0 + length * sin

  return [
    <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" key="needle-circle" />,
    <path
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill={color}
      key="needle-path"
    />,
  ]
}

interface GaugeChartProps {
  title: string
  value: number
}

const GaugeChart = ({ title, value }: GaugeChartProps) => (
  <div className="card bg-dark text-white mb-4 gauge-card" >
    <div className="card-body text-center">
      <h5 className="card-title">{title}</h5>
      <div className="gauge-chart">
        <PieChart width={300} height={300}>
          <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={generateData()}
            cx={cx}
            cy={cy +10}
            innerRadius={iR}
            outerRadius={oR}
            stroke="none"
          >
            {generateData().map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {needle(value, cx, cy +10 , iR, oR, "#00ff00")}
          <text x={cx} y={cy +50} textAnchor="middle" dominantBaseline="middle" className="gauge-value">
            {value}
          </text>
          <text x={cx} y={cy + 75} textAnchor="middle" dominantBaseline="middle" className="gauge-percent">
            %
          </text>
        </PieChart>
      </div>
    </div>
  </div>
)

const TemperatureBar = () => {
  const [cpuTemp, setCpuTemp] = useState(50);
  const [gpuTemp, setGpuTemp] = useState(45);
  const [gpuStats, setGpuStats] = useState({
    gpu_clock_speed: 0,
    vram_clock_speed: 0
  });
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    const generateMockTemperature = () => {
      const baseTemp = 45;
      const randomVariation = Math.floor(Math.random() * 30);
      return baseTemp + randomVariation;
    };

    const fetchTemperatures = async () => {
      try {
        // Fetch CPU temperature
        const cpuResponse = await fetch("http://localhost:5000/cpu-temperature", {
          headers: { Accept: "application/json" },
        });
        const cpuData = await cpuResponse.json();
        
        // Fetch GPU temperature
        const gpuResponse = await fetch("http://localhost:5000/gpu-temperature", {
          headers: { Accept: "application/json" },
        });
        const gpuData = await gpuResponse.json();

        // Fetch GPU stats (clock speeds)
        const gpuStatsResponse = await fetch("http://localhost:5000/gpu-stats", {
          headers: { Accept: "application/json" },
        });
        const gpuStatsData = await gpuStatsResponse.json();

        if (cpuData.cpu_temperature !== undefined) {
          setCpuTemp(Math.round(cpuData.cpu_temperature));
        }
        if (gpuData.gpu_temperature !== undefined) {
          setGpuTemp(Math.round(gpuData.gpu_temperature));
        }
        if (gpuStatsData.gpu_clock_speed !== undefined && gpuStatsData.vram_clock_speed !== undefined) {
          setGpuStats({
            gpu_clock_speed: gpuStatsData.gpu_clock_speed,
            vram_clock_speed: gpuStatsData.vram_clock_speed
          });
        }
        setIsUsingMockData(false);
      } catch (error) {
        console.log("Using mock temperature data");
        setIsUsingMockData(true);
        setCpuTemp(generateMockTemperature());
        setGpuTemp(generateMockTemperature() - 5);
        setGpuStats({
          gpu_clock_speed: Math.floor(Math.random() * 500) + 1200, // Random between 1200-1700
          vram_clock_speed: Math.floor(Math.random() * 1000) + 5000 // Random between 5000-6000
        });
      }
    };

    fetchTemperatures();
    const interval = setInterval(fetchTemperatures, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card bg-dark text-white">
      <div className="card-body">
        <h5 className="card-title mb-3">
          Temperature {isUsingMockData && <span className="badge bg-warning text-dark">Mock</span>}
        </h5>
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
            <span>CPU Temperature</span>
            <span className={cpuTemp > 80 ? "text-danger" : "text-success"}>
              {cpuTemp} °C
            </span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
            <span>GPU Temperature</span>
            <span className={gpuTemp > 80 ? "text-danger" : "text-success"}>
              {gpuTemp} °C
            </span>
          </li>
          
          <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
            <span>GPU Clock</span>
            <span className="text-success">{gpuStats.gpu_clock_speed} MHz</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
            <span>VRAM Clock</span>
            <span className="text-success">{gpuStats.vram_clock_speed} MHz</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

    


const Home = () => {
  const [cpuUsage, setCpuUsage] = useState(50);
  const [gpuUsage, setGpuUsage] = useState(30);
  const { memory, error: memoryError } = useMemoryData();

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        // Fetch CPU usage (matches your backend response)
        const cpuResponse = await fetch("http://localhost:5000/cpu-usage");
        const cpuData = await cpuResponse.json();
        setCpuUsage(cpuData.cpu_usage || 0);  // Changed from 'usage' to 'cpu_usage'

        // Fetch GPU usage (matches your backend response)
        const gpuResponse = await fetch("http://localhost:5000/gpu-usage");
        const gpuData = await gpuResponse.json();
        // Handles both success and error cases from your backend
        setGpuUsage(gpuData.gpu_usage_percent ?? 0); 
      } catch (error) {
        console.error("Error fetching usage data:", error);
        setCpuUsage(0);
        setGpuUsage(0);
      }
    };

    fetchUsageData();
    const interval = setInterval(fetchUsageData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black text-white min-vh-100">
      <div className="dashboard-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="m-0">SYSTEM MONITOR</h1>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-md-end justify-content-start mt-3 mt-md-0">
                <div className="me-4">
                  <span className="me-2">Scenario:</span>
                  <select className="form-select form-select-sm bg-black text-success border-success">
                    <option>Balanced</option>
                    <option>Performance</option>
                    <option>Silent</option>
                  </select>
                </div>
                <div>
                  <span className="me-2">Gaming Mode:</span>
                  <select className="form-select form-select-sm bg-black text-success border-success">
                    <option>OFF</option>
                    <option>ON</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        <h2 className="section-title mb-4">Monitor</h2>

        <div className="row">
          <div className="col-lg-4 mb-4">
            <GaugeChart title="CPU Usage" value={cpuUsage} />
            <GaugeChart title="GPU Usage" value={gpuUsage} />
          </div>

          <div className="col-lg-4 mb-4">
            {memoryError ? (
              <div className="text-danger">Error: {memoryError}</div>
            ) : memory ? (
              <>
                <UsageBar
                  title="Memory Usage"
                  value={parseFloat(((memory.used / memory.total) * 100).toFixed(1))} // Fix: Convert string to number
                  color="#00cc00"
                />
                <div className="mt-3">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item bg-dark text-white border-secondary">
                      <div className="d-flex justify-content-between">
                        <span>Total</span>
                        <span>{(memory.total / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                    </li>
                    <li className="list-group-item bg-dark text-white border-secondary">
                      <div className="d-flex justify-content-between">
                        <span>Used</span>
                        <span>{(memory.used / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                    </li>
                    <li className="list-group-item bg-dark text-white border-secondary">
                      <div className="d-flex justify-content-between">
                        <span>Available</span>
                        <span>{(memory.available / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                    </li>
                    <li className="list-group-item bg-dark text-white border-secondary">
                      <div className="d-flex justify-content-between">
                        <span>Cached</span>
                        <span>{(memory.cached / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div>Loading...</div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="row">
              <div className="col-12 mb-4">
                <SystemSpecs /> {/* Updated SystemSpecs */}
              </div>
              <div className="col-12 mb-4">
                <StorageInfo /> {/* Keep the StorageInfo component */}
              </div>
              <div className="col-12">
                <TemperatureBar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;