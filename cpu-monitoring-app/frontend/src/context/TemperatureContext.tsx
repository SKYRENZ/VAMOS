// filepath: c:\Users\Renz\OneDrive\Documents\GitHub\Virtual-Machine\cpu-monitoring-app\frontend\src\context\TemperatureContext.tsx
import React, { createContext, useContext, useState } from "react";

interface TemperatureContextProps {
  cpuTemp: number;
  gpuTemp: number;
  gpuStats: {
    gpu_clock_speed: number;
    vram_clock_speed: number;
  };
  isUsingMockData: boolean;
  isDataFetched: boolean;
  setCpuTemp: React.Dispatch<React.SetStateAction<number>>;
  setGpuTemp: React.Dispatch<React.SetStateAction<number>>;
  setGpuStats: React.Dispatch<
    React.SetStateAction<{
      gpu_clock_speed: number;
      vram_clock_speed: number;
    }>
  >;
  setIsUsingMockData: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDataFetched: React.Dispatch<React.SetStateAction<boolean>>;
}

const TemperatureContext = createContext<TemperatureContextProps | undefined>(
  undefined
);

export const TemperatureProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cpuTemp, setCpuTemp] = useState(50);
  const [gpuTemp, setGpuTemp] = useState(45);
  const [gpuStats, setGpuStats] = useState({
    gpu_clock_speed: 0,
    vram_clock_speed: 0,
  });
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  return (
    <TemperatureContext.Provider
      value={{
        cpuTemp,
        gpuTemp,
        gpuStats,
        isUsingMockData,
        isDataFetched,
        setCpuTemp,
        setGpuTemp,
        setGpuStats,
        setIsUsingMockData,
        setIsDataFetched,
      }}
    >
      {children}
    </TemperatureContext.Provider>
  );
};

export const useTemperatureContext = () => {
  const context = useContext(TemperatureContext);
  if (!context) {
    throw new Error(
      "useTemperatureContext must be used within a TemperatureProvider"
    );
  }
  return context;
};