import React, { useEffect, useState } from "react";
import { Drawer, Spin, Empty } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Pill,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CloseOutlined } from "@ant-design/icons";
const severityColor = {
  Nhẹ: "bg-green-100 text-green-800 border-green-200",
  "Trung bình": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Nặng: "bg-red-100 text-red-800 border-red-200",
  "Rất nặng": "bg-purple-100 text-purple-800 border-purple-200",
};

const PatientHistoryDrawer = ({ patientId, visible, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [name, setName] = useState(null)


  useEffect(() => {
    if (visible && patientId) {
      setLoading(true);
      axios
        .get(`/api/patients/${patientId}/medical-history`)
        .then((res) => {
          if (res.data.success) {
            const sorted = res.data.data.histories.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            setHistory(sorted);

            setName(res.data.data.patient_name)
            if (sorted.length > 0) setExpandedId(sorted[0].medical_record_id); // mở lần mới nhất
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId, visible]);

  const formatDate = (d) => dayjs(d).format("DD/MM/YYYY");
  const formatTime = (d) => dayjs(d).format("HH:mm");

  return (
    <Drawer
      title={null}
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      closable={false}
      closeIcon={
        <CloseOutlined
          className="text-lg text-white"
          style={{
            background: "#0e1182ff",
            borderRadius: "50%", // tròn
            padding: "10px",
          }}
        />
      }
    >
      {/* Custom Header */}
      <div className="border-b border-gray-200 pb-5 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Lịch sử khám bệnh 
              </h2>

              <p>
                ( Bệnh nhân {name} )
              </p>
              <p className="text-sm text-gray-500">
                Tổng cộng {history.length} lần khám
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
          >
            <CloseOutlined
              className="text-lg text-white"
              style={{
                background: "#0e1182ff",
                borderRadius: "50%", // tròn
                padding: "10px",
              }}
            />
          </button>
        </div>
      </div>

      <div className="pt-4 pb-20 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Đang tải lịch sử...</p>
          </div>
        ) : history.length === 0 ? (
          <Empty description="Chưa có lần khám nào" className="mt-20" />
        ) : (
          <div className="space-y-5">
            {history.map((record, index) => {
              const isExpanded = expandedId === record.medical_record_id;
              const isLatest = index === 0;

              return (
                <div
                  key={record.medical_record_id}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                    isLatest
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Header lần khám */}
                  <button
                    onClick={() =>
                      setExpandedId(
                        isExpanded ? null : record.medical_record_id
                      )
                    }
                    className="w-full px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900">
                            {formatDate(record.created_at)}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(record.created_at)}
                          {record.doctor_name && (
                            <>
                              <span>•</span>
                              <User className="w-3.5 h-3.5" />
                              {record.doctor_name}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-600" />
                    )}
                  </button>

                  {/* Nội dung chi tiết */}
                  {isExpanded && (
                    <div className="px-5 py-5 bg-white space-y-5">
                      {/* Triệu chứng */}
                      {record.symptoms && (
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              Triệu chứng
                            </p>
                            <p className="text-gray-600 mt-1 leading-relaxed">
                              {record.symptoms}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Chẩn đoán */}
                      {record.diseases?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-800 mb-3">
                            Chẩn đoán
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {record.diseases.map((d) => (
                              <span
                                key={d.disease_detail_id}
                                className={`px-3 py-1.5 rounded-lg border font-medium text-sm ${
                                  severityColor[d.severity] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {d.disease_name}
                                {d.severity && ` • ${d.severity}`}
                              </span>
                            ))}
                          </div>
                          {record.diseases.some((d) => d.disease_note) && (
                            <p className="text-sm text-gray-500 italic mt-2 pl-1">
                              Ghi chú:{" "}
                              {
                                record.diseases.find((d) => d.disease_note)
                                  ?.disease_note
                              }
                            </p>
                          )}
                        </div>
                      )}

                      {/* Đơn thuốc */}
                      {record.prescriptions?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <Pill className="w-4 h-4 text-green-600" />
                            Đơn thuốc đã kê
                          </p>
                          <div className="space-y-2">
                            {record.prescriptions.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3"
                              >
                                <span className="font-medium text-gray-800">
                                  {p.medicine_name} ({p.unit})
                                </span>
                                <span className="text-sm text-gray-600">
                                  {p.quantity} • {p.usage_method}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default PatientHistoryDrawer;
