import { useState, useEffect } from "react";

interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_usage: number;
}

const useProcesses = (showModal: boolean) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://localhost:5000/processes");
        if (!response.ok) {
          throw new Error(`Failed to fetch processes: ${response.statusText}`);
        }
        const data = await response.json();
        setProcesses(data);
      } catch (error) {
        console.error("Error fetching processes:", error);
        setError("Failed to load processes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (showModal) {
      fetchProcesses();
    }
  }, [showModal]);

  return { processes, loading, error };
};

export default useProcesses;