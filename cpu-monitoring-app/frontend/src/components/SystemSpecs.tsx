import React from "react";
import useSystemInfo from "../hooks/useSystemInfo";

const SystemSpecs = () => {
  const { systemInfo, error } = useSystemInfo();

  if (error) {
    return (
      <div className="card bg-transparent text-white mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">System Specifications</h5>
          <div className="text-danger">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="card bg-transparent text-white mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">System Specifications</h5>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-transparent text-white mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3 text-center">System Specifications</h5>
        <ul className="list-group list-group-flush">
        {systemInfo.cpu && (
  <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
    <strong>CPU:</strong>
    <div className="text-end d-flex flex-column" style={{ color: "#00ff00" }}>
      {systemInfo.cpu.split("\n").map((line, index) => (
        <span key={index}>{line}</span>
      ))}
    </div>
  </li>
)}

          {systemInfo.gpu && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
              <strong>GPU:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.gpu}</span>
            </li>
          )}
          {systemInfo.directxVersion && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
              <strong>DirectX Version:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.directxVersion}</span>
            </li>
          )}
          {systemInfo.os && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
              <strong>Operating System:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.os}</span>
            </li>
          )}
          {systemInfo.systemModel && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
              <strong>System Model:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.systemModel}</span>
            </li>
          )}
          {systemInfo.systemManufacturer && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary">
              <strong>System Manufacturer:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.systemManufacturer}</span>
            </li>
          )}
          {systemInfo.computerName && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-transparent text-white border-secondary" 
             
              >
              <strong>Computer Name:</strong>
              <span style={{ color: "#00ff00" }}>{systemInfo.computerName}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SystemSpecs;