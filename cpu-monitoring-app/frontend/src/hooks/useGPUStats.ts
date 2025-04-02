import { useState, useEffect } from "react";

interface GPUStats {
  gpu_clock_mhz?: number;
  vram_clock_mhz?: number;
  error?: string;
}

const useGPUStats = () => {
  const [gpuStats, setGPUStats] = useState<GPUStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGPUStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/gpu-stats");
        const data: GPUStats = await response.json();
        setGPUStats(data);
      } catch (error) {
        setGPUStats({ error: "Failed to fetch GPU stats" });
      } finally {
        setLoading(false);
      }
    };

    fetchGPUStats();
  }, []);

  return { gpuStats, loading };
};

export default useGPUStats;
