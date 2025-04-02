import { useState, useEffect } from "react";

const useTemperatureData = () => {
  const [cpuTemp, setCpuTemp] = useState(50);
  const [gpuTemp, setGpuTemp] = useState(45);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    const generateMockTemperature = () => {
      const baseTemp = 45;
      const randomVariation = Math.floor(Math.random() * 30);
      return baseTemp + randomVariation;
    };

    const fetchTemperatures = async () => {
      try {
        const cpuResponse = await fetch("http://localhost:5000/cpu-temperature");
        const cpuData = await cpuResponse.json();

        const gpuResponse = await fetch("http://localhost:5000/gpu-temperature");
        const gpuData = await gpuResponse.json();

        if (cpuData.cpu_temperature !== undefined) {
          setCpuTemp(Math.round(cpuData.cpu_temperature));
        }
        if (gpuData.gpu_temperature !== undefined) {
          setGpuTemp(Math.round(gpuData.gpu_temperature));
        }
        setIsUsingMockData(false);
      } catch (error) {
        console.log("Using mock temperature data");
        setIsUsingMockData(true);
        setCpuTemp(generateMockTemperature());
        setGpuTemp(generateMockTemperature() - 5);
      }
    };

    fetchTemperatures();
    const interval = setInterval(fetchTemperatures, 2000);
    return () => clearInterval(interval);
  }, []);

  return { cpuTemp, gpuTemp, isUsingMockData };
};

export default useTemperatureData;