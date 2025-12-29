import React, { useState } from "react";
import { Card, Select, Button, Table, Tabs, DatePicker, Alert, Space, Typography, Tag } from "antd";
import { Archive, Zap, Calendar, FileText, Search } from "lucide-react";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Reports = () => {
  const [activeTab, setActiveTab] = useState("periodic");

  const periodicReports = [
    { key: "1", month: "Tháng 12/2025", created: "01/01/2026 00:00" },
    { key: "2", month: "Tháng 11/2025", created: "01/12/2025 00:00" },
    { key: "3", month: "Tháng 10/2025", created: "01/11/2025 00:00" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Title level={2} className="mb-2 text-gray-800 font-semibold">
            Báo cáo & Thống kê
          </Title>
          <Text type="secondary" className="text-lg">
            Theo dõi hiệu suất hoạt động phòng khám theo thời gian
          </Text>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="custom-reports-tabs"
          items={[
            {
              key: "periodic",
              label: (
                <Space>
                  <Archive className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">Báo cáo định kỳ (Lưu sẵn)</span>
                  <Tag color="emerald" className="ml-2 text-xs font-medium">Đã tạo tự động</Tag>
                </Space>
              ),
              children: (
                <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
                  <div className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <Title level={4} className="mb-2 text-emerald-900">
                      Chọn báo cáo định kỳ đã được tạo tự động
                    </Title>
                    <Text type="secondary" className="text-emerald-700">
                      Hệ thống tự động tổng hợp vào 0h ngày đầu tháng sau
                    </Text>
                  </div>

                  <div className="p-8">
                    <Space size={16} className="mb-8">
                      <Select defaultValue="2025" style={{ width: 140 }} size="large">
                        <Select.Option value="2025">2025</Select.Option>
                        <Select.Option value="2024">2024</Select.Option>
                        <Select.Option value="2023">2023</Select.Option>
                      </Select>

                      <Select defaultValue="12" style={{ width: 180 }} size="large">
                        <Select.Option value="12">Tháng 12</Select.Option>
                        <Select.Option value="11">Tháng 11</Select.Option>
                        <Select.Option value="10">Tháng 10</Select.Option>
                      </Select>

                      <Button
                        type="primary"
                        size="large"
                        icon={<FileText className="w-5 h-5" />}
                        className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-md px-8"
                      >
                        Xem báo cáo tháng
                      </Button>
                    </Space>

                    <Table
                      dataSource={periodicReports}
                      pagination={false}
                      className="shadow-sm"
                      rowClassName="hover:bg-gray-50 transition-colors"
                    >
                      <Table.Column title="Loại báo cáo" render={() => "Báo cáo tháng"} width={180} />
                      <Table.Column title="Tháng" dataIndex="month" />
                      <Table.Column title="Ngày tạo" dataIndex="created" />
                      <Table.Column
                        title=""
                        width={120}
                        render={() => (
                          <Button type="link" className="text-emerald-600 font-medium">
                            Xem
                          </Button>
                        )}
                      />
                    </Table>
                  </div>
                </Card>
              ),
            },
            {
              key: "realtime",
              label: (
                <Space>
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Báo cáo theo yêu cầu (Realtime)</span>
                  <Tag color="purple" className="ml-2 text-xs font-medium">Tính toán tức thì</Tag>
                </Space>
              ),
              children: (
                <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
                  <div className="p-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                    <Title level={4} className="mb-2 text-purple-900">
                      Tạo báo cáo theo khoảng thời gian bất kỳ
                    </Title>
                    <Text type="secondary" className="text-purple-700">
                      Dữ liệu được tính toán lại theo thời gian thực
                    </Text>
                  </div>

                  <div className="p-8">
                    <Space size={16} className="mb-6 flex flex-wrap gap-4">
                      <RangePicker
                        format="DD/MM/YYYY"
                        placeholder={["Từ ngày", "Đến ngày"]}
                        className="w-80"
                        size="large"
                      />

                      <Select defaultValue="revenue" style={{ width: 240 }} size="large">
                        <Select.Option value="revenue">Doanh thu tổng hợp</Select.Option>
                        <Select.Option value="patients">Thống kê bệnh nhân</Select.Option>
                        <Select.Option value="medicines">Sử dụng thuốc</Select.Option>
                        <Select.Option value="doctors">Hiệu suất bác sĩ</Select.Option>
                      </Select>

                      <Button
                        type="primary"
                        size="large"
                        icon={<Search className="w-5 h-5" />}
                        className="bg-purple-600 hover:bg-purple-700 border-none shadow-md px-8"
                      >
                        Xem báo cáo
                      </Button>
                    </Space>

                    <Alert
                      message="Báo cáo sẽ được tính toán lại theo thời gian thực từ dữ liệu hiện tại"
                      type="info"
                      showIcon
                      className="mb-8 border-purple-200 bg-purple-50"
                      icon={<Zap className="w-5 h-5 text-purple-600" />}
                    />

                    <div className="bg-gray-50/80 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
                      <div className="text-gray-500">
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-40" />
                        <Title level={4} className="text-gray-600 mb-2">
                          Chọn khoảng thời gian và loại báo cáo
                        </Title>
                        <Text type="secondary">
                          Kết quả sẽ hiển thị ngay sau khi bạn nhấn "Xem báo cáo"
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ),
            },
          ]}
        />
      </div>

      {/* Custom CSS để đẹp hơn Antd mặc định */}
      <style jsx>{`
        :global(.custom-reports-tabs .ant-tabs-nav) {
          margin-bottom: 0;
        }
        :global(.custom-reports-tabs .ant-tabs-tab) {
          padding: 16px 24px !important;
          font-size: 16px;
        }
        :global(.custom-reports-tabs .ant-tabs-ink-bar) {
          height: 4px;
          border-radius: 2px;
        }
        :global(.ant-card-head) {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default Reports;