import { useState, useEffect } from "react";
import useProcesses from "../hooks/useProcesses";

interface ProcessModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
}

const ProcessModal = ({ showModal, setShowModal }: ProcessModalProps) => {
  const { processes, loading, error } = useProcesses(showModal);
  const [sortBy, setSortBy] = useState<"cpu" | "memory">("cpu"); // State to track sorting criteria
  const [gamingModeStatus, setGamingModeStatus] = useState(false); // State for Gaming Mode status

  // Fetch Gaming Mode status when the modal is opened
  useEffect(() => {
    const fetchGamingModeStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/gaming-mode/status");
        if (!response.ok) {
          throw new Error("Failed to fetch Gaming Mode status");
        }
        const data = await response.json();
        setGamingModeStatus(data.gaming_mode);
      } catch (error) {
        console.error("Error fetching Gaming Mode status:", error);
      }
    };

    if (showModal) {
      fetchGamingModeStatus();
    }
  }, [showModal]);

  // Sort processes dynamically based on the selected criteria
  const sortedProcesses = [...processes].sort((a, b) => {
    if (sortBy === "cpu") {
      return b.cpu_percent - a.cpu_percent; // Sort by CPU usage (descending)
    } else {
      return b.memory_usage - a.memory_usage; // Sort by memory usage (descending)
    }
  });

  return (
    <>
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-75" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-black text-white border-success">
              <div className="modal-header">
                <h5 className="modal-title">Task Processes</h5>
              </div>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {/* Gaming Mode Status */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="badge bg-success">
                      Gaming Mode: {gamingModeStatus ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <button
                      className={`btn btn-sm me-2 ${
                        sortBy === "cpu" ? "btn-success" : "btn-outline-success"
                      }`}
                      onClick={() => setSortBy("cpu")}
                    >
                      Sort by CPU Usage
                    </button>
                    <button
                      className={`btn btn-sm ${
                        sortBy === "memory" ? "btn-success" : "btn-outline-success"
                      }`}
                      onClick={() => setSortBy("memory")}
                    >
                      Sort by Memory Usage
                    </button>
                  </div>
                </div>

                {/* Processes Table */}
                {loading ? (
                  <p>Loading processes...</p>
                ) : error ? (
                  <p className="text-danger">{error}</p>
                ) : processes.length > 0 ? (
                  <table className="table table-dark table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>PID</th>
                        <th>Process Name</th>
                        <th>CPU Usage (%)</th>
                        <th>Memory Usage (MB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProcesses.map((process) => (
                        <tr key={process.pid}>
                          <td>{process.pid}</td>
                          <td>{process.name || "[Unnamed]"}</td> {/* Handle empty names */}
                          <td>{process.cpu_percent.toFixed(2)}</td>
                          <td>{(process.memory_usage / 1024 / 1024).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No processes found.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProcessModal;