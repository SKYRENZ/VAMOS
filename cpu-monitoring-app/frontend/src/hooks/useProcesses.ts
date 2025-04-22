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
    let interval: NodeJS.Timeout;

    const fetchProcesses = async () => {
      try {
        setError(null);
        const response = await fetch("http://localhost:5000/processes");
        if (!response.ok) {
          throw new Error(`Failed to fetch processes: ${response.statusText}`);
        }
        const data = await response.json();
        setProcesses(data.processes || []); // Extract the processes array
      } catch (error) {
        console.error("Error fetching processes:", error);
        setError("Failed to load processes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (showModal) {
      fetchProcesses(); // Fetch immediately when the modal is shown
      interval = setInterval(fetchProcesses, 1000); // Fetch every second
    }

    return () => {
      if (interval) clearInterval(interval); // Clear interval when the modal is closed
    };
  }, [showModal]);

  return { processes, loading, error };
};

export default useProcesses;