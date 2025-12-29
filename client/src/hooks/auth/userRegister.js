import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { authAPI } from "../../services/api";

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await authAPI.register(payload);
      if (res.data.success) {
        message.success(
          "Đăng ký thành công! Đang chuyển về trang đăng nhập..."
        );
        //navigate("/login");
      } else {
        message.error(res.data.message || "Đăng ký thất bại");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng ký thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return { register, loading };
};
