import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";



const GetStartedButton: React.FC = () => {

    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate("/home"); // Navigate to the home page when the button is clicked
    }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
      <button 
            onClick={handleGetStarted}
            className="position-relative overflow-hidden px-4 py-2 fw-bold text-black rounded transition-all" 
            style={{ fontSize: "1.25rem", backgroundColor: "#00FF00", border: "none"}}>
            Get Started
        <span className="position-absolute top-0 start-0 w-0 h-100 bg-white opacity-25 transition-all" style={{ transition: "width 0.3s" }}></span>
      </button>
    </div>
  );
};

export default GetStartedButton;
