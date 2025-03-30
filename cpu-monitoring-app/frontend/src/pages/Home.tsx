import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";

const RADIAN = Math.PI / 180;
const cx = 150;
const cy = 200;
const iR = 50;
const oR = 100;
const segments = 10;

const generateColor = (index: number) => {
    const startColor = [173, 255, 168];
    const endColor = [0, 128, 0];
    const r = Math.round(startColor[0] + ((endColor[0] - startColor[0]) * index) / (segments - 1));
    const g = Math.round(startColor[1] + ((endColor[1] - startColor[1]) * index) / (segments - 1));
    const b = Math.round(startColor[2] + ((endColor[2] - startColor[2]) * index) / (segments - 1));
    return `rgb(${r},${g},${b})`;
};

const generateData = () =>
    Array.from({ length: segments }, (_, i) => ({
        name: `Segment ${i + 1}`,
        value: 100 / segments,
        color: generateColor(i),
    }));

const needle = (value: number, cx: number, cy: number, iR: number, oR: number, color: string | undefined) => {
    const ang = 180 - (value * 180) / 100;
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 5;
    const x0 = cx;
    const y0 = cy;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;

    return [
        <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" key="needle-circle" />, 
        <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill={color} key="needle-path" />,
    ];
};

interface GaugeChartProps {
    title: string;
    value: number;
}

const GaugeChart = ({ title, value }: GaugeChartProps) => (
    <div className="d-flex flex-column align-items-center bg-dark">
    <h5 className="mb-0">{title}</h5> {/* Reducing space above the chart */}
    <PieChart width={300} height={180} > {/* Reduced height to remove extra bottom gap */}
        <Pie
            dataKey="value"
            startAngle={180}
            endAngle={0}
            data={generateData()}
            cx={cx}
            cy={130} 
            innerRadius={iR}
            outerRadius={oR}
            stroke="none"
        >
            {generateData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
        </Pie>
        {needle(value, cx, 130, iR, oR, "#d0d000")} {/* Adjust needle position too */}
        <text x={cx} y={160} textAnchor="middle" fontSize={18} fill="#000"> {/* Move text closer */}
            {value}%
        </text>
    </PieChart>
</div>

);


const Home = () => {
    const [cpuUsage, setCpuUsage] = useState(50);
    const [gpuUsage, setGpuUsage] = useState(50);
    const [storageUsage, setStorageUsage] = useState(50);

    useEffect(() => {
        const interval = setInterval(() => {
            setCpuUsage(Math.floor(Math.random() * 101));//dito yung value
            setGpuUsage(Math.floor(Math.random() * 101));
            setStorageUsage(Math.floor(Math.random() * 101));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-transparent text-black vh-100 vw-100 d-flex justify-content-center">
            <div className="d-flex flex-row justify-content-center align-items-start gap-4 mt-3">
                <GaugeChart title="CPU Usage" value={cpuUsage} />
                <GaugeChart title="GPU Usage" value={gpuUsage} />
                <GaugeChart title="Storage Usage" value={storageUsage} />
            </div>
        </div>
    );
    
    
    
    
};

export default Home;
