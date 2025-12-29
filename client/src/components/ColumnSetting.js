import React, { useState } from "react";
import { Table, Button, Dropdown, Checkbox } from "antd";
import { SettingOutlined, ReloadOutlined } from "@ant-design/icons";

// ============================================
// COMPONENT TÁI SỬ DỤNG - ColumnVisibilityDropdown
// ============================================
const ColumnVisibilityDropdown = ({
  columns,
  visibleColumns,
  onVisibilityChange,
  onReset,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleColumn = (columnKey) => {
    onVisibilityChange({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    });
  };

  const handleReset = () => {
    const reset = {};
    columns.forEach((col) => (reset[col.key] = true));
    onReset(reset);
  };

  const dropdownContent = (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        padding: 12,
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#262626",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "2px solid #f0f0f0",
        }}
      >
        Tùy chọn hiển thị cột
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {columns.map((col) => (
          <div
            key={col.key}
            style={{
              padding: "8px 4px",
              cursor: "pointer",
              borderRadius: 4,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            onClick={() => toggleColumn(col.key)}
          >
            <Checkbox checked={visibleColumns[col.key]}>
              <span style={{ fontSize: 14 }}>{col.title}</span>
            </Checkbox>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          style={{
            padding: "4px 8px",
            height: "auto",
            color: "#1890ff",
          }}
        >
          Đặt lại mặc định
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Button
        icon={<SettingOutlined />}
        style={{
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Cột
      </Button>
    </Dropdown>
  );
};

export default ColumnVisibilityDropdown; 
/* 
// ============================================
// HOOK TÁI SỬ DỤNG - useColumnVisibility
// ============================================
const useColumnVisibility = (columns) => {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => (initial[col.key] = true));
    return initial;
  });

  const filteredColumns = columns.filter((col) => visibleColumns[col.key]);

  const resetColumns = () => {
    const reset = {};
    columns.forEach((col) => (reset[col.key] = true));
    setVisibleColumns(reset);
  };

  return {
    visibleColumns,
    setVisibleColumns,
    filteredColumns,
    resetColumns,
  };
};





// ============================================
// DEMO 1: Bảng Nhân Viên
// ============================================
const EmployeeTable = () => {
  const employeeColumns = [
    { key: "id", title: "ID", dataIndex: "id", width: 80 },
    { key: "name", title: "Họ và tên", dataIndex: "name", width: 150 },
    { key: "age", title: "Tuổi", dataIndex: "age", width: 80 },
    { key: "position", title: "Chức vụ", dataIndex: "position", width: 150 },
    {
      key: "department",
      title: "Phòng ban",
      dataIndex: "department",
      width: 150,
    },
    { key: "email", title: "Email", dataIndex: "email", width: 200 },
    { key: "phone", title: "Số điện thoại", dataIndex: "phone", width: 120 },
  ];

  const employeeData = [
    {
      key: "1",
      id: "NV001",
      name: "Nguyễn Văn A",
      age: 25,
      position: "Developer",
      department: "IT",
      email: "a@company.com",
      phone: "0123456789",
    },
    {
      key: "2",
      id: "NV002",
      name: "Trần Thị B",
      age: 30,
      position: "Manager",
      department: "Sales",
      email: "b@company.com",
      phone: "0987654321",
    },
    {
      key: "3",
      id: "NV003",
      name: "Lê Văn C",
      age: 28,
      position: "Designer",
      department: "Marketing",
      email: "c@company.com",
      phone: "0369852147",
    },
  ];

  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(employeeColumns);

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px 24px",
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
        }}
      >
        <h2
          style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 600 }}
        >
          👥 Danh sách Nhân viên
        </h2>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: "#8c8c8c" }}>
            Hiển thị {filteredColumns.length}/{employeeColumns.length} cột
          </span>
          <ColumnVisibilityDropdown
            columns={employeeColumns}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            onReset={resetColumns}
          />
        </div>
        <Table
          dataSource={employeeData}
          columns={filteredColumns}
          pagination={false}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

// ============================================
// DEMO 2: Bảng Sản Phẩm
// ============================================
const ProductTable = () => {
  const productColumns = [
    { key: "code", title: "Mã SP", dataIndex: "code", width: 100 },
    { key: "name", title: "Tên sản phẩm", dataIndex: "name", width: 200 },
    { key: "category", title: "Danh mục", dataIndex: "category", width: 120 },
    {
      key: "price",
      title: "Giá",
      dataIndex: "price",
      width: 120,
      render: (v) => `${v?.toLocaleString("vi-VN")} ₫`,
    },
    { key: "stock", title: "Tồn kho", dataIndex: "stock", width: 100 },
    {
      key: "supplier",
      title: "Nhà cung cấp",
      dataIndex: "supplier",
      width: 150,
    },
  ];

  const productData = [
    {
      key: "1",
      code: "SP001",
      name: "Laptop Dell XPS 13",
      category: "Laptop",
      price: 25000000,
      stock: 15,
      supplier: "Dell Vietnam",
    },
    {
      key: "2",
      code: "SP002",
      name: "iPhone 15 Pro",
      category: "Phone",
      price: 30000000,
      stock: 20,
      supplier: "Apple Store",
    },
    {
      key: "3",
      code: "SP003",
      name: "Samsung Galaxy S24",
      category: "Phone",
      price: 22000000,
      stock: 10,
      supplier: "Samsung VN",
    },
  ];

  const { visibleColumns, setVisibleColumns, filteredColumns, resetColumns } =
    useColumnVisibility(productColumns);

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          padding: "20px 24px",
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: "0 4px 20px rgba(245, 87, 108, 0.3)",
        }}
      >
        <h2
          style={{ margin: 0, color: "white", fontSize: 20, fontWeight: 600 }}
        >
          📦 Danh sách Sản phẩm
        </h2>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: "#8c8c8c" }}>
            Hiển thị {filteredColumns.length}/{productColumns.length} cột
          </span>
          <ColumnVisibilityDropdown
            columns={productColumns}
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
            onReset={resetColumns}
          />
        </div>
        <Table
          dataSource={productData}
          columns={filteredColumns}
          pagination={false}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================
const App = () => {
  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px",
          borderRadius: 16,
          marginBottom: 32,
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
        }}
      >
        <h1
          style={{ margin: 0, color: "white", fontSize: 32, fontWeight: 700 }}
        >
          🎯 Column Visibility Component
        </h1>
        <p
          style={{
            margin: "12px 0 0 0",
            color: "rgba(255,255,255,0.9)",
            fontSize: 16,
          }}
        >
          Component tái sử dụng cho nhiều bảng khác nhau
        </p>
      </div>

      <EmployeeTable />
      <ProductTable />

      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          border: "1px solid #e8e8e8",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#262626" }}>
          📖 Hướng dẫn sử dụng:
        </h3>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ color: "#1890ff", fontSize: 16 }}>
            1. Import Component & Hook:
          </h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`import { ColumnVisibilityDropdown, useColumnVisibility } from './ColumnVisibility';`}
          </pre>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ color: "#1890ff", fontSize: 16 }}>
            2. Định nghĩa columns (phải có key):
          </h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`const columns = [
  { key: 'id', title: 'ID', dataIndex: 'id' },
  { key: 'name', title: 'Tên', dataIndex: 'name' },
  // ...
];`}
          </pre>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ color: "#1890ff", fontSize: 16 }}>3. Sử dụng hook:</h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`const { 
  visibleColumns, 
  setVisibleColumns, 
  filteredColumns, 
  resetColumns 
} = useColumnVisibility(columns);`}
          </pre>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ color: "#1890ff", fontSize: 16 }}>
            4. Thêm dropdown button:
          </h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`<ColumnVisibilityDropdown
  columns={columns}
  visibleColumns={visibleColumns}
  onVisibilityChange={setVisibleColumns}
  onReset={resetColumns}
/>`}
          </pre>
        </div>

        <div>
          <h4 style={{ color: "#1890ff", fontSize: 16 }}>
            5. Sử dụng filteredColumns trong Table:
          </h4>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
            {`<Table 
  columns={filteredColumns} 
  dataSource={data}
/>`}
          </pre>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#e6f7ff",
            borderRadius: 8,
            borderLeft: "4px solid #1890ff",
          }}
        >
          <strong>✨ Tính năng:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
            <li>Dropdown không tự đóng khi click checkbox</li>
            <li>Có thể reset về trạng thái mặc định</li>
            <li>Tái sử dụng cho nhiều bảng khác nhau</li>
            <li>Hook quản lý state tự động</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
 */