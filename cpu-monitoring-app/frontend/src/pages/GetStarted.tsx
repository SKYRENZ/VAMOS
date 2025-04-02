"use client"

import type React from "react"
import { useState } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./logo-animation.css"

const GetStartedButton: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showPulseWave, setShowPulseWave] = useState(false)
  const [showFinalFlash, setShowFinalFlash] = useState(false)

  const handleGetStarted = () => {
    setIsAnimating(true)

    // Animation sequence timeline
    setTimeout(() => {
      setShowLogo(true) // Show logo after button fade out

      setTimeout(() => {
        setShowParticles(true) // Show particles after logo appears

        setTimeout(() => {
          setShowPulseWave(true) // Show pulse wave in the middle of the animation

          setTimeout(() => {
            setShowFinalFlash(true) // Show final flash effect before navigation

            setTimeout(() => {
              window.location.href = "/home" // Navigate to home page after animations complete
            }, 1000) // 1 second after final flash
          }, 1500) // 1.5 seconds after pulse wave
        }, 1500) // 1.5 seconds after particles
      }, 500) // 0.5 seconds after logo appears
    }, 600) // 0.6 seconds for button fade out

    // Total animation time: 0.6 + 0.5 + 1.5 + 1.5 + 1.0 = 5.1 seconds
  }

  // Create particles dynamically
  const renderParticles = () => {
    const particles = []
    const particleCount = 30

    for (let i = 0; i < particleCount; i++) {
      const delay = Math.random() * 2
      const size = Math.random() * 15 + 8
      const duration = Math.random() * 2 + 2
      const x = Math.random() * 300 - 150
      const y = Math.random() * 300 - 150

      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            transform: `translate(${x}px, ${y}px)`,
          }}
        />,
      )
    }

    return particles
  }

  // Create pulse waves dynamically
  const renderPulseWaves = () => {
    const waves = []
    const waveCount = 3

    for (let i = 0; i < waveCount; i++) {
      const delay = i * 0.5 // Stagger the waves

      waves.push(
        <div
          key={i}
          className="pulse-wave"
          style={{
            animationDelay: `${delay}s`,
          }}
        />,
      )
    }

    return waves
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
      {!showLogo ? (
        <button
          onClick={handleGetStarted}
          className={`position-relative overflow-hidden px-5 py-3 fw-bold text-black rounded transition-all ${
            isAnimating ? "button-fade-out" : ""
          }`}
          style={{ fontSize: "1.75rem", backgroundColor: "#00FF00", border: "none" }}
          disabled={isAnimating}
        >
          Get Started
          <span
            className="position-absolute top-0 start-0 w-0 h-100 bg-white opacity-25 transition-all"
            style={{ transition: "width 0.3s" }}
          ></span>
        </button>
      ) : (
        <div className="logo-container">
          {/* Main logo */}
          <div className={`logo-wrapper ${showFinalFlash ? "final-flash" : ""}`}>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo2-removebg-preview-gNeabzzqexGo1PQYYywDECIfErsG2K.png"
              alt="Logo"
              className={`logo ${showFinalFlash ? "final-zoom" : "rotating"}`}
            />

            {/* Glow effect layers */}
            <div className="glow-effect glow-1"></div>
            <div className="glow-effect glow-2"></div>
            <div className="glow-effect glow-3"></div>

            {/* Rotating ring */}
            <div className={`rotating-ring ${showFinalFlash ? "speed-up" : ""}`}></div>

            {/* Pulsing ring */}
            <div className="pulse-ring"></div>
          </div>

          {/* Particles */}
          {showParticles && <div className="particles-container">{renderParticles()}</div>}

          {/* Pulse Waves */}
          {showPulseWave && <div className="pulse-waves-container">{renderPulseWaves()}</div>}

          {/* Final flash overlay */}
          {showFinalFlash && <div className="final-flash-overlay"></div>}
        </div>
      )}
    </div>
  )
}

export default GetStartedButton

