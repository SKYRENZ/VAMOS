import React from "react";
import useMemoryData from "../hooks/useMemoryData";

const MemoryInfo = () => {
  const { memory, error } = useMemoryData();

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  if (!memory) {
    return <div>Loading...</div>;
  }

  const { total, used, available, cached } = memory;

  return (
    <div className="card bg-dark text-white">
      <div className="card-body">
        <h5 className="card-title mb-3">Memory</h5>
        <ul className="list-group list-group-flush">
          <li className="list-group-item bg-dark text-white border-secondary">
            <div className="d-flex justify-content-between">
              <span>Total</span>
              <span>{(total / 1024).toFixed(1)} GB</span>
            </div>
          </li>
          <li className="list-group-item bg-dark text-white border-secondary">
            <div className="d-flex justify-content-between">
              <span>Used</span>
              <span>{(used / 1024).toFixed(1)} GB</span>
            </div>
          </li>
          <li className="list-group-item bg-dark text-white border-secondary">
            <div className="d-flex justify-content-between">
              <span>Available</span>
              <span>{(available / 1024).toFixed(1)} GB</span>
            </div>
          </li>
          <li className="list-group-item bg-dark text-white border-secondary">
            <div className="d-flex justify-content-between">
              <span>Cached</span>
              <span>{(cached / 1024).toFixed(1)} GB</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MemoryInfo;