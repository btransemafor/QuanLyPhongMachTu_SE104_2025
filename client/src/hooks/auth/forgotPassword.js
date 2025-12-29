import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { message } from 'antd'; 
import { authAPI } from '../../services/api'; 

export const useForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const forgotPassword = async (payload) => {
        setLoading(true);
        try {
            await authAPI.forgotPassword(payload); 
            //message.success('Đặt lại mật khẩu thành công. Vui lòng kiểm tra email của bạn.');
            // navigate('/login');
        } catch(error) {
            const msg = error?.response?.data?.message || 'Đặt lại mật khẩu thất bại';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return { forgotPassword, loading };
}
