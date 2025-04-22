import { useState } from "react";
import ProcessModal from "./ProcessModal";

const Home = () => {
  const [showProcessModal, setShowProcessModal] = useState(false);

  return (
    <div className="home-container">
      <button
        className="btn btn-primary"
        onClick={() => console.log("Gaming Mode toggled")}
      >
        Gaming Mode
      </button>
      <button
        className="btn btn-success ms-3"
        onClick={() => setShowProcessModal(true)}
      >
        View Processes
      </button>

      <ProcessModal
        showModal={showProcessModal}
        setShowModal={setShowProcessModal}
      />
    </div>
  );
};

export default Home;