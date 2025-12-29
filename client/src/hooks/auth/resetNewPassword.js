import { useState } from 'react';
import { message } from 'antd';
import {authAPI} from '../../services/api';
export const useResetNewPassword = () => {
const [loading, setLoading] = useState(false);

  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    try {
        console.log('API call with token:', token, 'and newPassword:', newPassword);
      const response = await authAPI.resetPassword({
        token,
        newPassword
      });

      if (response.status === 200) {
        ///message.success('Đặt lại mật khẩu thành công!');
        return true;
      }
      
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Đặt lại mật khẩu thất bại';
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    resetPassword,
    loading
  };
};