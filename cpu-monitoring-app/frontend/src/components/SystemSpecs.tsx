import React from "react";
import useSystemInfo from "../hooks/useSystemInfo";

const SystemSpecs = () => {
  const { systemInfo, error } = useSystemInfo();

  if (error) {
    return (
      <div className="card bg-dark text-white mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">System Specifications</h5>
          <div className="text-danger">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="card bg-dark text-white mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">System Specifications</h5>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-dark text-white mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3 text-center">System Specifications</h5>
        <ul className="list-group list-group-flush">
          {systemInfo.cpu && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>CPU:</strong>
              <span className="text-success">{systemInfo.cpu}</span>
            </li>
          )}
          {systemInfo.gpu && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>GPU:</strong>
              <span className="text-success">{systemInfo.gpu}</span>
            </li>
          )}
          {systemInfo.directxVersion && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>DirectX Version:</strong>
              <span className="text-success">{systemInfo.directxVersion}</span>
            </li>
          )}
          {systemInfo.os && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>Operating System:</strong>
              <span className="text-success">{systemInfo.os}</span>
            </li>
          )}
          {systemInfo.systemModel && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>System Model:</strong>
              <span className="text-success">{systemInfo.systemModel}</span>
            </li>
          )}
          {systemInfo.systemManufacturer && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>System Manufacturer:</strong>
              <span className="text-success">{systemInfo.systemManufacturer}</span>
            </li>
          )}
          {systemInfo.computerName && (
            <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
              <strong>Computer Name:</strong>
              <span className="text-success">{systemInfo.computerName}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SystemSpecs;