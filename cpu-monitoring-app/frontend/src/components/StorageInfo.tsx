import React from "react";
import useDiskData from "../hooks/useDiskData";

const StorageInfo = () => {
  const { disks, error } = useDiskData();

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  return (
    <div className="card bg-dark text-white">
      <div className="card-body">
        <h5 className="card-title mb-3">Storage</h5>
        <ul className="list-group list-group-flush">
          {disks.map((disk, index) => (
            <li key={index} className="list-group-item bg-dark text-white border-secondary">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>{disk.device} ({disk.mountpoint})</span>
                <span className="text-success">
                  {((disk.used / disk.total) * 100).toFixed(1)}% used
                </span>
              </div>
              <div className="progress bg-secondary">
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${disk.percent}%` }}
                  role="progressbar"
                  aria-valuenow={disk.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StorageInfo;