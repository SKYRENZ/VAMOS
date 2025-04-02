import React from "react";

interface UsageBarProps {
  title: string;
  value: number;
  color?: string;
}

export const UsageBar: React.FC<UsageBarProps> = ({ title, value, color = "#00ff00" }) => {
  return (
    <div className="card bg-dark text-white mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">{title}</h5>
          <span className="usage-value">
            {value}
            <span className="text-success">%</span>
          </span>
        </div>
        <div className="progress bg-secondary">
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${value}%`,
              backgroundColor: color,
            }}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>
    </div>
  );
};