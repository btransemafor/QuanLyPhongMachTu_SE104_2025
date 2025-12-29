// components/PatientTable.jsx
import React from 'react';

export default function PatientTable({ data }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuổi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ hẹn</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((patient, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{patient.age}</td>
              <td className="px-6 py-4 whitespace-nowrap">{patient.time}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs ${patient.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : patient.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {patient.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-blue-600 hover:underline">Mở hồ sơ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}