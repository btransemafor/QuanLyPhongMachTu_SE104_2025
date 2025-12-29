// pages/Help/Help.jsx
import React, { useState } from "react";
import {
  Input,
  Typography,
  Row,
  Col,
  Card,
  Collapse,
  Tag,
  Divider,
  Space,
  Button,
  FloatButton,
} from "antd";
import {
  SearchOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  CustomerServiceOutlined,
  ArrowRightOutlined,
  PlayCircleFilled,
  MessageOutlined,
} from "@ant-design/icons";
import styles from "./Help.module.css";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const Help = ({ userRole = "admin" }) => {
  const [searchText, setSearchText] = useState("");

  const helpContent = {
    admin: {
      quickGuides: [
        {
          title: "Quản lý bệnh nhân",
          desc: "Thêm, sửa, xóa hồ sơ bệnh nhân",
          icon: "👥",
          link: "#",
        },
        {
          title: "Quản lý nhân viên",
          desc: "Bác sĩ, lễ tân, phân quyền",
          icon: "Doctor",
          link: "#",
        },
        {
          title: "Báo cáo & thống kê",
          desc: "Doanh thu, hiệu suất phòng khám",
          icon: "Graph",
          link: "#",
        },
        {
          title: "Cấu hình hệ thống",
          desc: "Cài đặt chung, sao lưu dữ liệu",
          icon: "Settings",
          link: "#",
        },
      ],
      faqs: [
        {
          q: "Làm sao để thêm bác sĩ mới?",
          a: "Vào menu Nhân viên > Bác sĩ > Bấm nút 'Thêm bác sĩ'. Điền đầy đủ thông tin và bấm Lưu.",
          cat: "Nhân viên",
        },
        {
          q: "Xuất báo cáo doanh thu theo tháng?",
          a: "Vào Báo cáo > Doanh thu > Chọn tháng > Bấm 'Xuất Excel'.",
          cat: "Báo cáo",
        },
        {
          q: "Xem danh sách bệnh nhân hôm nay?",
          a: "Dashboard > 'Lịch hẹn hôm nay' hoặc Lịch hẹn > Lọc theo ngày hiện tại.",
          cat: "Bệnh nhân",
        },
        {
          q: "Reset mật khẩu nhân viên?",
          a: "Nhân viên > Chọn người > Icon khóa > Nhập mật khẩu mới.",
          cat: "Bảo mật",
        },
        {
          q: "Sao lưu dữ liệu tự động?",
          a: "Cấu hình > Sao lưu > Bật 'Tự động sao lưu hàng ngày'.",
          cat: "Hệ thống",
        },
      ],
      videos: [
        {
          title: "Hướng dẫn toàn diện cho Admin",
          duration: "15:30",
          thumb:
            "https://via.placeholder.com/600x340/0052CC/ffffff?text=Video+Admin",
        },
        {
          title: "Phân tích báo cáo nâng cao",
          duration: "08:45",
          thumb:
            "https://via.placeholder.com/600x340/7209B7/ffffff?text=Video+Báo+cáo",
        },
      ],
    },
    receptionist: {
      /* giữ nguyên cấu trúc, thay nội dung tương tự */
    },
    doctor: {
      /* tương tự */
    },
  }[userRole] || { quickGuides: [], faqs: [], videos: [] };

  const filteredFAQs = helpContent.faqs.filter((item) =>
    [item.q, item.a, item.cat].some((text) =>
      text.toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <Title level={1} className={styles.heroTitle}>
              Trung tâm trợ giúp
            </Title>
            <Paragraph className={styles.heroSubtitle}>
              Tìm hướng dẫn nhanh • Liên hệ hỗ trợ 24/7
            </Paragraph>
          </div>
          <div className={styles.heroWave} />
        </div>

        {/* FAQ */}
        <section className={styles.section}>
          <Title level={2} className={styles.sectionTitle}>
            <QuestionCircleOutlined /> Câu hỏi thường gặp
          </Title>

          {filteredFAQs.length === 0 ? (
            <Card className={styles.emptyCard}>
              <Text type="secondary">
                Không tìm thấy kết quả cho "<strong>{searchText}</strong>"
              </Text>
            </Card>
          ) : (
            <Collapse
              ghost
              expandIcon={({ isActive }) => (
                <ArrowRightOutlined
                  rotate={isActive ? 90 : 0}
                  className={styles.collapseIcon}
                />
              )}
              className={styles.faqCollapse}
            >
              {filteredFAQs.map((faq, i) => (
                <Panel
                  header={
                    <div className={styles.faqHeader}>
                      <Text strong className={styles.faqQuestion}>
                        {faq.q}
                      </Text>
                      <Tag color="processing" className={styles.faqTag}>
                        {faq.cat}
                      </Tag>
                    </div>
                  }
                  key={i}
                  className={styles.faqPanel}
                >
                  <Paragraph className={styles.faqAnswer}>{faq.a}</Paragraph>
                </Panel>
              ))}
            </Collapse>
          )}
        </section>

        {/* Video Tutorials */}

        {/* Contact Support */}
        <section className={styles.section}>
          <Card className={styles.supportCard}>
            <Title level={2} className={styles.supportTitle}>
              Vẫn cần hỗ trợ thêm?
            </Title>
            <Paragraph className={styles.supportDesc}>
              Đội ngũ OMGNICE luôn sẵn sàng hỗ trợ bạn 24/7
            </Paragraph>

            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} md={8}>
                <div className={styles.supportItem}>
                  <PhoneOutlined className={styles.supportIcon} />
                  <Text strong className={styles.supportLabel}>
                    Hotline
                  </Text>
                  <Text level={3} className={styles.supportValue}>
                    033 849 8306
                  </Text>
                  <p className="text-gray-400">Hỗ trợ khẩn cấp 24/7</p>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className={styles.supportItem}>
                  <MailOutlined className={styles.supportIcon} />
                  <Text strong className={styles.supportLabel}>
                    Email
                  </Text>
                  <Text className={styles.supportValue}>
                    support@omgnice.com
                  </Text>
                  <p className="text-gray-400">Phản hồi trong vòng 2 giờ</p>
                  <Text type="secondary"></Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className={styles.supportItem}>
                  <ClockCircleOutlined className={styles.supportIcon} />
                  <Text strong className={styles.supportLabel}>
                    Giờ làm việc
                  </Text>
                  <Text className={styles.supportValue}>8:00 - 22:00</Text>

                  <p className="text-gray-400">Thứ 2 đến Chủ nhật</p>
                </div>
              </Col>
            </Row>
          </Card>
        </section>

        <Divider className={styles.footerDivider} />
        <p type="secondary" className={styles.footer}>
          © 2025 OMGNICE System • Phiên bản 1.0.0 • Cập nhật 07/12/2025
        </p>
      </div>

      {/* Float Button Hỗ trợ nhanh */}
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<CustomerServiceOutlined />}
      >
       {/*  <FloatButton icon={<PhoneOutlined />} tooltip="" /> */}
        <FloatButton icon={<MailOutlined />} tooltip="Gửi email" />
        <FloatButton icon={<MessageOutlined />} tooltip="Chat Message" />
      </FloatButton.Group>
    </>
  );
};

export default Help;
