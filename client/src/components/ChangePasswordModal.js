import React, { useState } from "react";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Modal } from "antd";
import { authAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { duration } from "moment";
import  { useToast} from "../contexts/ToastContext"; 
const getStyles = (type) => {
  const styles = {
    success: "from-green-500/90 to-green-600/90",
    error: "from-rose-500/90 to-red-600/90",
    warning: "from-amber-500/90 to-orange-600/90",
    info: "from-blue-500/90 to-indigo-600/90",
  };
  return styles[type] || styles.info;
};

const getIcon = (type) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5" />;
    case "error":
      return <AlertCircle className="w-5 h-5" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};
const ModernToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
                    pointer-events-auto
                    flex items-center gap-3 p-4 pr-3 rounded-2xl
                    bg-gradient-to-r ${getStyles(toast.type)}
                    backdrop-blur-xl border border-white/20
                    shadow-2xl text-white
                    transform transition-all duration-300 ease-out
                    ${
                      toast.isHiding
                        ? "translate-x-[120%] opacity-0 scale-95"
                        : "translate-x-0 opacity-100 scale-100"
                    }
                  `}
          style={{
            animation: toast.isHiding ? "none" : "slideIn 0.3s ease-out",
          }}
        >
          <div className="flex-shrink-0 animate-pulse">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
            {typeof toast.message === "string" ? (
              <p>{toast.message}</p>
            ) : (
              toast.message
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-white/60"
              style={{
                animation: `progress ${toast.duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const ChangePasswordModal = ({ visible, onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const {toast} = useToast()

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại!";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới!";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự!";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
        formData.newPassword
      )
    ) {
      newErrors.newPassword =
        "Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt!";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới!";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await authAPI.changePassword({
        newPassword: formData.newPassword,
        currentPassword: formData.currentPassword,
      });

      if (response.data.success) {
        toast.success(
          "Mật khẩu đã được thay đổi. Đang chuyển hướng về trang đăng nhập ... ",
        );
        handleCancel();
        // showToast('', "info")
        setTimeout(() => {
          // Logout
          navigate("/");
          logout();
        }, 3000);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Không thể xóa bản ghi";

      toast.error(
        <div>
          <p className="font-semibold mb-1">{errorMessage}</p>
          <p className="text-xs opacity-90"></p>
        </div>,
      );
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onCancel();
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={handleCancel}
        footer={null}
        closable={false}
        centered
        width={500}
        styles={{
          body: { padding: 0 },
          content: {
            padding: 0,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          mask: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <div className="relative bg-white">
          {/* Decorative gradient circles */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Đổi mật khẩu
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bảo mật tài khoản của bạn
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:rotate-90"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="relative p-6 space-y-5">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-blue-500" />
                Mật khẩu hiện tại
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    errors.currentPassword
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Mật khẩu mới
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới "
                  className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100  ${
                    errors.newPassword
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.newPassword}
                </p>
              )}
              {formData.newPassword && formData.newPassword.length < 8 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                  Độ mạnh: Yếu ({formData.newPassword.length}/8 ký tự)
                </div>
              )}
              {formData.newPassword &&
                formData.newPassword.length >= 8 &&
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
                  formData.newPassword
                ) && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Độ mạnh: Tốt
                  </div>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Xác nhận mật khẩu mới
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100  ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword &&
                formData.newPassword === formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Mật khẩu khớp
                  </div>
                )}
            </div>

            {/* Info box */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-700">Lưu ý bảo mật:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Mật khẩu có ít nhất 8 ký tự</li>
                    <li>Kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt</li>
                    <li>Không sử dụng thông tin cá nhân dễ đoán</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ChangePasswordModal;
