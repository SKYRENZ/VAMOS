"use client"

import { useEffect, useState } from "react"

interface VamosHeaderProps {
  isGamingMode: boolean
}

const VamosHeader = ({ isGamingMode }: VamosHeaderProps) => {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Start animation after component mounts
    setAnimate(true)

    // Optional: create a pulsing effect
    const interval = setInterval(() => {
      setAnimate((prev) => !prev)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="vamos-container">
      <div className={`vamos-graphic left ${isGamingMode ? "gaming-mode" : ""} ${animate ? "animate" : ""}`}>
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M120 30H90L105 0L120 30Z" className="tech-shape" />
          <path d="M90 30H60L75 60L90 30Z" className="tech-shape" />
          <path d="M75 15H45L60 45L75 15Z" className="tech-shape" />
          <circle cx="60" cy="30" r="5" className="tech-circle" />
          <line x1="0" y1="30" x2="60" y2="30" className="tech-line" />
          <line x1="60" y1="10" x2="60" y2="50" className="tech-line" />
        </svg>
      </div>

      <div className={`vamos-text ${isGamingMode ? "gaming-mode" : ""}`}>VAMOS</div>

      <div className={`vamos-graphic right ${isGamingMode ? "gaming-mode" : ""} ${animate ? "animate" : ""}`}>
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 30H30L15 0L0 30Z" className="tech-shape" />
          <path d="M30 30H60L45 60L30 30Z" className="tech-shape" />
          <path d="M45 15H75L60 45L45 15Z" className="tech-shape" />
          <circle cx="60" cy="30" r="5" className="tech-circle" />
          <line x1="120" y1="30" x2="60" y2="30" className="tech-line" />
          <line x1="60" y1="10" x2="60" y2="50" className="tech-line" />
        </svg>
      </div>
    </div>
  )
}

export default VamosHeader
