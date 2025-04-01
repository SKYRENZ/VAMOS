import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'red', 'pink'];

const BatteryTemperature: React.FC = () => {
  const [temperatureData, setTemperatureData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate battery temperature data for the graph
    const simulatedTemperatureData = [
      { name: '2025-04-01', temp: 32 },
      { name: '2025-04-02', temp: 34 },
      { name: '2025-04-03', temp: 31 },
      { name: '2025-04-04', temp: 35 },
      { name: '2025-04-05', temp: 33 },
      { name: '2025-04-06', temp: 30 },
    ];

    setTemperatureData(simulatedTemperatureData);
  }, []);

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <h5 style={{ color: '#00ff00' }}>Battery Temperature</h5> {/* Title added here */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={temperatureData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip contentStyle={{backgroundColor:"transparent"}} />
          <Legend />
          <Line type="monotone" dataKey="temp" stroke="#00ff00" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BatteryTemperature;
