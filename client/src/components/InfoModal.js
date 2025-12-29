import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Switch,
  Button,
  Space,
  message,
  Avatar,
  Divider,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CrownOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import moment from "moment";

const InfoModal = ({ user, open, onClose, onUpdate }) => {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        is_active: user.is_active,
      });
    }
  }, [user]);

  if (!user) return null;

  const saveField = async () => {
    setSaving(true);
    try {
      await onUpdate({ id: user.id, ...formData });
      setEditing(null);
      message.success("Cập nhật thành công!");
    } catch (error) {
      message.error("Cập nhật thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
    });
    setEditing(null);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const InfoRow = ({ icon, label, value, field, input }) => {
    const isEditing = editing === field;

    return (
      <div className="group hover:bg-blue-50/30 transition-all duration-200 rounded-xl p-4 border border-transparent hover:border-blue-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              {React.cloneElement(icon, {
                className: "text-blue-700",
                style: { fontSize: "18px" },
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {label}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                {input}
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    size="small"
                    icon={<SaveOutlined />}
                    onClick={saveField}
                    loading={saving}
                    className="bg-blue-900 hover:bg-blue-800"
                  >
                    Lưu
                  </Button>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-slate-800 font-medium text-base">
                  {value || <span className="text-slate-400">-</span>}
                </div>
                {field && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(field)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Sửa
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
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
      styles={{
        body: { padding: 0 },
      }}
    >
      {/* Header với gradient */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 px-8 py-10 rounded-t-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative flex items-center gap-6">
          <Avatar
            size={80}
            className="bg-gradient-to-br from-blue-300 to-blue-100 text-blue-900 font-bold text-2xl shadow-xl"
          >
            {getInitials(user.full_name)}
          </Avatar>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              {user.full_name || "Chưa có tên"}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-blue-200 text-sm font-medium">
                @{user.username}
              </span>
              <div className="w-1 h-1 bg-blue-300 rounded-full" />
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? "bg-green-500/20 text-green-100 border border-green-400/30"
                    : "bg-red-500/20 text-red-100 border border-red-400/30"
                }`}
              >
                {user.is_active ? (
                  <>
                    <CheckCircleFilled /> Đang hoạt động
                  </>
                ) : (
                  <>
                    <CloseCircleFilled /> Ngừng hoạt động
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="space-y-2">
          <InfoRow
            icon={<UserOutlined />}
            label="Họ và tên"
            value={user.full_name}
            field="full_name"
            input={
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Nhập họ và tên"
                className="rounded-lg"
                size="large"
              />
            }
          />

          <InfoRow
            icon={<MailOutlined />}
            label="Email"
            value={user.email}
            field="email"
            input={
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Nhập email"
                type="email"
                className="rounded-lg"
                size="large"
              />
            }
          />

          <InfoRow
            icon={<PhoneOutlined />}
            label="Số điện thoại"
            value={user.phone}
            field="phone"
            input={
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Nhập số điện thoại"
                className="rounded-lg"
                size="large"
              />
            }
          />

          <Divider className="my-4" />

          <InfoRow
            icon={<CrownOutlined />}
            label="Vai trò"
            value={
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-md">
                {user.role_name}
              </span>
            }
          />

          <InfoRow
            icon={<CalendarOutlined />}
            label="Ngày tạo tài khoản"
            value={moment(user.created_at).format("DD/MM/YYYY - HH:mm")}
          />

          <div className="group hover:bg-blue-50/30 transition-all duration-200 rounded-xl p-4 border border-transparent hover:border-blue-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  {user.is_active ? (
                    <CheckCircleFilled className="text-green-600 text-lg" />
                  ) : (
                    <CloseCircleFilled className="text-red-600 text-lg" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Trạng thái tài khoản
                </div>
                {editing === "is_active" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.is_active}
                        onChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                        className="bg-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {formData.is_active
                          ? "Đang hoạt động"
                          : "Ngừng hoạt động"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={saveField}
                        loading={saving}
                        className="bg-blue-900 hover:bg-blue-800"
                      >
                        Lưu
                      </Button>
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${
                        user.is_active
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircleFilled /> Đang hoạt động
                        </>
                      ) : (
                        <>
                          <CloseCircleFilled /> Ngừng hoạt động
                        </>
                      )}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setEditing("is_active")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Sửa
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-8 py-4 bg-white rounded-b-lg">
        <div className="flex justify-end">
          <Button size="large" onClick={onClose} className="px-6 font-semibold">
            Đóng
          </Button>
        </div>
      </div>

      <style jsx>{`
        .ant-modal-content {
          padding: 0;
          overflow: hidden;
        }
      `}</style>
    </Modal>
  );
};

export default InfoModal;
