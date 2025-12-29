import React, { useState } from 'react';
import { Table, Button, Dropdown, Checkbox } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';

const ColumnVisibilityDropdown = ({ 
  columns, 
  visibleColumns, 
  onVisibilityChange,
  onReset 
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleColumn = (columnKey) => {
    onVisibilityChange({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    });
  };

  const handleReset = () => {
    const reset = {};
    columns.forEach(col => reset[col.key] = true);
    onReset(reset);
  };

  const dropdownContent = (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        padding: 12,
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#262626',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '2px solid #f0f0f0',
        }}
      >
        Tùy chọn hiển thị cột
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {columns.map(col => (
          <div
            key={col.key}
            style={{
              padding: '8px 4px',
              cursor: 'pointer',
              borderRadius: 4,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleReset}
          style={{
            padding: '4px 8px',
            height: 'auto',
            color: '#1890ff',
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
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        icon={<SettingOutlined />}
        style={{
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Cột
      </Button>
    </Dropdown>
  );
};

export default ColumnVisibilityDropdown; 