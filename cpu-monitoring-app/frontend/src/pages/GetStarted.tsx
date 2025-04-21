"use client"

import type React from "react"
import { useState } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./logo-animation.css"
import Logo from "../assets/Logo.png" // Import the logo image

const GetStartedButton: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showPulseWave, setShowPulseWave] = useState(false)
  const [showFinalFlash, setShowFinalFlash] = useState(false)
  const [showTravelEffect, setShowTravelEffect] = useState(false)
  const [travelComplete, setTravelComplete] = useState(false)
  const [showBorderGlow, setShowBorderGlow] = useState(false)
  const [initialLogoFading, setInitialLogoFading] = useState(false)

  // Adjust the timing in handleGetStarted to be more balanced
  const handleGetStarted = () => {
    setIsAnimating(true)
    setInitialLogoFading(true) // Start fading the initial logo
    setShowBorderGlow(true) // Show the border glow effect

    // Delay the travel effect to match the original timing
    setTimeout(() => {
      setShowTravelEffect(true)

      // Adjust travel effect completion timing (800ms)
      setTimeout(() => {
        setTravelComplete(true) // Mark travel effect as complete

        // Show logo after travel effect completes
        setTimeout(() => {
          setShowLogo(true) // Show logo after travel effect completes

          // Show particles after logo appears
          setTimeout(() => {
            setShowParticles(true) // Show particles after logo appears

            // Show pulse wave after a moderate delay (800ms)
            setTimeout(() => {
              setShowPulseWave(true) // Show pulse wave in the middle of the animation

              // Show final flash after a moderate delay (800ms)
              setTimeout(() => {
                setShowFinalFlash(true) // Show final flash effect before navigation

                // Navigate after 800ms
                setTimeout(() => {
                  window.location.href = "/home"
                }, 800)
              }, 800)
            }, 800)
          }, 300)
        }, 200)
      }, 800)
    }, 500) // Keep original delay to allow initial logo to fade
  }

  // Adjust the renderParticles function to use more moderate timing
  const renderParticles = () => {
    const particles = []
    const particleCount = 30

    for (let i = 0; i < particleCount; i++) {
      const delay = Math.random() * 1.5 // Moderate delay (between original 2 and previous 1)
      const size = Math.random() * 15 + 8
      const duration = Math.random() * 1.5 + 1.5 // Moderate duration (between original 2+2 and previous 1+1)
      const x = Math.random() * 300 - 150
      const y = Math.random() * 300 - 150

      particles.push(
        <div
          key={i}
          className="particle"
          style={
            {
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `translate(${x}px, ${y}px)`,
              "--x": `${x}px`,
              "--y": `${y}px`,
            } as React.CSSProperties
          }
        />,
      )
    }

    return particles
  }

  // Adjust the renderPulseWaves function to use more moderate timing
  const renderPulseWaves = () => {
    const waves = []
    const waveCount = 3

    for (let i = 0; i < waveCount; i++) {
      const delay = i * 0.3 // Moderate delay (between original 0.5 and previous 0.2)
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

  // Adjust the renderTravelEffect function to use more moderate timing
  const renderTravelEffect = () => {
    const elements = []
    const count = 6 // Number of traveling elements

    for (let i = 0; i < count; i++) {
      const delay = i * 0.08 // Moderate delay (between original 0.1 and previous 0.05)
      const angle = (360 / count) * i // Distribute around a circle
      const radians = angle * (Math.PI / 180)
      const x = Math.cos(radians)
      const y = Math.sin(radians)

      elements.push(
        <div
          key={i}
          className={`travel-element ${travelComplete ? "travel-complete" : ""}`}
          style={
            {
              animationDelay: `${delay}s`,
              "--travel-x": `${x * 100}vw`,
              "--travel-y": `${y * 100}vh`,
            } as React.CSSProperties
          }
        >
          <div className="travel-element-inner"></div>
        </div>,
      )
    }

    return elements
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-black">
      {/* Border glow effect */}
      {showBorderGlow && <div className="page-border-glow"></div>}

      {!showLogo ? (
        <div className="button-container">
          {/* Use flex-column to stack items vertically */}
          <div className="d-flex flex-column align-items-center">
            <img
              src={Logo || "/placeholder.svg"}
              id="logo"
              className={initialLogoFading ? "initial-logo-fade" : ""}
              style={{ height: "200px", width: "350px", marginBottom: "20px" }} // Add margin for spacing
            />
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

            {/* Travel effect container */}
            {showTravelEffect && <div className="travel-effect-container">{renderTravelEffect()}</div>}
          </div>
        </div>
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
