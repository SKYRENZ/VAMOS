import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChargeCycleProps {
  cycles: number;
}

const ChargeCycle: React.FC<ChargeCycleProps> = ({ cycles }) => {
  const [chargeData, setChargeData] = useState<any[]>([]);
  const chartRef = useRef<HTMLDivElement | null>(null); // Reference to the div container
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Simulated charge cycle data
    const simulatedChargeData = [
      { date: '2025-04-01', cycles: 10 },
      { date: '2025-04-02', cycles: 12 },
      { date: '2025-04-03', cycles: 8 },
      { date: '2025-04-04', cycles: 14 },
      { date: '2025-04-05', cycles: 18 },
      { date: '2025-04-06', cycles: 20 },
    ];

    setChargeData(simulatedChargeData);

    // Adjust chart size based on container
    const updateChartDimensions = () => {
      if (chartRef.current) {
        setChartDimensions({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        });
      }
    };

    // Initial sizing
    updateChartDimensions();

    // Add event listener for window resize
    window.addEventListener('resize', updateChartDimensions);

    return () => {
      window.removeEventListener('resize', updateChartDimensions);
    };
  }, []); // Empty dependency array ensures this runs once when the component is mounted

  const data = chargeData.map((entry: any) => ({
    name: entry.date,
    uv: entry.cycles,
  }));

  return (
    <div ref={chartRef} style={{ width: '250px', height: '300px' }}>
      <h5 style={{ color: '#00ff00' }}>Charge Cycles: {cycles}</h5>
      <BarChart
        width={420}
        height={200}
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          contentStyle={{ backgroundColor: 'transparent', border: 'none' }} 
          itemStyle={{ color: 'white' }}  // Change tooltip text color to white
        />
        <Legend />
        <Bar 
          dataKey="uv" 
          name="Charge Cycles" 
          fill="#00ff00" 
          // Removed invalid activeStyle property
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#00ff00" />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
};

export default ChargeCycle;
