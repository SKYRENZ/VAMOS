import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface PowerDataPoint {
    timestamp: string;
    power: number;
}

const PowerConsumptionGraph: React.FC = () => {
    const [powerHistory, setPowerHistory] = useState<PowerDataPoint[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPowerData = async () => {
        try {
            const response = await fetch("http://localhost:5000/power_consumption");
            const json = await response.json();

            if (json.status === "success") {
                const formattedData: PowerDataPoint = {
                    timestamp: new Date(json.timestamp * 1000).toISOString(),
                    power: json.cpu_power
                };
                setPowerHistory(prev => [...prev.slice(-49), formattedData]); // keep last 50 entries
            }
        } catch (err) {
            console.error("Failed to fetch power data:", err);
        }
    };

    useEffect(() => {
        fetchPowerData(); // initial call
        intervalRef.current = setInterval(fetchPowerData, 5000); // fetch every 5 seconds

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const data = {
        labels: powerHistory.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: "CPU Power (%)",
                data: powerHistory.map(d => d.power),
                borderColor: "#FF4500",
                backgroundColor: "#FF4500",
                tension: 0.4,
                fill: false,
                pointRadius: 3
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: { color: "#fff" }
            }
        },
        scales: {
            x: {
                ticks: { color: "#ccc" }
            },
            y: {
                title: { display: true, text: "CPU Usage (%)", color: "#00FF00" },
                ticks: { color: "#ccc" }
            }
        }
    };

    return (
        <div style={{
            width: '90%',
            margin: '0 auto',
            height: '400px',
            padding: '20px',
            backgroundColor: "#121212",
            borderRadius: "8px"
        }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default PowerConsumptionGraph;
