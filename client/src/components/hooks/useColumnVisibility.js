import React, { useState } from "react";
import { Table, Button, Dropdown, Checkbox } from "antd";
import { SettingOutlined, ReloadOutlined } from "@ant-design/icons";

// hooks/useColumnVisibility.js

const useColumnVisibility = (columns) => {
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    columns.forEach((col) => {
      // nếu có defaultVisible thì dùng giá trị đó
      // nếu không có thì mặc định TRUE
      initial[col.key] = col.defaultVisible ?? true;
    });
    return initial;
  });

  const filteredColumns = columns.filter((col) => visibleColumns[col.key]);

  const resetColumns = () => {
    const reset = {};
    columns.forEach((col) => (reset[col.key] = col.defaultVisible ?? true));
    setVisibleColumns(reset);
  };

  return {
    visibleColumns,
    setVisibleColumns,
    filteredColumns,
    resetColumns,
  };
};

export default useColumnVisibility;
