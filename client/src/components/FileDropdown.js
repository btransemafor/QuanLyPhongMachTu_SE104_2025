import React, { useState } from "react";
import { Button, Dropdown, Upload, message } from "antd";
import {
  SettingOutlined,
  FileExcelOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
const FileDropdown = ({
  onExport,
  onImport,
  dataExport,
  nameFile,
  isHidden,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const onExportFile = async () => {
    // =================== Xuất file ( các record ) ====================== //
    try {
      if (!dataExport || dataExport.length === 0) {
        message.warning("Không có dữ liệu để xuất");
        return;
      }

      console.log("Data", dataExport);

      const formattedData = dataExport.map((item) => {
        const newItem = { ...item };

        // Format diseases
        if (Array.isArray(item.diseases)) {
          newItem.diseases = item.diseases
            .map((d) => `${d.disease_name} (${d.severity}) - ${d.disease_note}`)
            .join(", ");
        }

        // Format prescriptions
        if (Array.isArray(item.prescriptions)) {
          newItem.prescriptions = item.prescriptions
            .map((p) => `${p.medicine_name} - ${p.unit} - ${p.usage_method}`)
            .join(", ");
        }

        return newItem;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Chuyển workbook thành binary
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Tạo Blob
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${nameFile}.xlsx`;
      link.click();

      message.success("Xuất Excel thành công!");
    } catch (error) {
      console.error(error);
      message.error("Xuất Excel thất bại!");
    }
  };

  const dropdownContent = (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        //boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        padding: "10px",
        minWidth: 180,
        border: "1px solid #ccc",
      }}
    >
      {/* Xuất file */}
      <Button
        type="text"
        size="small"
        icon={<FileExcelOutlined style={{ fontSize: 18 }} />}
        style={{
          width: "100%",
          justifyContent: "flex-start",
          padding: "6px 10px",
          color: "#262626",
          fontWeight: 500,
        }}
        onClick={() => {
          //if (onExport) onExport();
          onExportFile();
          setDropdownOpen(false);
        }}
      >
        Xuất file
      </Button>

      {isHidden === "false" ? (
        <div>
          <hr style={{ margin: "8px 0", borderColor: "#eee" }} />
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              if (onImport) onImport(file);
              message.success(`${file.name} đã được chọn`);
              return false; // không upload tự động
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<UploadOutlined style={{ fontSize: 18 }} />}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                padding: "6px 10px",
                color: "#262626",
                fontWeight: 500,
              }}
            >
              Nhập file
            </Button>
          </Upload>
        </div>
      ) : null}
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomLeft"
      className="ml-6"
    >
      <Button
        icon={<SettingOutlined />}
        style={{
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      />
    </Dropdown>
  );
};

export default FileDropdown;
