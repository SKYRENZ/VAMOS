import useProcesses from "../hooks/useProcesses";

interface ProcessModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
}

const ProcessModal = ({ showModal, setShowModal }: ProcessModalProps) => {
  const { processes, loading, error } = useProcesses(showModal);

  return (
    <>
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-75" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-black text-white border-success">
              <div className="modal-header">
                <h5 className="modal-title">Task Processes</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
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
                      {processes.map((process) => (
                        <tr key={process.pid}>
                          <td>{process.pid}</td>
                          <td>{process.name || "[Unnamed]"}</td>
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
