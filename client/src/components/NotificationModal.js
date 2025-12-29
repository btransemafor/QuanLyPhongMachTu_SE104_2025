import React from 'react';

const NotificationModal = ({ text, action, onClose, nameAction }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose} // click ngoài modal đóng
    >
      <div 
        className="bg-white p-6 rounded-xl shadow-lg w-[300px]"
        onClick={(e) => e.stopPropagation()} // chặn click trong modal
      >
        <p className="text-gray-800 text-center mb-4">{text}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Hủy
          </button>

          <button
            onClick={action}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {nameAction || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
