-- ============================
-- PHẦN MỀM QUẢN LÝ PHÒNG MẠCH TƯ
-- PostgreSQL 
-- Tổng: 19 bảng
-- ============================

-- 1. ROLES (vai trò người dùng)
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,   -- Ví dụ: 'Admin', 'Bác sĩ', 'Lễ tân'
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- 2. USERS (nhân viên, bác sĩ)
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role_id INT REFERENCES roles(role_id) ON DELETE SET NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. PATIENTS
CREATE TABLE patients (
  patient_id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 4. UNITS (đơn vị thuốc)
CREATE TABLE units (
  unit_id SERIAL PRIMARY KEY,
  unit_name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- 5. USAGE_METHODS (cách dùng thuốc)
CREATE TABLE usage_methods (
  usage_method_id SERIAL PRIMARY KEY,
  usage_method_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- 6. MEDICINES (thuốc)
CREATE TABLE medicines (
  medicine_id SERIAL PRIMARY KEY,
  medicine_name VARCHAR(200) NOT NULL,
  unit_id INT REFERENCES units(unit_id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 7. IMPORT_RECEIPTS (phiếu nhập thuốc)
CREATE TABLE import_receipts (
  import_receipt_id SERIAL PRIMARY KEY,
  supplier_name VARCHAR(200),
  receipt_date DATE DEFAULT CURRENT_DATE,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  total_amount NUMERIC(14,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- 8. BATCHES (lô thuốc)
CREATE TABLE batches (
  batch_id SERIAL PRIMARY KEY,
  batch_code VARCHAR(50) UNIQUE,
  medicine_id INT REFERENCES medicines(medicine_id) ON DELETE CASCADE,
  import_receipt_id INT REFERENCES import_receipts(import_receipt_id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0,
  remaining_quantity INT NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  note TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- 9. DAILY_APPOINTMENTS (lịch khám trong ngày)
CREATE TABLE daily_appointments (
  daily_appointment_id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
  user_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- bác sĩ phụ trách
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  status VARCHAR(30) DEFAULT 'Chờ khám',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX idx_daily_appointments_date ON daily_appointments(appointment_date);

-- 10. MEDICAL_RECORDS (hồ sơ khám)
CREATE TABLE medical_records (
  medical_record_id SERIAL PRIMARY KEY,
  appointment_id INT REFERENCES daily_appointments(daily_appointment_id) ON DELETE SET NULL,
  patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
  doctor_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  total_med_cost NUMERIC(14,2) DEFAULT 0,
  examination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);

-- 11. DISEASES
CREATE TABLE diseases (
  disease_id SERIAL PRIMARY KEY,
  disease_name VARCHAR(200) NOT NULL,
  description TEXT
);

-- 12. DISEASE_DETAILS
CREATE TABLE disease_details (
  disease_detail_id SERIAL PRIMARY KEY,
  medical_record_id INT REFERENCES medical_records(medical_record_id) ON DELETE CASCADE,
  disease_id INT REFERENCES diseases(disease_id) ON DELETE SET NULL,
  severity VARCHAR(50),
  note TEXT
);

-- 13. PRESCRIPTION_DETAIL
CREATE TABLE prescription_detail (
  prescription_detail_id SERIAL PRIMARY KEY,
  medical_record_id INT REFERENCES medical_records(medical_record_id) ON DELETE CASCADE,
  batch_id INT REFERENCES batches(batch_id) ON DELETE SET NULL,
  medicine_id INT REFERENCES medicines(medicine_id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  sell_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  usage_method_id INT REFERENCES usage_methods(usage_method_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 14. INVOICES (hóa đơn)
CREATE TABLE invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_code VARCHAR(50) UNIQUE,
  medical_record_id INT REFERENCES medical_records(medical_record_id) ON DELETE SET NULL,
  patient_id INT REFERENCES patients(patient_id) ON DELETE SET NULL,
  consultation_fee NUMERIC(12,2) DEFAULT 0,
  medicine_fee NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  daily_appointment_id INT REFERENCES daily_appointments(daily_appointment_id) ON DELETE SET NULL,
  payment_method VARCHAR(50),
  payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 15. MEDICINE_USAGE_REPORTS
CREATE TABLE medicine_usage_reports (
  medicine_usage_report_id SERIAL PRIMARY KEY,
  month_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 16. MEDICINE_USAGE_REPORTS_DETAILS
CREATE TABLE medicine_usage_reports_details (
  id SERIAL PRIMARY KEY,
  medicine_usage_report_id INT REFERENCES medicine_usage_reports(medicine_usage_report_id) ON DELETE CASCADE,
  medicine_id INT REFERENCES medicines(medicine_id) ON DELETE SET NULL,
  usage_count INT DEFAULT 0,
  quantity_used INT DEFAULT 0
);

-- 17. MONTHLY_REVENUE_REPORTS
CREATE TABLE monthly_revenue_reports (
  monthly_report_id SERIAL PRIMARY KEY,
  month_year VARCHAR(20) NOT NULL,
  total_revenue NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- 18. DAILY_REVENUE_REPORTS
CREATE TABLE daily_revenue_reports (
  daily_report_id SERIAL PRIMARY KEY,
  monthly_report_id INT REFERENCES monthly_revenue_reports(monthly_report_id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  patient_count INT DEFAULT 0,
  revenue NUMERIC(14,2) DEFAULT 0,
  revenue_rate NUMERIC(8,4) DEFAULT 0
);
CREATE UNIQUE INDEX ux_daily_report_date_month ON daily_revenue_reports(monthly_report_id, report_date);

-- 19. SETTINGS
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- ============================
-- INDEXES (tăng tốc truy vấn)
-- ============================
CREATE INDEX idx_medicines_name ON medicines (medicine_name);
CREATE INDEX idx_batches_medicine ON batches (medicine_id);
CREATE INDEX idx_invoices_medrec ON invoices (medical_record_id);
CREATE INDEX idx_presc_batch ON prescription_detail (batch_id);

-- ============================
-- Trigger tự động tính tiền hóa đơn (tùy chọn)
-- ============================
CREATE OR REPLACE FUNCTION fn_compute_invoice_total() RETURNS TRIGGER AS $$
DECLARE
  med_sum NUMERIC := 0;
BEGIN
  IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
    SELECT COALESCE(SUM(pd.quantity * pd.sell_price),0)
      INTO med_sum
      FROM prescription_detail pd
      WHERE pd.medical_record_id = NEW.medical_record_id;
    NEW.medicine_fee := med_sum;
    NEW.total_amount := COALESCE(NEW.consultation_fee,0) + med_sum;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_invoice_total
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION fn_compute_invoice_total();

-- ============================
-- END OF SCRIPT
-- ============================
