import React from "react";
import { PieChart, Pie, Cell } from "recharts";

const RADIAN = Math.PI / 180;
const segments = 10;

const generateColor = (index: number) => {
  const startColor = [0, 255, 0]; // Bright green
  const endColor = [0, 100, 0]; // Dark green
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

const needle = (
  value: number,
  cx: number,
  cy: number,
  iR: number,
  oR: number,
  color: string | undefined,
  isGamingMode: boolean
) => {
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
    <circle
      cx={x0}
      cy={y0}
      r={r}
      fill={isGamingMode ? "url(#rgbGradient)" : color}
      stroke="none"
      key="needle-circle"
      className={isGamingMode ? "rgb-needle" : ""}
    />,
    <path
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill={isGamingMode ? "url(#rgbGradient)" : color}
      key="needle-path"
      className={isGamingMode ? "rgb-needle" : ""}
    />,
  ];
};

interface CombinedGaugeChartProps {
  title: string;
  value: number;
  isGamingMode: boolean;
}

const CombinedGaugeChart = ({ title, value, isGamingMode }: CombinedGaugeChartProps) => (
  <div className={`rgb-border-container ${isGamingMode ? "active" : ""}`}>
    <div className="gauge-container">
      <div className="gauge-card">
        <h5 className="gauge-title">{title}</h5>
        <div className="gauge-chart">
          <PieChart width={300} height={250}>
            <defs>
              <linearGradient id="rgbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000">
                  <animate
                    attributeName="stop-color"
                    values="#ff0000; #ffff00; #00ff00; #00ffff; #0000ff; #ff00ff; #ff0000"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#ff00ff">
                  <animate
                    attributeName="stop-color"
                    values="#ff00ff; #ff0000; #ffff00; #00ff00; #00ffff; #0000ff; #ff00ff"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>
            <Pie
              dataKey="value"
              startAngle={180}
              endAngle={0}
              data={generateData()}
              cx={150}
              cy={150}
              innerRadius={100}
              outerRadius={140}
              stroke="none"
            >
              {generateData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {needle(value, 150, 150, 100, 140, "#00ff00", isGamingMode)}
            <text x={150} y={150} textAnchor="middle" dominantBaseline="middle" className="gauge-value">
              {value}
            </text>
            <text x={150} y={175} textAnchor="middle" dominantBaseline="middle" className="gauge-percent">
              %
            </text>
          </PieChart>
        </div>
      </div>
    </div>
  </div>
);

export default CombinedGaugeChart;