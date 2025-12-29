// components/Timeline.jsx (for Doctor)
import React from 'react';

export default function Timeline({ data }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <ol className="relative border-l border-gray-200">
        {data.map((item, index) => (
          <li key={index} className="mb-10 ml-4">
            <div className="absolute w-3 h-3 bg-blue-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <time className="mb-1 text-sm font-normal leading-none text-gray-400">{item.time}</time>
            <h3 className="text-lg font-semibold text-gray-900">{item.name} ({item.age})</h3>
            <p className="mb-4 text-base font-normal text-gray-500">{item.symptom}</p>
            <span className={`text-sm ${item.status === 'waiting' ? 'text-yellow-600' : 'text-green-600'}`}>{item.status}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}