// components/ChartPlaceholder.jsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function ChartPlaceholder({ type = "Line", height = "300px", data = [] }) {
  // BƯỚC 1: Làm sạch dữ liệu
  const cleanedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(item => item && item.date) // Lọc item null/undefined
      .map(item => ({
        date: item.date,
        value: item.value == null ? 0 : Number(item.value)
      }));
  }, [data]);

  // BƯỚC 2: Kiểm tra dữ liệu có hợp lệ không
  if (cleanedData.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center"
      >
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">Chưa có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  }

  // BƯỚC 3: Tính toán domain cho trục Y
  const values = cleanedData.map(d => d.value).filter(v => v > 0);
  const hasData = values.length > 0;
  const maxValue = hasData ? Math.max(...values) : 1000000;
  const minValue = 0;
  
  // Làm tròn maxValue lên bội số của 500k và thêm padding 10%
  const paddedMax = Math.ceil(maxValue * 1.1 / 500000) * 500000;
  const domain = [minValue, paddedMax || 1000000];

  // Format date cho tooltip và axis
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `Ngày ${d}/${m}/${y}`;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* LINE CHART */}
        {type === "Line" && (
          <LineChart 
            data={cleanedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={domain}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={formatDateFull}
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={800}
            />
          </LineChart>
        )}

        {/* BAR CHART */}
        {type === "Bar" && (
          <BarChart 
            data={cleanedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={domain}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={formatDateFull}
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#10B981" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        )}

        {/* PIE CHART */}
        {type === "Pie" && (
          <PieChart>
            <Pie
              data={cleanedData.filter(d => d.value > 0)}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ date, value }) => `${formatDate(date)}: ${formatCurrency(value)}`}
            >
              {cleanedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={formatDateFull}
            />
            <Legend 
              verticalAlign="bottom" 
              height={40}
              formatter={formatDate}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}