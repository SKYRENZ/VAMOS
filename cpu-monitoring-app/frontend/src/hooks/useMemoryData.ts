import { useState, useEffect } from "react";

export interface MemoryData {
  total: number;
  used: number;
  available: number;
  cached: number;
}

const useMemoryData = () => {
  const [memory, setMemory] = useState<MemoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/memory");
        const data = await response.json();
        setMemory(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching memory data:", err);
        setError("Failed to fetch memory data.");
      }
    };

    fetchMemoryData();
  }, []);

  return { memory, error };
};

export default useMemoryData;