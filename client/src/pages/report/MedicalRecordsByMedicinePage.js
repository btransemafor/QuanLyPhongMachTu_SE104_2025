import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { medicalRecordsAPI } from "../../services/api";
import {
  ArrowLeft,
  Pill,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function MedicalRecordsByMedicinePage() {
  const { medicineId } = useParams();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [medicineName, setMedicineName] = useState(""); // Nếu backend trả thêm tên thuốc thì hiển thị
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await medicalRecordsAPI.getMedicalRecordByMedicine(
          medicineId
        );

        if (res.data.success) {
          const data = res.data.data;
          console.log("Thuoc : ", res.data.data);
          setMedicineName(data.medicine_name);
          setRecords(data.records || []);
        }

        /*         // Giả sử backend trả: { medicine_name: "Paracetamol", data: [...] }
        if (res.medicine_name) setMedicineName(res.medicine_name); */
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [medicineId]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-96 mb-6"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-6 w-full">
      <div className="mx-auto space-y-8">
        {/* Header Card */}
        {/* Header Card – Đẹp lung linh */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2.5 text-gray-600 hover:text-gray-900 transition-all hover:-translate-x-1"
            >
              <ArrowLeft size={22} />
              <span className="font-medium text-sm">Quay lại</span>
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-8">
            {/* Icon thuốc lớn */}
            <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Pill className="text-white" size={44} />
            </div>

            {/* Nội dung chính */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Hồ sơ khám bệnh có kê thuốc
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-6 text-lg">
                {/* Tên thuốc – nổi bật nhất */}
                {medicineName ? (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Tên thuốc:</span>
                    <span className="font-bold text-2xl text-blue-700 bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-200">
                      {medicineName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">ID thuốc:</span>
                    <span className="font-mono text-xl font-bold text-gray-800 bg-gray-100 px-5 py-2.5 rounded-xl">
                      #{medicineId}
                    </span>
                  </div>
                )}

                {/* Tổng số hồ sơ */}
                <div className="flex items-center gap-3 text-gray-600">
                  <FileText size={22} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {records.length} hồ sơ
                  </span>
                  <span className="text-sm text-gray-500">
                    đã được kê thuốc này
                  </span>
                </div>
              </div>

              {/* Dòng phụ nhẹ nhàng */}
              <p className="mt-4 text-gray-500 text-sm">
                Danh sách tất cả bệnh nhân đã được chỉ định sử dụng thuốc{" "}
                {medicineName ? (
                  <strong>{medicineName}</strong>
                ) : (
                  `ID #${medicineId}`
                )}{" "}
                trong đơn thuốc.
              </p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <FileText size={24} className="text-blue-600" />
              Danh sách hồ sơ khám ({records.length} kết quả)
            </h2>
          </div>

          {records.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Pill size={48} className="text-gray-400" />
              </div>
              <p className="text-lg text-gray-500">
                Không có hồ sơ khám nào sử dụng thuốc này.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Có thể thuốc chưa được kê trong đơn nào.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Mã hồ sơ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Ngày khám
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Số lượng
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Lô thuốc
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr
                      key={record.medical_record_id || index}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/medical-record-details/${record.medical_record_id}`
                        )
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        #{record.medical_record_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {record.patient_name?.[0] || "P"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {record.patient_name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="font-medium">
                          {record.doctor_name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {record.created_at
                            ? format(
                                new Date(record.created_at),
                                "dd/MM/yyyy HH:mm"
                              )
                            : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.quantity} {record.unit || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">
                        {record.batch_code || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Tổng cộng{" "}
              <span className="font-semibold text-gray-900">
                {records.length}
              </span>{" "}
              hồ sơ được tìm thấy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
