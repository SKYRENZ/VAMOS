import { useState, useEffect } from "react";

interface CPUStats {
  cpu_usage: number;
  base_speed_ghz: number;
  sockets: number;
  cores: number;
  logical_processors: number;
  error?: string;
}

const useCPUStats = () => {
  const [cpuStats, setCPUStats] = useState<CPUStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCPUStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/cpu-usage");
        const data: CPUStats = await response.json();
        setCPUStats(data);
      } catch (error) {
        setCPUStats({
          cpu_usage: 0,
          base_speed_ghz: 0,
          sockets: 0,
          cores: 0,
          logical_processors: 0,
          error: "Failed to fetch CPU stats",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCPUStats();
    const interval = setInterval(fetchCPUStats, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return { cpuStats, loading };
};

export default useCPUStats;