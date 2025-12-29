// components/RealtimePanel.jsx
import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

export default function RealtimePanel() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Lịch hẹn mới: BN Nguyễn Văn A', time: '5 phút trước' },
    { id: 2, message: 'Ca trễ: BN Trần Thị B', time: '10 phút trước' },
  ]);

  useEffect(() => {
    // Placeholder realtime: Add random notification every 10s
    const interval = setInterval(() => {
      setNotifications(prev => [...prev, { id: Date.now(), message: 'Cập nhật realtime mới', time: 'Vừa xong' }]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 flex items-center"><BellIcon className="h-5 w-5 mr-2" /> Thông báo Realtime</h3>
      <ul className="space-y-2">
        {notifications.map(notif => (
          <li key={notif.id} className="text-sm text-gray-700">{notif.message} - {notif.time}</li>
        ))}
      </ul>
    </div>
  );
}