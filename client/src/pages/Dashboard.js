import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Typography } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { reportsAPI, appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    today: {
      appointments: { total_appointments: 0, waiting_count: 0, examined_count: 0, completed_count: 0 },
      revenue: { invoices_count: 0, total_revenue: 0 }
    },
    monthly: {
      revenue: { invoices_count: 0, total_revenue: 0 }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const appointmentsResponse = await appointmentsAPI.getDailyAppointments({
        date: moment().format('YYYY-MM-DD')
      });

      let appointmentsData = {
        total_appointments: 0,
        waiting_count: 0,
        examined_count: 0,
        completed_count: 0
      };

      if (appointmentsResponse.data.success) {
        const appointments = appointmentsResponse.data.data;
        appointmentsData = {
          total_appointments: appointments.length,
          waiting_count: appointments.filter(apt => apt.status === 'waiting').length,
          examined_count: appointments.filter(apt => apt.status === 'examined').length,
          completed_count: appointments.filter(apt => apt.status === 'completed').length
        };
      }

      let revenueData = {
        today: { invoices_count: 0, total_revenue: 0 },
        monthly: { invoices_count: 0, total_revenue: 0 }
      };

      if (user?.role === 'receptionist' || user?.role === 'admin') {
        try {
          const revenueResponse = await reportsAPI.getDashboardStats();
          if (revenueResponse.data.success) {
            revenueData = {
              today: revenueResponse.data.data.today.revenue,
              monthly: revenueResponse.data.data.monthly.revenue
            };
          }
        } catch (error) {
          console.log('Revenue data not available:', error.message);
        }
      }

      setDashboardData({
        today: { appointments: appointmentsData, revenue: revenueData.today },
        monthly: { revenue: revenueData.monthly }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'receptionist': return 'Lễ tân';
      case 'doctor': return 'Bác sĩ';
      case 'admin': return 'Quản trị viên';
      default: return 'Người dùng';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', background: '#f0f2f5', minHeight: '100vh' }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 12 }}>
         {/*  <MedicineBoxOutlined style={{ color: '#0e1182ff', fontSize: 32 }} /> */}
          Tổng quan hệ thống
        </Title>
        <Text type="secondary" style={{ fontSize: 16}}>
          Chào mừng {getRoleTitle(user?.role)} • {moment().format('dddd, DD/MM/YYYY')}
        </Text>
      </div>

      {/* Statistic Cards - Gradient Style */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        {/* Tổng khám hôm nay */}
        <Col xs={24} sm={12} md={6}>
          <div className="gradient-card" style={{
            background: 'linear-gradient(135deg, #1890ff, #096dd9)',
            borderRadius: 16,
            padding: '24px 20px',
            color: 'white',
            boxShadow: '0 10px 20px rgba(24, 144, 255, 0.3)',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ opacity: 0.9, fontSize: 15, color: 'white'}}>Tổng khám hôm nay</Text>
                <div style={{ fontSize: 38, fontWeight: 'bold', margin: '8px 0' }}>
                  {dashboardData.today.appointments.total_appointments}
                </div>
              </div>
              <CalendarOutlined style={{ fontSize: 48, opacity: 0.7 }} />
            </div>
          </div>
        </Col>

        {/* Chờ khám */}
        <Col xs={24} sm={12} md={6}>
          <div className="gradient-card" style={{
            background: 'linear-gradient(135deg, #fa8c16, #d4380d)',
            borderRadius: 16,
            padding: '24px 20px',
            color: 'white',
            boxShadow: '0 10px 20px rgba(250, 140, 22, 0.3)',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ opacity: 0.9, fontSize: 15 , color: 'white'}}>Chờ khám</Text>
                <div style={{ fontSize: 38, fontWeight: 'bold', margin: '8px 0' }}>
                  {dashboardData.today.appointments.waiting_count}
                </div>
              </div>
              <ClockCircleOutlined style={{ fontSize: 48, opacity: 0.7 }} />
            </div>
          </div>
        </Col>

        {/* Đã khám */}
        <Col xs={24} sm={12} md={6}>
          <div className="gradient-card" style={{
            background: 'green',
            borderRadius: 16,
            padding: '24px 20px',
            color: 'white',
            boxShadow: '0 10px 20px rgba(82, 196, 26, 0.3)',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ opacity: 0.9, fontSize: 15,  color: 'white' }}>Đã khám</Text>
                <div style={{ fontSize: 38, fontWeight: 'bold', margin: '8px 0' }}>
                  {dashboardData.today.appointments.examined_count}
                </div>
              </div>
              <UserOutlined style={{ fontSize: 48, opacity: 0.7 }} />
            </div>
          </div>
        </Col>

        {/* Hoàn thành */}
        <Col xs={24} sm={12} md={6}>
          <div className="gradient-card" style={{
            background: 'linear-gradient(135deg, #722ed1, #531dab)',
            borderRadius: 16,
            padding: '24px 20px',
            color: 'white',
            boxShadow: '0 10px 20px rgba(114, 46, 209, 0.3)',
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ opacity: 0.9, fontSize: 15,  color: 'white' }}>Hoàn thành</Text>
                <div style={{ fontSize: 38, fontWeight: 'bold', margin: '8px 0' }}>
                  {dashboardData.today.appointments.completed_count}
                </div>
              </div>
              <CheckCircleOutlined style={{ fontSize: 48, opacity: 0.7 }} />
            </div>
          </div>
        </Col>

        {/* Doanh thu hôm nay - Chỉ lễ tân & admin */}
        {(user?.role === 'receptionist' || user?.role === 'admin') && (
          <>
            <Col xs={24} md={12}>
              <div className="gradient-card" style={{
                background: 'linear-gradient(135deg, #13c2c2, #08979c)',
                borderRadius: 16,
                padding: '24px 20px',
                color: 'white',
                boxShadow: '0 10px 20px rgba(19, 194, 194, 0.3)',
                height: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ opacity: 0.9, fontSize: 15 }}>Doanh thu hôm nay</Text>
                    <div style={{ fontSize: 32, fontWeight: 'bold', margin: '12px 0' }}>
                      {formatCurrency(dashboardData.today.revenue.total_revenue)}
                    </div>
                    <Text style={{ opacity: 0.9, fontSize: 14 }}>
                      {dashboardData.today.revenue.invoices_count} hóa đơn
                    </Text>
                  </div>
                  <DollarOutlined style={{ fontSize: 56, opacity: 0.7 }} />
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="gradient-card" style={{
                background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                borderRadius: 16,
                padding: '24px 20px',
                color: 'white',
                boxShadow: '0 10px 20px rgba(24, 144, 255, 0.3)',
                height: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ opacity: 0.9, fontSize: 15 }}>Doanh thu tháng này</Text>
                    <div style={{ fontSize: 32, fontWeight: 'bold', margin: '12px 0' }}>
                      {formatCurrency(dashboardData.monthly.revenue.total_revenue)}
                    </div>
                    <Text style={{ opacity: 0.9, fontSize: 14 }}>
                      {dashboardData.monthly.revenue.invoices_count} hóa đơn
                    </Text>
                  </div>
                  <DollarOutlined style={{ fontSize: 56, opacity: 0.7 }} />
                </div>
              </div>
            </Col>
          </>
        )}

        {/* Dành riêng cho Bác sĩ */}
        {user?.role === 'doctor' && (
          <>
            <Col xs={24} md={12}>
              <div className="gradient-card" style={{
                background: 'linear-gradient(135deg, #fa541c, #d4380d)',
                borderRadius: 16,
                padding: '28px 20px',
                color: 'white',
                boxShadow: '0 10px 20px rgba(250, 84, 28, 0.3)',
                height: '100%'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 60, opacity: 0.9, marginBottom: 16 }} />
                  <div style={{ fontSize: 42, fontWeight: 'bold' }}>
                    {dashboardData.today.appointments.waiting_count}
                  </div>
                  <Text style={{ fontSize: 18, opacity: 0.95 }}>Bệnh nhân đang chờ khám</Text>
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="gradient-card" style={{
                background: 'linear-gradient(135deg, #13c2c2, #08979c)',
                borderRadius: 16,
                padding: '28px 20px',
                color: 'white',
                boxShadow: '0 10px 20px rgba(19, 194, 194, 0.3)',
                height: '100%'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 60, opacity: 0.9, marginBottom: 16 }} />
                  <div style={{ fontSize: 42, fontWeight: 'bold' }}>
                    {dashboardData.today.appointments.examined_count}
                  </div>
                  <Text style={{ fontSize: 18, opacity: 0.95 }}>Đã khám - Chờ lập hóa đơn</Text>
                </div>
              </div>
            </Col>
          </>
        )}
      </Row>

      {/* Hướng dẫn sử dụng */}
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
        title={
          <Title level={4} style={{ margin: 0, color: '#0e1182ff' }}>
            Hướng dẫn sử dụng • {getRoleTitle(user?.role)}
          </Title>
        }
      >
        <Row gutter={[24, 24]}>
          {user?.role === 'receptionist' && (
            <Col xs={24} md={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%' }}>
                <Title level={5} style={{ color: '#1890ff' }}>Công việc chính</Title>
                <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
                  <li>Quản lý bệnh nhân</li>
                  <li>Thêm bệnh nhân vào danh sách khám</li>
                  <li>Lập và in hóa đơn thanh toán</li>
                  <li>Theo dõi trạng thái khám bệnh</li>
                  <li>Hỗ trợ bệnh nhân nhanh chóng</li>
                </ul>
              </Card>
            </Col>
          )}

          {user?.role === 'doctor' && (
            <Col xs={24} md={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%' }}>
                <Title level={5} style={{ color: '#52c41a' }}>Công việc chính</Title>
                <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
                  <li>Xem danh sách bệnh nhân chờ khám</li>
                  <li>Lập phiếu khám & kê đơn thuốc</li>
                  <li>Cập nhật kết quả khám</li>
                  <li>Tra cứu lịch sử bệnh án</li>
                  <li>Ho Completable trạng thái khám</li>
                </ul>
              </Card>
            </Col>
          )}

          {user?.role === 'admin' && (
            <Col xs={24} md={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%' }}>
                <Title level={5} style={{ color: '#722ed1' }}>Quyền quản trị</Title>
                <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
                  <li>Quản lý tài khoản người dùng</li>
                  <li>Cấu hình hệ thống</li>
                  <li>Xem báo cáo doanh thu chi tiết</li>
                  <li>Giám sát hoạt động toàn hệ thống</li>
                  <li>Sao lưu & bảo mật dữ liệu</li>
                </ul>
              </Card>
            </Col>
          )}

          <Col xs={24} md={12}>
            <Card size="small" style={{ borderRadius: 12, height: '100%', background: '#f8f9ff' }}>
              <Title level={5} style={{ color: '#0e1182ff' }}>Thông tin hệ thống</Title>
              <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
                <li>Hệ thống quản lý phòng khám tư nhân</li>
                <li>Hỗ trợ đầy đủ 3 vai trò người dùng</li>
                <li>Quản lý lịch khám & bệnh án điện tử</li>
                <li>Tự động tính tiền & in hóa đơn</li>
                <li>Báo cáo thống kê trực quan</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;