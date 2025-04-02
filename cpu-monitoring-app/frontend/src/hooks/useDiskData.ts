import { useState, useEffect } from "react";

export interface Disk {
  device: string;
  mountpoint: string;
  total: number;
  used: number;
  percent: number;
}

const useDiskData = () => {
  const [disks, setDisks] = useState<Disk[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisks = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/disks");
        const data = await response.json();
        setDisks(data.disks || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching disk data:", err);
        setError("Failed to fetch disk data.");
      }
    };

    fetchDisks();
  }, []);

  return { disks, error };
};

export default useDiskData;