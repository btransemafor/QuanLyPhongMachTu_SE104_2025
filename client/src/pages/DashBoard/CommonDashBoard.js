// pages/CommonDashboard.jsx (chung, nhưng customize via props or context)
import React from 'react';
import StatCard from './StatCard';
import PatientTable from './PatientTable';
import RealtimePanel from './RealtimePanel';

const placeholderPatients = [
  { name: 'Nguyễn Văn A', age: 30, time: '08:00', status: 'waiting' },
  { name: 'Trần Thị B', age: 45, time: '09:00', status: 'done' },
  { name: 'Lê Văn C', age: 25, time: '10:00', status: 'late' },
];

export default function CommonDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard Phòng Mạch</h1>
        <div className="flex items-center space-x-4">
          <span>Chào Admin • 03/12/2025</span>
          <button className="text-blue-600">Logout</button>
        </div>
      </header>
      <main className="p-6 flex flex-col lg:flex-row gap-6">
        <section className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Bệnh nhân đang chờ" value="12" icon="clock" />
            <StatCard label="Lịch hẹn hôm nay" value="25" icon="calendar" />
            <StatCard label="Hóa đơn chưa thanh toán" value="5" icon="dollar" />
            <StatCard label="Số ca đã xử lý" value="18" icon="check" />
          </div>
          <h2 className="text-lg font-semibold">Lịch hẹn hôm nay</h2>
          <PatientTable data={placeholderPatients} />
          <h2 className="text-lg font-semibold">Danh sách bệnh nhân đang chờ</h2>
          <PatientTable data={placeholderPatients.filter(p => p.status === 'waiting')} />
        </section>
        <aside className="lg:w-1/4">
          <RealtimePanel />
        </aside>
      </main>
    </div>
  );
}