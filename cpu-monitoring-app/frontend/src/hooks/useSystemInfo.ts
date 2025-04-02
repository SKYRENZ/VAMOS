import { useState, useEffect } from "react";

interface SystemInfo {
  cpu?: string;
  gpu?: string;
  directxVersion?: string;
  os?: string;
  systemModel?: string;
  systemManufacturer?: string;
  computerName?: string;
}

const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch("http://localhost:5000/system-info", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch system information");
        }
        const data = await response.json();
        setSystemInfo(data);
      } catch (err) {
        // Safely handle the error
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    fetchSystemInfo();
  }, []);

  return { systemInfo, error };
};

export default useSystemInfo;