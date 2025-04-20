"use client"

import { useState, useEffect } from "react"
import { Spinner } from "react-bootstrap"

interface GamingModeStatus {
  gaming_mode: boolean
}

interface GamingModeProps {
  className?: string
}

const GamingMode = ({ className = "" }: GamingModeProps) => {
  const [isGamingMode, setIsGamingMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"
  const apiUrl = `${API_BASE_URL}/gaming-mode`

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/status`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: GamingModeStatus = await response.json()
        setIsGamingMode(data.gaming_mode)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to fetch status: ${errorMessage}`)
        console.error(`Failed to fetch status: ${errorMessage}`)
      }
    }

    fetchStatus()
    // Set up polling interval
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [apiUrl])

  const handleToggle = async () => {
    if (loading) return // Prevent multiple clicks while loading

    setLoading(true)
    setError("")

    try {
      const endpoint = isGamingMode ? "disable" : "enable"
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setIsGamingMode((prev) => !prev)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to update gaming mode: ${errorMessage}`)
      console.error(`Failed to update gaming mode: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`gaming-mode-selector ${className} ${isGamingMode ? "gaming-mode-active" : ""}`}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      aria-pressed={isGamingMode}
    >
      <div className="d-flex align-items-center">
        <span className="me-2">Gaming Mode:</span>
        <div className="gaming-mode-button">
          <span className={`gaming-mode-status ${isGamingMode ? "on" : "off"}`}>{isGamingMode ? "ON" : "OFF"}</span>
          {isGamingMode && <div className="gaming-mode-indicator ms-1"></div>}
          {loading && <Spinner animation="border" size="sm" className="ms-2" />}
        </div>
      </div>
      {error && <div className="gaming-mode-error">{error}</div>}
    </div>
  )
}

export default GamingMode
