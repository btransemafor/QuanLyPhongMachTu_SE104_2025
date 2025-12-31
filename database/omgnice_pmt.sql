--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2025-12-29 16:26:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 3322801)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 3 (class 3079 OID 3331164)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 3322550)
-- Name: batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.batches (
    batch_id integer NOT NULL,
    batch_code character varying(50),
    medicine_id integer,
    import_receipt_id integer,
    quantity integer DEFAULT 0 NOT NULL,
    remaining_quantity integer DEFAULT 0 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    expiry_date date,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.batches OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 3322549)
-- Name: batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.batches_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_batch_id_seq OWNER TO postgres;

--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 231
-- Name: batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.batches_batch_id_seq OWNED BY public.batches.batch_id;


--
-- TOC entry 234 (class 1259 OID 3322576)
-- Name: daily_appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_appointments (
    daily_appointment_id integer NOT NULL,
    patient_id integer,
    user_id integer,
    appointment_date date NOT NULL,
    appointment_time time without time zone,
    status character varying(30) DEFAULT 'Ch? kh m'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    medical_record_id integer
);


ALTER TABLE public.daily_appointments OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 3322575)
-- Name: daily_appointments_daily_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_appointments_daily_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_appointments_daily_appointment_id_seq OWNER TO postgres;

--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 233
-- Name: daily_appointments_daily_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_appointments_daily_appointment_id_seq OWNED BY public.daily_appointments.daily_appointment_id;


--
-- TOC entry 252 (class 1259 OID 3322747)
-- Name: daily_revenue_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_revenue_reports (
    daily_report_id integer NOT NULL,
    monthly_report_id integer,
    report_date date NOT NULL,
    patient_count integer DEFAULT 0,
    revenue numeric(14,2) DEFAULT 0,
    revenue_rate numeric(8,4) DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.daily_revenue_reports OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 3322746)
-- Name: daily_revenue_reports_daily_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_revenue_reports_daily_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_revenue_reports_daily_report_id_seq OWNER TO postgres;

--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 251
-- Name: daily_revenue_reports_daily_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_revenue_reports_daily_report_id_seq OWNED BY public.daily_revenue_reports.daily_report_id;


--
-- TOC entry 240 (class 1259 OID 3322633)
-- Name: disease_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disease_details (
    disease_detail_id integer NOT NULL,
    medical_record_id integer,
    disease_id integer,
    severity character varying(50),
    note text,
    is_primary boolean
);


ALTER TABLE public.disease_details OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 3322632)
-- Name: disease_details_disease_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disease_details_disease_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disease_details_disease_detail_id_seq OWNER TO postgres;

--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 239
-- Name: disease_details_disease_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disease_details_disease_detail_id_seq OWNED BY public.disease_details.disease_detail_id;


--
-- TOC entry 238 (class 1259 OID 3322624)
-- Name: diseases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diseases (
    disease_id integer NOT NULL,
    disease_name character varying(200) NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.diseases OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 3322623)
-- Name: diseases_disease_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.diseases_disease_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.diseases_disease_id_seq OWNER TO postgres;

--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 237
-- Name: diseases_disease_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.diseases_disease_id_seq OWNED BY public.diseases.disease_id;


--
-- TOC entry 230 (class 1259 OID 3322533)
-- Name: import_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_receipts (
    import_receipt_id integer NOT NULL,
    supplier_name character varying(200),
    receipt_date timestamp without time zone DEFAULT CURRENT_DATE,
    user_id integer,
    total_amount numeric(14,2) DEFAULT 0,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    status character varying(20) DEFAULT 'draft'::character varying
);


ALTER TABLE public.import_receipts OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 3322532)
-- Name: import_receipts_import_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_receipts_import_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_receipts_import_receipt_id_seq OWNER TO postgres;

--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 229
-- Name: import_receipts_import_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_receipts_import_receipt_id_seq OWNED BY public.import_receipts.import_receipt_id;


--
-- TOC entry 244 (class 1259 OID 3322682)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    invoice_code character varying(50),
    medical_record_id integer,
    consultation_fee numeric(12,2) DEFAULT 0,
    medicine_fee numeric(12,2) DEFAULT 0,
    total_amount numeric(14,2) DEFAULT 0,
    daily_appointment_id integer,
    payment_method character varying(50),
    payment_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    payment_status character varying(20),
    created_by_id integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    note character varying(255),
    invoice_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 3322681)
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_invoice_id_seq OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 243
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- TOC entry 236 (class 1259 OID 3322596)
-- Name: medical_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_records (
    medical_record_id integer NOT NULL,
    patient_id integer,
    doctor_id integer,
    symptoms text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    revisit_date date,
    status character varying(20),
    visit_date timestamp without time zone
);


ALTER TABLE public.medical_records OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 3322595)
-- Name: medical_records_medical_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_records_medical_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_records_medical_record_id_seq OWNER TO postgres;

--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 235
-- Name: medical_records_medical_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_records_medical_record_id_seq OWNED BY public.medical_records.medical_record_id;


--
-- TOC entry 246 (class 1259 OID 3322711)
-- Name: medicine_usage_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicine_usage_reports (
    medicine_usage_report_id integer NOT NULL,
    month_year character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.medicine_usage_reports OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 3322719)
-- Name: medicine_usage_reports_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicine_usage_reports_details (
    id integer NOT NULL,
    medicine_usage_report_id integer,
    medicine_id integer,
    usage_count integer DEFAULT 0,
    quantity_used integer DEFAULT 0,
    total_value numeric(18,2)
);


ALTER TABLE public.medicine_usage_reports_details OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 3322718)
-- Name: medicine_usage_reports_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicine_usage_reports_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_usage_reports_details_id_seq OWNER TO postgres;

--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 247
-- Name: medicine_usage_reports_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicine_usage_reports_details_id_seq OWNED BY public.medicine_usage_reports_details.id;


--
-- TOC entry 245 (class 1259 OID 3322710)
-- Name: medicine_usage_reports_medicine_usage_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicine_usage_reports_medicine_usage_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicine_usage_reports_medicine_usage_report_id_seq OWNER TO postgres;

--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 245
-- Name: medicine_usage_reports_medicine_usage_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicine_usage_reports_medicine_usage_report_id_seq OWNED BY public.medicine_usage_reports.medicine_usage_report_id;


--
-- TOC entry 228 (class 1259 OID 3322517)
-- Name: medicines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicines (
    medicine_id integer NOT NULL,
    medicine_name character varying(200) NOT NULL,
    unit_id integer,
    stock_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_active boolean DEFAULT true,
    min_stock_level integer DEFAULT 0,
    status character varying(20),
    note character varying(255)
);


ALTER TABLE public.medicines OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 3322516)
-- Name: medicines_medicine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicines_medicine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicines_medicine_id_seq OWNER TO postgres;

--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 227
-- Name: medicines_medicine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicines_medicine_id_seq OWNED BY public.medicines.medicine_id;


--
-- TOC entry 250 (class 1259 OID 3322738)
-- Name: monthly_revenue_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_revenue_reports (
    monthly_report_id integer NOT NULL,
    month_year character varying(20) NOT NULL,
    total_revenue numeric(14,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    total_patient_count integer
);


ALTER TABLE public.monthly_revenue_reports OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 3322737)
-- Name: monthly_revenue_reports_monthly_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.monthly_revenue_reports_monthly_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthly_revenue_reports_monthly_report_id_seq OWNER TO postgres;

--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 249
-- Name: monthly_revenue_reports_monthly_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.monthly_revenue_reports_monthly_report_id_seq OWNED BY public.monthly_revenue_reports.monthly_report_id;


--
-- TOC entry 255 (class 1259 OID 3322775)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    user_id character varying(36) NOT NULL,
    token character varying(128) NOT NULL,
    token_expiry timestamp with time zone NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 3322489)
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    patient_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    address text,
    phone character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    isarchived boolean,
    is_active boolean
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 3322488)
-- Name: patients_patient_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_patient_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_patient_id_seq OWNER TO postgres;

--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 221
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- TOC entry 242 (class 1259 OID 3322652)
-- Name: prescription_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescription_detail (
    prescription_detail_id integer NOT NULL,
    medical_record_id integer,
    batch_id integer,
    medicine_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    sell_price numeric(12,2) DEFAULT 0 NOT NULL,
    usage_method_id integer,
    created_at timestamp without time zone DEFAULT now(),
    total numeric(10,2)
);


ALTER TABLE public.prescription_detail OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 3322651)
-- Name: prescription_detail_prescription_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescription_detail_prescription_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescription_detail_prescription_detail_id_seq OWNER TO postgres;

--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 241
-- Name: prescription_detail_prescription_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescription_detail_prescription_detail_id_seq OWNED BY public.prescription_detail.prescription_detail_id;


--
-- TOC entry 218 (class 1259 OID 3322459)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 3322458)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 254 (class 1259 OID 3322763)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    description text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 3322762)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 253
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 224 (class 1259 OID 3322499)
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    unit_id integer NOT NULL,
    unit_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.units OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 3322498)
-- Name: units_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_unit_id_seq OWNER TO postgres;

--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 223
-- Name: units_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_unit_id_seq OWNED BY public.units.unit_id;


--
-- TOC entry 226 (class 1259 OID 3322508)
-- Name: usage_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_methods (
    usage_method_id integer NOT NULL,
    usage_method_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.usage_methods OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 3322507)
-- Name: usage_methods_usage_method_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usage_methods_usage_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usage_methods_usage_method_id_seq OWNER TO postgres;

--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 225
-- Name: usage_methods_usage_method_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usage_methods_usage_method_id_seq OWNED BY public.usage_methods.usage_method_id;


--
-- TOC entry 220 (class 1259 OID 3322471)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role_id integer,
    phone character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 3322470)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4861 (class 2604 OID 3322553)
-- Name: batches batch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches ALTER COLUMN batch_id SET DEFAULT nextval('public.batches_batch_id_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 3322579)
-- Name: daily_appointments daily_appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_appointments ALTER COLUMN daily_appointment_id SET DEFAULT nextval('public.daily_appointments_daily_appointment_id_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 3322750)
-- Name: daily_revenue_reports daily_report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_revenue_reports ALTER COLUMN daily_report_id SET DEFAULT nextval('public.daily_revenue_reports_daily_report_id_seq'::regclass);


--
-- TOC entry 4875 (class 2604 OID 3322636)
-- Name: disease_details disease_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disease_details ALTER COLUMN disease_detail_id SET DEFAULT nextval('public.disease_details_disease_detail_id_seq'::regclass);


--
-- TOC entry 4871 (class 2604 OID 3322627)
-- Name: diseases disease_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diseases ALTER COLUMN disease_id SET DEFAULT nextval('public.diseases_disease_id_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 3322536)
-- Name: import_receipts import_receipt_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts ALTER COLUMN import_receipt_id SET DEFAULT nextval('public.import_receipts_import_receipt_id_seq'::regclass);


--
-- TOC entry 4880 (class 2604 OID 3322685)
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 3322599)
-- Name: medical_records medical_record_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN medical_record_id SET DEFAULT nextval('public.medical_records_medical_record_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 3322714)
-- Name: medicine_usage_reports medicine_usage_report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports ALTER COLUMN medicine_usage_report_id SET DEFAULT nextval('public.medicine_usage_reports_medicine_usage_report_id_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 3322722)
-- Name: medicine_usage_reports_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports_details ALTER COLUMN id SET DEFAULT nextval('public.medicine_usage_reports_details_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 3322520)
-- Name: medicines medicine_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicines ALTER COLUMN medicine_id SET DEFAULT nextval('public.medicines_medicine_id_seq'::regclass);


--
-- TOC entry 4893 (class 2604 OID 3322741)
-- Name: monthly_revenue_reports monthly_report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_revenue_reports ALTER COLUMN monthly_report_id SET DEFAULT nextval('public.monthly_revenue_reports_monthly_report_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 3322492)
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 3322655)
-- Name: prescription_detail prescription_detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail ALTER COLUMN prescription_detail_id SET DEFAULT nextval('public.prescription_detail_prescription_detail_id_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 3322462)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 3322766)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 3322502)
-- Name: units unit_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN unit_id SET DEFAULT nextval('public.units_unit_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 3322511)
-- Name: usage_methods usage_method_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_methods ALTER COLUMN usage_method_id SET DEFAULT nextval('public.usage_methods_usage_method_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 3322474)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5144 (class 0 OID 3322550)
-- Dependencies: 232
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.batches (batch_id, batch_code, medicine_id, import_receipt_id, quantity, remaining_quantity, unit_price, expiry_date, note, created_at, updated_at) FROM stdin;
71	LO00005	34	50	60	60	5000.00	2027-12-31	\N	2025-11-21 12:36:08.313945	\N
70	LO00004	32	50	55	0	5600.00	2026-11-30	\N	2025-11-21 12:36:08.313945	\N
138	LO000026	32	94	50	50	7900.00	2026-12-31	Lô bên Lào	2025-11-25 00:19:28.820495	\N
151	LO000030	37	106	50	50	7700.00	2028-12-24	Bó tay rồi , tui chịu luon á 	2025-12-05 20:04:57.390514	\N
81	LO00009	34	60	50	30	7000.00	2026-12-31	Tui hay lắm	2025-11-21 13:15:13.73832	\N
137	LO000025	33	94	100	0	9500.00	2027-12-31	Lô bên cam	2025-11-25 00:19:28.820495	2025-12-15 13:48:06.092496
77	LO00008	32	56	125	0	4500.00	2026-12-31	\N	2025-11-21 13:03:23.338012	2025-12-09 15:15:55.373336
141	LO000027	38	\N	30	20	7000.00	2025-12-31	haha	2025-11-25 00:37:23.5569	\N
142	LO000028	37	\N	50	0	11000.00	2026-12-31	hihihoho	2025-11-25 00:37:23.5569	\N
95	LO000017	33	\N	20	20	5000.00	2027-12-31	qua dang cap	2025-11-24 13:29:17.44519	\N
105	LO00018	34	76	50	50	7600.00	2026-12-31	omgnice	2025-11-24 14:06:58.182965	\N
106	LO00019	32	76	100	100	9000.00	2027-12-31	toi yeu ban 	2025-11-24 14:06:58.182965	\N
152	LO000029	35	106	55	55	8000.00	2026-12-31	HEHE kkkk, anh nhớ em quá	2025-12-05 20:04:57.390514	\N
156	LO0000031	36	102	24	24	7000.00	2027-01-05	Thuaaa	2025-12-05 20:18:08.838472	\N
157	LO0000027	37	102	50	50	6500.00	2027-12-31	Chịu luôn á 	2025-12-05 20:18:08.838472	\N
158	LO0000026	35	102	5	5	7500.00	2026-12-31	Bó tay XYZ	2025-12-05 20:18:08.838472	\N
119	LO00010	33	\N	50	50	7600.00	2027-12-31		2025-11-24 14:30:56.837377	\N
116	LO000021	34	82	70	70	7000.00	2026-11-30	omgggggg	2025-11-24 14:26:45.05223	\N
120	LO000011	33	\N	60	60	8000.00	2025-12-31		2025-11-24 14:31:31.633367	\N
118	LO00020	35	80	50	50	6000.00	2026-11-30	hehehe gioi qua co len 	2025-11-24 14:27:39.899421	\N
162	Batch/2025/12/779P51	35	108	150	150	6000.00	2028-12-31	Hehe cố lên nha, tranvo mãi đỉnh 	2025-12-16 23:51:31.522009	\N
123	LO000023	34	86	10	10	20000.00	2026-12-31	hahaha	2025-11-24 14:35:00.905286	\N
164	Batch/2025/12/FJ6R9R	37	109	40	40	6500.00	2026-01-31	Test Status thuốc khi mua thêm 	2025-12-16 23:56:09.295902	\N
165	Batch/2025/12/EOB2AW	35	110	50	50	8500.00	2026-12-31	hehe 	2025-12-17 00:05:01.564788	\N
72	LO00006	35	51	50	0	4500.00	2025-12-31	\N	2025-11-21 12:38:06.877377	\N
93	LO000016	32	\N	20	0	7500.00	2026-12-31	omgnice lo ben Campuchia ne 	2025-11-24 13:21:16.173452	\N
67	LO000001	32	48	100	0	5600.00	2027-12-31	\N	2025-11-21 12:26:04.287761	\N
73	LO00007	32	52	120	115	7900.00	2027-12-31	\N	2025-11-21 12:43:16.686814	\N
163	Batch/2025/12/IGTM5M	38	108	200	190	5000.00	2027-12-31	Cho tui test xiu	2025-12-16 23:51:31.522009	\N
68	LO00002	35	49	50	0	12000.00	2026-12-31	\N	2025-11-21 12:34:30.860898	\N
144	LO0000025	37	101	100	60	9500.00	2027-12-31	Thua	2025-12-05 19:49:33.389634	2025-12-09 15:03:51.028029
166	Batch/2025/12/3UIYGT	45	111	100	100	55000.00	2027-12-31	Thuốc tỉnh táo chạy dll kkkkk	2025-12-17 00:37:12.309739	\N
159	LO000040	32	107	50	50	6000.00	2026-12-31	Test lo cai	2025-12-09 14:21:46.800902	\N
136	LO000024	36	94	300	226	4500.00	2026-12-31	Lô bên thái lan	2025-11-25 00:19:28.820495	\N
89	LO000012	35	68	30	15	7600.00	2026-12-10	\N	2025-11-24 03:17:37.201978	\N
121	LO000022	32	\N	70	30	8000.00	2026-12-31	omgniceeeee	2025-11-24 14:32:41.834729	\N
91	LO000013	33	70	30	0	7000.00	2026-12-31	leoo	2025-11-24 13:11:15.417162	2025-12-15 13:45:45.807804
69	LO00003	34	49	80	0	6700.00	2026-12-31	\N	2025-11-21 12:34:30.860898	\N
\.


--
-- TOC entry 5146 (class 0 OID 3322576)
-- Dependencies: 234
-- Data for Name: daily_appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_appointments (daily_appointment_id, patient_id, user_id, appointment_date, appointment_time, status, created_at, updated_at, medical_record_id) FROM stdin;
50	7	\N	2025-12-03	\N	completed	2025-12-03 15:22:21.908501	2025-12-03 18:29:05.182264	54
9	4	\N	2025-11-21	\N	waiting	2025-11-21 21:27:40.301766	\N	\N
10	3	\N	2025-11-21	\N	waiting	2025-11-21 21:28:21.01069	\N	\N
11	5	\N	2025-11-21	\N	waiting	2025-11-21 21:28:27.017072	\N	\N
13	6	\N	2025-11-21	\N	waiting	2025-11-21 22:46:53.311935	\N	\N
82	23	\N	2025-12-08	\N	waiting	2025-12-08 23:43:29.215987	\N	\N
14	13	\N	2025-11-22	\N	examined	2025-11-22 00:03:41.207639	2025-11-22 00:05:28.095195	26
16	3	\N	2025-11-22	\N	waiting	2025-11-22 19:24:37.529853	\N	\N
15	9	\N	2025-11-22	\N	examined	2025-11-22 19:24:30.494257	2025-11-22 19:31:28.591338	29
17	3	\N	2025-11-23	\N	examined	2025-11-23 00:38:20.717258	2025-11-23 00:39:57.972317	30
18	7	\N	2025-11-23	\N	waiting	2025-11-23 02:18:32.286733	\N	\N
19	13	\N	2025-11-23	\N	waiting	2025-11-23 02:20:33.775315	\N	\N
20	6	\N	2025-11-23	\N	waiting	2025-11-23 02:20:47.411819	\N	\N
21	15	\N	2025-11-24	\N	examined	2025-11-24 18:09:28.849648	2025-11-24 18:11:20.64327	31
22	13	\N	2025-11-24	\N	waiting	2025-11-24 23:28:19.315424	\N	\N
23	13	\N	2025-11-25	\N	examined	2025-11-25 00:01:49.165432	2025-11-25 00:12:49.885874	32
24	15	\N	2025-11-25	\N	examined	2025-11-25 00:14:19.852025	2025-11-25 00:41:18.010927	33
25	6	\N	2025-11-25	\N	examined	2025-11-25 00:38:10.191962	2025-11-25 15:38:04.623791	34
51	8	\N	2025-12-03	\N	completed	2025-12-03 15:22:22.59963	2025-12-04 00:14:41.030738	55
26	10	\N	2025-11-25	\N	completed	2025-11-25 19:47:07.266494	2025-11-25 22:53:38.531728	35
27	1	\N	2025-11-25	\N	completed	2025-11-25 22:59:46.110314	2025-11-25 23:48:03.042234	36
83	24	\N	2025-12-08	\N	waiting	2025-12-08 23:55:22.592469	\N	\N
28	7	\N	2025-11-25	\N	completed	2025-11-25 23:53:46.642535	2025-11-26 00:46:55.256885	37
60	11	\N	2025-12-04	\N	completed	2025-12-04 00:17:09.960612	2025-12-04 00:21:06.742662	56
29	17	\N	2025-11-26	\N	completed	2025-11-26 02:03:07.063863	2025-11-26 02:04:10.542061	38
30	6	\N	2025-11-26	\N	waiting	2025-11-26 21:21:25.270782	\N	\N
31	1	\N	2025-11-27	\N	completed	2025-11-27 00:42:07.309123	2025-11-27 00:44:18.033218	39
32	15	\N	2025-11-27	\N	completed	2025-11-27 01:03:28.156644	2025-11-27 01:12:59.413346	40
34	7	\N	2025-11-27	\N	completed	2025-11-27 11:39:41.410647	2025-11-27 14:57:16.649333	43
33	3	\N	2025-11-27	\N	completed	2025-11-27 11:07:10.759534	2025-11-27 22:11:54.229812	42
63	17	\N	2025-12-04	\N	completed	2025-12-04 00:28:06.613217	2025-12-04 00:29:31.292208	59
61	13	\N	2025-12-04	\N	completed	2025-12-04 00:21:58.134537	2025-12-04 00:29:32.187386	58
36	10	\N	2025-11-27	\N	completed	2025-11-27 22:23:16.251445	2025-12-02 16:40:57.552371	45
38	14	\N	2025-12-02	\N	completed	2025-12-02 16:06:40.804731	2025-12-02 17:49:52.128779	47
12	13	\N	2025-11-21	\N	completed	2025-11-21 21:36:58.676612	2025-12-02 17:54:37.356676	24
37	11	\N	2025-11-27	\N	completed	2025-11-27 23:08:13.608877	2025-12-02 17:54:53.754579	46
35	8	\N	2025-11-27	\N	completed	2025-11-27 13:32:36.859106	2025-12-02 17:55:02.182362	44
8	14	\N	2025-11-21	\N	completed	2025-11-21 11:39:55.772453	2025-12-02 17:59:03.445633	22
39	13	\N	2025-12-02	\N	completed	2025-12-02 18:05:23.281405	2025-12-02 18:17:32.02372	48
41	3	\N	2025-12-02	\N	waiting	2025-12-02 23:01:27.944752	\N	\N
42	4	\N	2025-12-02	\N	waiting	2025-12-02 23:01:28.477139	\N	\N
43	5	\N	2025-12-02	\N	waiting	2025-12-02 23:01:29.181708	\N	\N
44	7	\N	2025-12-02	\N	waiting	2025-12-02 23:01:29.717485	\N	\N
45	8	\N	2025-12-02	\N	waiting	2025-12-02 23:01:30.286224	\N	\N
46	9	\N	2025-12-02	\N	waiting	2025-12-02 23:01:31.047622	\N	\N
40	1	\N	2025-12-02	\N	completed	2025-12-02 23:01:22.340909	2025-12-03 00:03:58.804755	49
52	9	\N	2025-12-03	\N	waiting	2025-12-03 15:22:23.747416	\N	\N
53	10	\N	2025-12-03	\N	waiting	2025-12-03 15:22:24.442216	\N	\N
54	11	\N	2025-12-03	\N	waiting	2025-12-03 15:22:25.035546	\N	\N
55	17	\N	2025-12-03	\N	waiting	2025-12-03 15:22:27.171204	\N	\N
56	15	\N	2025-12-03	\N	waiting	2025-12-03 15:22:27.636259	\N	\N
57	14	\N	2025-12-03	\N	waiting	2025-12-03 15:22:28.282255	\N	\N
58	13	\N	2025-12-03	\N	waiting	2025-12-03 15:22:28.948964	\N	\N
59	12	\N	2025-12-03	\N	waiting	2025-12-03 15:22:29.600699	\N	\N
47	1	\N	2025-12-03	\N	completed	2025-12-03 09:33:16.28399	2025-12-03 16:05:28.60389	50
65	4	\N	2025-12-05	\N	completed	2025-12-05 12:35:06.883979	2025-12-05 14:24:08.264048	61
66	3	\N	2025-12-05	\N	waiting	2025-12-05 22:59:13.912004	\N	\N
49	3	\N	2025-12-03	\N	completed	2025-12-03 15:22:19.735613	2025-12-03 18:07:05.468992	52
48	2	\N	2025-12-03	\N	completed	2025-12-03 15:22:19.030975	2025-12-03 18:07:07.840125	51
102	15	\N	2025-12-12	\N	examined	2025-12-12 12:22:41.955284	2025-12-12 13:22:03.075869	92
67	5	\N	2025-12-05	\N	waiting	2025-12-05 22:59:15.507596	\N	\N
68	6	\N	2025-12-05	\N	waiting	2025-12-05 22:59:19.137356	\N	\N
69	9	\N	2025-12-05	\N	waiting	2025-12-05 22:59:20.679773	\N	\N
64	2	\N	2025-12-04	\N	completed	2025-12-04 00:41:40.276774	2025-12-05 23:22:37.932193	60
70	1	\N	2025-12-06	\N	waiting	2025-12-06 23:45:17.782428	\N	\N
89	9	\N	2025-12-09	\N	completed	2025-12-09 15:19:40.352776	2025-12-09 15:22:05.030743	74
71	1	\N	2025-12-07	\N	completed	2025-12-07 16:11:21.87617	2025-12-07 16:12:40.470135	62
73	14	\N	2025-12-07	\N	examined	2025-12-07 17:06:25.081099	2025-12-07 18:31:22.721808	64
74	15	\N	2025-12-07	\N	waiting	2025-12-07 22:07:33.682561	\N	\N
75	13	\N	2025-12-08	\N	waiting	2025-12-08 00:45:27.313326	\N	\N
79	14	\N	2025-12-08	\N	waiting	2025-12-08 00:45:31.53758	\N	\N
80	22	\N	2025-12-08	\N	waiting	2025-12-08 00:45:51.59679	\N	\N
96	9	\N	2025-12-10	\N	completed	2025-12-10 23:52:06.461805	2025-12-10 23:58:13.566795	81
81	7	\N	2025-12-08	\N	waiting	2025-12-08 15:42:46.439772	\N	\N
76	1	\N	2025-12-08	\N	completed	2025-12-08 00:45:28.632136	2025-12-08 17:23:49.971725	65
72	22	\N	2025-12-07	\N	completed	2025-12-07 16:14:03.788527	2025-12-08 17:23:51.19188	63
90	10	\N	2025-12-09	\N	completed	2025-12-09 15:26:42.122461	2025-12-09 15:35:37.614086	75
77	6	\N	2025-12-08	\N	completed	2025-12-08 00:45:29.421495	2025-12-08 21:20:39.399426	66
91	6	\N	2025-12-09	\N	completed	2025-12-09 15:45:48.450791	2025-12-09 15:46:23.129325	76
98	10	\N	2025-12-11	\N	waiting	2025-12-11 00:28:42.943225	\N	\N
103	5	\N	2025-12-12	\N	waiting	2025-12-12 17:37:40.898789	\N	\N
92	1	\N	2025-12-09	\N	completed	2025-12-09 19:29:21.302685	2025-12-09 19:40:19.099132	77
94	25	\N	2025-12-09	\N	waiting	2025-12-09 20:54:26.372343	\N	\N
97	9	\N	2025-12-11	\N	completed	2025-12-11 00:28:27.997907	2025-12-11 01:25:23.384712	82
95	10	\N	2025-12-10	\N	completed	2025-12-10 23:52:02.132158	2025-12-10 23:56:40.932555	80
93	14	\N	2025-12-09	\N	completed	2025-12-09 19:29:23.524248	2025-12-10 23:56:41.809681	79
99	26	\N	2025-12-11	\N	waiting	2025-12-11 22:03:03.170076	\N	\N
100	1	\N	2025-12-12	\N	examined	2025-12-12 00:07:25.126986	2025-12-12 09:33:23.787902	83
113	13	\N	2025-12-17	\N	completed	2025-12-17 00:09:36.995933	2025-12-26 15:32:52.003732	99
104	27	\N	2025-12-13	\N	waiting	2025-12-13 23:17:22.606227	\N	\N
105	8	\N	2025-12-13	\N	examined	2025-12-13 23:33:37.450771	2025-12-13 23:36:30.817971	93
106	4	\N	2025-12-13	\N	examined	2025-12-13 23:40:26.904689	2025-12-13 23:42:40.079686	94
108	4	\N	2025-12-14	\N	waiting	2025-12-14 16:17:48.324074	\N	\N
101	13	\N	2025-12-12	\N	completed	2025-12-12 09:50:38.322483	2025-12-14 16:30:05.221944	91
110	7	\N	2025-12-14	\N	examined	2025-12-14 16:17:50.265089	2025-12-14 17:39:54.107557	96
109	6	\N	2025-12-14	\N	completed	2025-12-14 16:17:49.550777	2025-12-14 17:42:00.506626	97
112	2	\N	2025-12-16	\N	waiting	2025-12-16 01:04:29.745951	\N	\N
116	1	\N	2025-12-26	\N	examined	2025-12-26 15:11:53.527472	2025-12-26 15:49:21.669943	102
107	2	\N	2025-12-14	\N	completed	2025-12-14 16:17:47.300462	2025-12-26 15:32:07.799846	95
114	29	\N	2025-12-17	\N	completed	2025-12-17 00:21:13.290439	2025-12-26 15:32:04.094426	100
111	2	\N	2025-12-15	\N	completed	2025-12-15 14:37:53.301543	2025-12-26 15:59:11.005139	98
115	13	\N	2025-12-26	\N	completed	2025-12-26 15:06:21.652009	2025-12-26 15:29:35.610932	101
118	7	\N	2025-12-26	\N	waiting	2025-12-26 15:54:15.680767	\N	\N
119	8	\N	2025-12-26	\N	waiting	2025-12-26 15:54:16.608638	\N	\N
120	9	\N	2025-12-26	\N	waiting	2025-12-26 15:54:17.413676	\N	\N
121	10	\N	2025-12-26	\N	waiting	2025-12-26 15:54:18.064311	\N	\N
122	2	\N	2025-12-26	\N	waiting	2025-12-26 15:54:21.787967	\N	\N
123	4	\N	2025-12-26	\N	waiting	2025-12-26 15:54:23.49709	\N	\N
124	5	\N	2025-12-26	\N	waiting	2025-12-26 15:54:24.268312	\N	\N
117	3	\N	2025-12-26	\N	examined	2025-12-26 15:54:12.104042	2025-12-26 15:56:00.360037	103
\.


--
-- TOC entry 5164 (class 0 OID 3322747)
-- Dependencies: 252
-- Data for Name: daily_revenue_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_revenue_reports (daily_report_id, monthly_report_id, report_date, patient_count, revenue, revenue_rate, updated_at) FROM stdin;
58037	11744	2025-12-14	2	448200.00	9.0909	2025-12-15 22:32:31.342464
16	16	2025-11-22	2	474750.00	14.1500	2025-12-09 11:31:00.096391
46	16	2025-11-23	1	170250.00	5.0800	2025-12-09 11:31:00.096391
155	16	2025-11-24	1	255000.00	7.6000	2025-12-09 11:31:00.096391
297	16	2025-11-25	5	1207250.00	35.9900	2025-12-09 11:31:00.096391
5382	16	2025-11-26	2	232150.00	6.9200	2025-12-09 11:31:00.096391
11368	16	2025-11-27	5	1015250.00	30.2600	2025-12-09 11:31:00.096391
\.


--
-- TOC entry 5152 (class 0 OID 3322633)
-- Dependencies: 240
-- Data for Name: disease_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disease_details (disease_detail_id, medical_record_id, disease_id, severity, note, is_primary) FROM stdin;
11	22	10	Rất nặng	Luôn suy nghĩ quá nhiều, mất ngủ 	\N
14	23	10	Trung bình	\N	\N
17	25	10	Trung bình	OMGNICE	\N
18	26	10	Rất nặng	troi oi co len	\N
20	29	5	Nhẹ	\N	\N
21	29	10	Trung bình	\N	\N
22	30	9	Rất nặng	\N	\N
23	31	9	Nhẹ	Ngồi lâu thấy ê chân và đít	\N
24	31	5	Nhẹ	Mắc ói buổi sáng	\N
25	32	12	Trung bình	Tàn tạ, tày quày, hết thuốc chữa	\N
26	33	13	Trung bình	Ỉa lỏng liên tục, cứu tôi, mấy ngày nay chưa hết	\N
27	34	12	Trung bình	Khó nói	\N
28	35	9	Trung bình	thua luon	\N
29	36	12	Nặng	Nhieeuf o viem - co len nha	\N
30	37	9	Trung bình	\N	\N
31	38	13	Nhẹ	\N	\N
32	39	5	Nặng	OMG	\N
33	40	12	Nặng	\N	\N
34	42	13	Trung bình	omgniceeeeeeee	\N
35	43	8	Trung bình	\N	\N
37	44	14	Trung bình	Mất ngủ kinh niên	\N
38	45	8	Rất nặng	\N	\N
39	46	5	Trung bình	\N	\N
41	46	10	Nhẹ	\N	\N
42	46	12	Rất nặng	\N	\N
43	47	8	Trung bình	Khó thở 	\N
44	47	5	Trung bình	Nôn ói 	\N
45	47	5	Nhẹ	Nôn óiiiii	\N
46	48	13	Trung bình	Iar chay , nói thế cho nó vuông	\N
47	49	14	Rất nặng	\N	\N
49	51	12	Nặng	Omg da luôn á da oiiii	\N
50	51	9	Nhẹ	Thuaaaa	\N
51	51	13	Trung bình	Phân tày quày thấy gheeee	\N
52	52	12	Rất nặng	Trooi dat oi	\N
53	54	14	Rất nặng	Thua luôn	\N
54	54	12	Nhẹ	\N	\N
55	55	9	Trung bình	Đau nhức lung tung	\N
56	55	13	Trung bình	tiêu chảy liên miên, uống thuốc ko bớt, mà còn ra nhiều hơn	\N
58	56	5	Rất nặng	Mắc óiiiii	\N
59	58	14	Trung bình	OMGNICE	\N
60	59	13	Nặng	\N	\N
61	60	5	Nặng	\N	\N
62	61	9	Rất nặng	thua luôn 	\N
63	61	10	Nhẹ	Buồn quài đi cho bố, bố mày quá mệt	\N
65	63	14	Rất nặng	OKE	\N
66	64	13	Trung bình	hyyh	\N
68	65	16	Trung bình	pho hong	f
69	65	8	Nhẹ	\N	\N
70	66	21	Rất nặng	Thua 	t
72	66	14	Nhẹ	bó tay	\N
80	74	22	Rất nặng	\N	t
81	75	8	Nặng	\N	t
83	77	22	Rất nặng	Thuaaaa	t
84	78	22	Rất nặng	Thuaaaa	t
85	79	5	Rất nặng	okeee	t
86	80	22	Rất nặng	Đau dữ dội 	t
87	81	14	Nặng	hehe	t
88	82	23	Nhẹ	Đi ẻ khó khăn	t
89	82	21	Rất nặng	\N	f
90	83	10	Rất nặng	omggg niceeee	t
91	91	13	Trung bình	\N	t
92	92	21	Rất nặng	\N	f
93	92	22	Trung bình	\N	t
103	98	10	Trung bình	\N	f
104	99	10	Rất nặng	Quá bệnh mỏi, tui nói thiệt, cho tui một giây phút bình yên đi	t
105	100	8	Rất nặng	thuâ	t
106	101	27	Rất nặng	Không ngủ được giấc từ 3h đến 7h sáng  ....	t
108	102	26	Trung bình	oke!!	t
109	103	24	Nặng	Chiu luon, tui chiu roi 	t
12	22	24	Trung bình	Trầm cảm một chút	\N
82	76	24	Rất nặng	\N	t
13	23	24	Nhẹ	\N	\N
16	24	24	Nhẹ	Tui nghĩ dị á	\N
19	26	24	Nhẹ	Thua luon	\N
36	43	24	Nhẹ	\N	\N
48	50	24	Nhẹ	\N	\N
57	55	24	Nhẹ	Buồn, mất ăn, mất ngủ	\N
64	62	24	Rất nặng	Đó đó thua luôn	\N
67	65	24	Rất nặng	Thua luon	f
94	93	5	Rất nặng	\N	t
95	93	26	Trung bình	\N	f
96	94	22	Trung bình	\N	t
97	94	14	Rất nặng	\N	f
98	95	24	Rất nặng	Bệnh nhân suy nghĩ tùm lumm, mất kiểm soát, có dấu hiệu tồi tệ	t
99	95	22	Nặng	Chán luôn 	f
100	96	10	Rất nặng	ôkeeee	f
101	96	16	Nhẹ	oniceeee	t
102	97	26	Nặng	hiazzzzzzz, thời dài 	t
\.


--
-- TOC entry 5150 (class 0 OID 3322624)
-- Dependencies: 238
-- Data for Name: diseases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.diseases (disease_id, disease_name, description, updated_at, created_at, is_active) FROM stdin;
5	Trào ngược dạ dày	Dịch dạ dày trào lên thực quản, gây ợ nóng, khó chịu. Ke tui	2025-11-13 07:21:55.569171	2025-11-09 00:00:00	t
26	Sốt siêu vi	Có khả năng lây lan qua đường hô hấp, tiếp xúc trực tiếp hoặc gián tiếp với dịch tiết của người nhiễm bệnh. \n	2025-12-12 23:43:00.62324	2025-12-12 23:41:19.377535	t
27	Khó ngủ kinh niên	- Không thể ngủ ... troi oi cứu 	2025-12-26 15:12:36.902709	2025-12-26 15:12:36.902709	t
9	Viêm khớp	Tình trạng viêm ở khớp, gây đau, sưng và hạn chế vận động.	2025-11-13 07:27:19.127714	2025-11-09 00:00:00	t
12	Viêm da	Da đỏ, ngứa, bong tróc, có thể nổi mụn nước	2025-11-24 23:40:53.306206	2025-11-09 00:00:00	t
14	Rối loạn giấc ngủ	Mất ngủ thường xuyên	2025-11-27 22:20:16.350155	2025-11-09 00:00:00	t
13	Tiêu chảy	Phân lỏng hoặc nước\n\nĐi nhiều lần trong ngày\n\nĐau bụng hoặc chuột rút\n\nBuồn nôn, nôn mửa\n\nMệt mỏi, mất nước (khát, khô môi, ít đi tiểu)	2025-12-05 16:07:52.424757	2025-11-09 00:00:00	f
23	Viêm trực tràng	... khó nói	2025-12-10 23:52:40.340369	2025-12-10 23:52:40.340369	t
22	Đau đầu	Nhức đầu dị thôi chứ không có mô tả gì ... 	2025-12-11 13:33:27.53981	2025-12-08 23:15:11.434121	f
8	Hen suyễn	Bệnh mạn tính của đường hô hấp gây khó thở, ho, thở khò khè.	2025-12-11 13:33:29.477972	2025-11-09 00:00:00	f
21	Ho lao	Hắc lào nè !!!!	2025-12-11 13:33:52.631861	2025-12-08 20:39:42.27168	f
24	Trầm cảm	omgggg cứu 	2025-12-12 23:06:10.78116	2025-12-12 23:06:10.78116	t
10	Rối loạn lo âu	Trạng thái lo lắng quá mức, ảnh hưởng tâm lý và thể chất.	2025-12-12 23:35:01.067261	2025-11-09 00:00:00	f
25	Viêm mũi dị ứng	Hắt hơi, chảy nước mũi, nghẹt mũi, ngứa mũi do phản ứng dị ứng với phấn hoa, bụi, lông động vật.	2025-12-12 23:39:30.853543	2025-12-12 23:39:30.853543	t
16	Bệnh khó nói	Khùng mất kiểm soát, tui nói thiệt đó riu luôn	2025-12-12 23:42:13.191997	2025-12-05 15:41:57.540378	t
\.


--
-- TOC entry 5142 (class 0 OID 3322533)
-- Dependencies: 230
-- Data for Name: import_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_receipts (import_receipt_id, supplier_name, receipt_date, user_id, total_amount, note, created_at, updated_at, status) FROM stdin;
48	Nhà cung cấp thuốc Trị Khùng TranVo	2025-11-21 00:00:00	9	560000.00	No note haha test	2025-11-21 12:26:04.287761	\N	confirmed
49	Duyen ThuocStore PhoMaiQue	2025-11-21 00:00:00	9	1136000.00	No note haha test	2025-11-21 12:34:30.860898	\N	confirmed
50	StoreThuoc Fake 	2025-11-21 00:00:00	9	608000.00	No note haha test	2025-11-21 12:36:08.313945	\N	confirmed
51	NCC OMGNICE-TROIOI	2025-11-21 00:00:00	9	225000.00	No note haha test	2025-11-21 12:38:06.877377	\N	confirmed
52	OMGNICE-NICEOMG	2025-11-21 00:00:00	9	948000.00	No note haha test	2025-11-21 12:43:16.686814	2025-11-21 12:44:04.900738	confirmed
54	OMGNICE	2025-11-21 00:00:00	9	862500.00	No note haha test	2025-11-21 12:44:47.242037	2025-11-21 12:58:30.015053	confirmed
56	OMG-QUAHAY	2025-11-21 00:00:00	9	562500.00	No note haha test	2025-11-21 13:03:23.338012	2025-11-21 13:03:50.900444	confirmed
60	NICECUTEFOMAIQUE	2025-11-21 00:00:00	9	350000.00	Lô nhập lậu từ người quen, gần hết hạn rồi, đừng báo công an nhé	2025-11-21 13:15:13.73832	\N	confirmed
68	OMGNICE	2025-11-24 00:00:00	9	228000.00		2025-11-24 03:17:37.201978	2025-11-24 03:20:25.95533	confirmed
76	GIOILAMCONGAICUNG	2025-11-24 00:00:00	9	1280000.00	ei tranvo , co len nha	2025-11-24 13:32:26.186016	2025-11-24 14:09:14.806014	confirmed
106	KHOERETOIOKLAM	2025-12-05 20:01:23	9	825000.00	omgniceeeee, bé iu khỏe honggggg, tui hong	2025-12-05 20:04:57.390514	2025-12-05 20:14:40.770007	confirmed
102	NICE4LIFE	2025-12-05 19:56:23	9	530500.00	Không biết nói gì, chịu rồi !!!!	2025-12-05 19:56:39.601098	2025-12-05 20:18:08.838472	confirmed
107	TESTLO	2025-12-09 14:21:09	9	300000.00	omgniceeeeee	2025-12-09 14:21:46.800902	\N	draft
82	OK	2025-11-24 00:00:00	9	490000.00	omgggggggg	2025-11-24 14:19:25.222495	2025-11-24 14:26:45.05223	confirmed
108	XINCHAOTUILATRANVONE	2025-12-16 23:48:53	9	1900000.00	Tui là tranvo nè, tui làm được mà đừng có lo nhaaaaaa , hehe, tui sẽ vượt qua được. tin tui hong	2025-12-16 23:49:30.119881	2025-12-16 23:52:27.083303	confirmed
80	SAOEMVO TINH ANH QUA	2025-11-24 00:00:00	9	300000.00	Đẳng cấp là đây !!!!!	2025-11-24 14:15:12.214923	2025-11-24 14:27:39.899421	draft
109	HEHENICE	2025-12-16 23:55:03	9	260000.00	Tui test status của thuốc Loperamide khi mua thêm thuốc 	2025-12-16 23:56:09.295902	\N	confirmed
86	Hay Day 	2025-11-24 14:34:16	9	200000.00	omgniceeeeeeeeeeee cute qua chung 	2025-11-24 14:35:00.905286	2025-11-24 14:35:30.556467	confirmed
110	NICEOMG	2025-12-17 00:03:52	9	425000.00	khong biet noi gi	2025-12-17 00:05:01.564788	2025-12-17 00:06:40.666248	confirmed
111	KKK	2025-12-17 00:35:51	9	5500000.00	Thích dị đó ... Mấy đứa chạy dl tới công chuyện, có thuốc cho tụi bây rồi nè	2025-12-17 00:37:12.309739	\N	confirmed
94	HEHENICE	2025-11-25 00:15:22	9	2695000.00	Lô nhập lậu !!!! riu 	2025-11-25 00:18:05.761743	2025-11-25 00:19:38.267453	confirmed
70	OITROIOII	2025-11-24 00:00:00	9	210000.00	hellooooo 	2025-11-24 13:11:15.417162	2025-11-26 00:04:50.234855	confirmed
101	TRAITYMSHOP	2025-12-05 19:48:07	9	950000.00	Lô gì đó, tui không biết, nhập bên campuchiaaaaa cho nó rẻ, chịu thì chịu, ko chịu thì kệ !!!!	2025-12-05 19:49:33.389634	\N	confirmed
\.


--
-- TOC entry 5156 (class 0 OID 3322682)
-- Dependencies: 244
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (invoice_id, invoice_code, medical_record_id, consultation_fee, medicine_fee, total_amount, daily_appointment_id, payment_method, payment_date, created_at, payment_status, created_by_id, updated_at, note, invoice_date) FROM stdin;
24	INV/2025/12/03/C13D0C	50	120000.00	52500.00	172500.00	47	\N	2025-12-03 11:12:34.663983	2025-12-03 11:12:34.663983	paid	16	2025-12-03 16:05:28.60389	\N	2025-12-03 11:12:34.663983
8	INV/2025/11/25/EA6236	35	80000.00	67500.00	147500.00	26	\N	2025-11-25 19:49:18.596948	2025-11-25 19:49:18.596948	paid	9	2025-11-25 22:53:38.531728	\N	2025-11-25 19:49:18.596948
9	INV/2025/11/25/75E4A7	36	80000.00	165000.00	245000.00	27	\N	2025-11-25 23:01:55.178129	2025-11-25 23:01:55.178129	paid	9	2025-11-25 23:48:03.042234	\N	2025-11-25 23:01:55.178129
10	INV/2025/11/26/C3CD5D	37	80000.00	42000.00	122000.00	28	\N	2025-11-26 00:46:53.087041	2025-11-26 00:46:53.087041	paid	9	2025-11-26 00:46:55.256885	\N	2025-11-26 00:46:53.087041
11	INV/2025/11/26/4588AC	38	80000.00	30150.00	110150.00	29	\N	2025-11-26 02:04:04.277768	2025-11-26 02:04:04.277768	paid	9	2025-11-26 02:04:10.542061	\N	2025-11-26 02:04:04.277768
26	INV/2025/12/03/301797	52	120000.00	105000.00	225000.00	49	\N	2025-12-03 18:04:18.449886	2025-12-03 18:04:18.449886	paid	16	2025-12-03 18:07:05.468992	\N	2025-12-03 18:04:18.449886
25	INV/2025/12/03/1344A5	51	120000.00	33750.00	153750.00	48	\N	2025-12-03 16:36:29.09074	2025-12-03 16:36:29.09074	paid	16	2025-12-03 18:07:07.840125	\N	2025-12-03 16:36:29.09074
27	INV/2025/12/03/45EBBB	54	120000.00	166500.00	286500.00	50	\N	2025-12-03 18:15:47.157932	2025-12-03 18:15:47.157932	paid	16	2025-12-03 18:29:05.182264	\N	2025-12-03 18:15:47.157932
12	INV/2025/11/27/8D56B1	39	80000.00	330000.00	410000.00	31	\N	2025-11-27 00:43:45.901715	2025-11-27 00:43:45.901715	paid	9	2025-11-27 00:44:18.033218	\N	2025-11-27 00:43:45.901715
13	INV/2025/11/27/3A78FD	40	150000.00	105000.00	255000.00	32	\N	2025-11-27 01:11:29.260286	2025-11-27 01:11:29.260286	paid	9	2025-11-27 01:12:59.413346	\N	2025-11-27 01:11:29.260286
15	INV/2025/11/27/1FDAD8	43	150000.00	50250.00	200250.00	34	\N	2025-11-27 14:06:45.596677	2025-11-27 14:06:45.596677	paid	9	2025-11-27 14:57:16.649333	\N	2025-11-27 14:06:45.596677
1	\N	26	120000.00	100500.00	220500.00	14	\N	2025-11-22 18:50:36.613865	2025-11-22 18:50:36.613865	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-22 18:50:36.613865
48	INV/2025/12/14/BEE201	64	150000.00	213750.00	363750.00	73	\N	2025-12-14 01:13:56.449018	2025-12-14 01:13:56.449018	pending	9	2025-12-14 01:13:56.449018	Don thuoc ngay kia kia 	2025-12-14 01:13:56.449018
19	INV/2025/12/02/E32384	45	120000.00	0.00	120000.00	36	\N	2025-12-02 16:40:32.463658	2025-12-02 16:40:32.463658	paid	9	2025-12-02 16:40:57.552371	\N	2025-12-02 16:40:32.463658
17	INV/2025/12/02/216475	47	100000.00	87750.00	187750.00	38	\N	2025-12-02 16:26:45.756161	2025-12-02 16:26:45.756161	paid	9	2025-12-02 17:49:52.128779	\N	2025-12-02 16:26:45.756161
20	INV/2025/12/02/5E58BC	24	120000.00	75750.00	195750.00	12	\N	2025-12-02 17:51:47.999338	2025-12-02 17:51:47.999338	paid	9	2025-12-02 17:54:37.356676	\N	2025-12-02 17:51:47.999338
18	INV/2025/12/02/53A70B	46	100000.00	27000.00	127000.00	37	\N	2025-12-02 16:34:37.501799	2025-12-02 16:34:37.501799	paid	9	2025-12-02 17:54:53.754579	\N	2025-12-02 16:34:37.501799
16	INV/2025/11/27/85D8AC	44	150000.00	0.00	150000.00	35	\N	2025-11-27 22:22:08.385336	2025-11-27 22:22:08.385336	paid	9	2025-12-02 17:55:02.182362	\N	2025-11-27 22:22:08.385336
21	INV/2025/12/02/591367	22	120000.00	0.00	120000.00	8	\N	2025-12-02 17:55:20.821336	2025-12-02 17:55:20.821336	paid	9	2025-12-02 17:59:03.445633	\N	2025-12-02 17:55:20.821336
28	INV/2025/12/04/E63FE4	55	120000.00	182250.00	302250.00	51	\N	2025-12-04 00:14:04.234838	2025-12-04 00:14:04.234838	paid	16	2025-12-04 00:14:41.030738	\N	2025-12-04 00:14:04.234838
2	INV-20251122-E5F675	29	120000.00	134250.00	254250.00	15	\N	2025-11-22 19:33:21.530013	2025-11-22 19:33:21.530013	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-22 19:33:21.530013
3	INV/2025/11/23/ED9C72	30	120000.00	50250.00	170250.00	17	\N	2025-11-23 02:07:40.184576	2025-11-23 02:07:40.184576	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-23 02:07:40.184576
4	INV/2025/11/24/7EC1CF	31	120000.00	135000.00	255000.00	21	\N	2025-11-24 23:25:58.293306	2025-11-24 23:25:58.293306	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-24 23:25:58.293306
5	INV/2025/11/25/A44314	32	120000.00	251250.00	371250.00	23	\N	2025-11-25 00:12:52.851402	2025-11-25 00:12:52.851402	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-25 00:12:52.851402
6	INV/2025/11/25/EF6A45	33	80000.00	82500.00	162500.00	24	\N	2025-11-25 00:48:19.48802	2025-11-25 00:48:19.48802	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-25 00:48:19.48802
7	INV/2025/11/25/7B2F26	34	80000.00	201000.00	281000.00	25	\N	2025-11-25 15:38:11.985151	2025-11-25 15:38:11.985151	paid	\N	2025-11-25 22:51:59.964091	\N	2025-11-25 15:38:11.985151
22	INV/2025/12/02/123CC1	48	120000.00	33750.00	153750.00	39	\N	2025-12-02 18:11:25.535007	2025-12-02 18:11:25.535007	paid	9	2025-12-02 18:17:32.02372	\N	2025-12-02 18:11:25.535007
23	INV/2025/12/02/B022D1	49	120000.00	63000.00	183000.00	40	\N	2025-12-02 23:54:06.723246	2025-12-02 23:54:06.723246	paid	16	2025-12-03 00:03:58.804755	\N	2025-12-02 23:54:06.723246
29	INV/2025/12/04/8C926F	56	120000.00	67500.00	187500.00	60	\N	2025-12-04 00:20:01.876557	2025-12-04 00:20:01.876557	paid	16	2025-12-04 00:21:06.742662	\N	2025-12-04 00:20:01.876557
31	INV/2025/12/04/837912	59	120000.00	52500.00	172500.00	63	\N	2025-12-04 00:29:08.699803	2025-12-04 00:29:08.699803	paid	16	2025-12-04 00:29:31.292208	\N	2025-12-04 00:29:08.699803
30	INV/2025/12/04/578887	58	120000.00	27000.00	147000.00	61	\N	2025-12-04 00:23:20.521808	2025-12-04 00:23:20.521808	paid	16	2025-12-04 00:29:32.187386	\N	2025-12-04 00:23:20.521808
32	INV/2025/12/05/4EF267	61	120000.00	52500.00	172500.00	65	\N	2025-12-05 14:23:49.799036	2025-12-05 14:23:49.799036	paid	9	2025-12-05 14:24:08.264048	\N	2025-12-05 14:23:49.799036
33	INV/2025/12/05/F399C8	60	120000.00	52500.00	172500.00	64	\N	2025-12-05 23:22:33.314393	2025-12-05 23:22:33.314393	paid	16	2025-12-05 23:22:37.932193	\N	2025-12-05 23:22:33.314393
34	INV/2025/12/07/72CCF8	62	120000.00	71250.00	191250.00	71	\N	2025-12-07 16:12:34.493594	2025-12-07 16:12:34.493594	paid	9	2025-12-07 16:12:40.470135	\N	2025-12-07 16:12:34.493594
36	INV/2025/12/08/B71929	65	120000.00	202500.00	322500.00	76	\N	2025-12-08 17:23:37.975833	2025-12-08 17:23:37.975833	paid	16	2025-12-08 17:23:49.971725	\N	2025-12-08 17:23:37.975833
35	INV/2025/12/07/E9B4AB	63	120000.00	71250.00	191250.00	72	\N	2025-12-07 17:44:44.328873	2025-12-07 17:44:44.328873	paid	9	2025-12-08 17:23:51.19188	\N	2025-12-07 17:44:44.328873
37	INV/2025/12/08/49AFDF	66	150000.00	90000.00	240000.00	77	\N	2025-12-08 21:14:31.627617	2025-12-08 21:14:31.627617	paid	9	2025-12-08 21:20:39.399426	\N	2025-12-08 21:14:31.627617
38	INV/2025/12/09/0672EB	74	150000.00	67500.00	217500.00	89	\N	2025-12-09 15:20:32.696943	2025-12-09 15:20:32.696943	paid	9	2025-12-09 15:22:05.030743	\N	2025-12-09 15:20:32.696943
40	INV/2025/12/09/15B825	75	150000.00	105000.00	255000.00	90	\N	2025-12-09 15:35:25.614855	2025-12-09 15:35:25.614855	paid	9	2025-12-09 15:35:37.614086	\N	2025-12-09 15:35:25.614855
41	INV/2025/12/09/B0D886	76	150000.00	71250.00	221250.00	91	\N	2025-12-09 15:46:19.072398	2025-12-09 15:46:19.072398	paid	9	2025-12-09 15:46:23.129325	\N	2025-12-09 15:46:19.072398
42	INV/2025/12/09/CBD09B	77	150000.00	712500.00	862500.00	92	\N	2025-12-09 19:30:12.294471	2025-12-09 19:30:12.294471	paid	9	2025-12-09 19:40:19.099132	\N	2025-12-09 19:30:12.294471
14	INV/2025/11/27/28DF38	42	150000.00	0.00	150000.00	33	\N	2025-11-27 11:16:28.681051	2025-11-27 11:16:28.681051	paid	9	2025-11-27 22:11:54.229812	\N	2025-11-27 11:16:28.681051
44	INV/2025/12/10/6D8C82	80	150000.00	75750.00	225750.00	95	\N	2025-12-10 23:55:53.497881	2025-12-10 23:55:53.497881	paid	9	2025-12-10 23:56:40.932555	\N	2025-12-10 23:55:53.497881
43	INV/2025/12/09/6EE5F3	79	150000.00	540000.00	690000.00	93	\N	2025-12-09 19:32:07.290797	2025-12-09 19:32:07.290797	paid	9	2025-12-10 23:56:41.809681	\N	2025-12-09 19:32:07.290797
45	INV/2025/12/10/FB5D6B	81	150000.00	101250.00	251250.00	96	\N	2025-12-10 23:58:07.693338	2025-12-10 23:58:07.693338	paid	9	2025-12-10 23:58:13.566795	\N	2025-12-10 23:58:07.693338
46	INV/2025/12/11/B645EA	82	150000.00	213750.00	363750.00	97	\N	2025-12-11 01:25:11.150451	2025-12-11 01:25:11.150451	paid	16	2025-12-11 01:25:23.384712	\N	2025-12-11 01:25:11.150451
47	INV/2025/12/14/4CC1E2	92	150000.00	0.00	150000.00	102	\N	2025-12-14 01:10:53.668001	2025-12-14 01:10:53.668001	pending	9	2025-12-14 01:10:53.668001	omgniceeeee	2025-12-14 01:10:53.668001
49	INV/2025/12/14/A4873B	91	150000.00	0.00	150000.00	101	\N	2025-12-14 01:15:31.100712	2025-12-14 01:15:31.100712	paid	9	2025-12-14 16:30:05.221944		2025-12-14 01:15:31.100712
58	INV/2025/12/26/EB402A	94	150000.00	301600.00	451600.00	106	\N	2025-12-26 16:01:09.157713	2025-12-26 16:01:09.157713	pending	9	2025-12-26 16:01:09.157713		2025-12-26 00:00:00
51	INV/2025/12/14/2123E3	97	150000.00	148200.00	298200.00	109	\N	2025-12-14 17:41:54.478916	2025-12-14 17:41:54.478916	paid	9	2025-12-14 17:42:00.506626	\N	2025-12-14 17:42:00.506626
54	INV/2025/12/26/385FD3	101	150000.00	104000.00	254000.00	115	\N	2025-12-26 15:28:42.571862	2025-12-26 15:28:42.571862	paid	9	2025-12-26 15:29:35.610932	OKE !!	2025-12-26 00:00:00
53	INV/2025/12/17/E81354	100	150000.00	123500.00	273500.00	114	\N	2025-12-17 00:24:56.552132	2025-12-17 00:24:56.552132	paid	9	2025-12-26 15:32:04.094426	\N	2025-12-17 00:00:00
50	INV/2025/12/14/AFDC9C	95	150000.00	145600.00	295600.00	107	\N	2025-12-14 17:40:25.87818	2025-12-14 17:40:25.87818	paid	9	2025-12-26 15:32:07.799846	Okeeeee	2025-12-14 00:00:00
52	INV/2025/12/17/92B44C	99	150000.00	443950.00	593950.00	113	\N	2025-12-17 00:15:30.42021	2025-12-17 00:15:30.42021	paid	9	2025-12-26 15:32:52.003732	\N	2025-12-17 00:15:30.42021
55	INV/2025/12/26/9C938B	103	150000.00	208000.00	358000.00	117	\N	2025-12-26 15:56:34.009622	2025-12-26 15:56:34.009622	pending	9	2025-12-26 15:56:34.009622	\N	2025-12-26 00:00:00
56	INV/2025/12/26/F295DF	102	150000.00	58500.00	208500.00	116	\N	2025-12-26 15:57:03.287902	2025-12-26 15:57:03.287902	pending	16	2025-12-26 15:57:03.287902		2025-12-26 00:00:00
57	INV/2025/12/26/3F8B98	98	150000.00	0.00	150000.00	111	\N	2025-12-26 15:59:01.612487	2025-12-26 15:59:01.612487	paid	16	2025-12-26 15:59:11.005139		2025-12-26 00:00:00
\.


--
-- TOC entry 5148 (class 0 OID 3322596)
-- Dependencies: 236
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_records (medical_record_id, patient_id, doctor_id, symptoms, created_at, updated_at, revisit_date, status, visit_date) FROM stdin;
23	13	\N	Ho khan, vào cái khớp nó mới ho ...	2025-11-21 21:34:07.751618	\N	\N	completed	\N
25	6	\N	Troi oiii	2025-11-22 00:02:50.175163	\N	2025-11-30	completed	\N
26	13	9	Qua hay, chua khùng la duoc	2025-11-22 00:05:28.095195	\N	2025-11-24	completed	\N
29	9	9	Buồn thường xuyên, tính cách thất thường, trào ngược dạ dày	2025-11-22 19:31:28.591338	\N	2025-11-23	completed	\N
30	3	9	Đi lại khó khăn, ngủ dậy đau nhức 	2025-11-23 00:39:57.972317	\N	2025-11-30	completed	\N
31	15	9	Đi lại khó khăn khi ngồi quá lâu, .... 	2025-11-24 18:11:20.64327	\N	2025-11-30	completed	\N
32	13	9	Tày quày rồi, không còn gì nói	2025-11-25 00:12:49.885874	\N	2025-11-25	completed	\N
33	15	9	Phân lỏng, tè le à thấy ghê lắm	2025-11-25 00:41:18.010927	\N	2025-11-25	completed	\N
34	6	9	Viêm nặng, nhiều ổ viêm, thấy ghê lắm, cố lên nha, i love you 	2025-11-25 15:38:04.623791	\N	2025-11-25	completed	\N
35	10	9	Khong biet noi gi 	2025-11-25 19:47:50.170048	\N	2025-11-25	completed	\N
37	7	9	omgniceeeee	2025-11-25 23:54:25.143962	\N	2025-11-25	completed	\N
36	1	9	Nhiều ổ viêm dưới lớp daaaa á 	2025-11-25 23:01:36.134911	\N	2025-11-25	completed	\N
38	17	9	hehehe	2025-11-26 02:03:46.071505	\N	2025-11-26	completed	\N
39	1	9	Hay mắc ói buổi sáng	2025-11-27 00:42:47.109013	\N	2025-11-27	completed	\N
40	15	9	Có thể bị khùng luôn á, quá mệt	2025-11-27 01:04:18.8824	\N	2025-11-27	completed	\N
42	3	9	Tieeu chảy liên tục 	2025-11-27 11:09:42.035006	\N	2025-11-27	completed	\N
43	7	9	Khó nói lắm	2025-11-27 14:00:13.919526	\N	2025-12-27	completed	\N
44	8	9	Thường xuyên rất khó ngủ vào ban đêm 	2025-11-27 22:21:30.904986	\N	2025-11-27	completed	\N
45	10	9	Khó Thở á bà .....	2025-11-27 22:23:53.020505	\N	2025-11-27	completed	\N
46	11	9	omg thua luon do , tui noi thiet	2025-11-27 23:09:46.04534	2025-12-02 15:46:55.995885	2025-12-04	completed	\N
47	14	9	Khó thở, ho khò khẹt, ợ chua	2025-12-02 16:09:31.062642	2025-12-02 16:11:51.666499	2025-12-09	completed	\N
24	13	\N	Ko biết nói gì 	2025-11-21 23:51:16.67932	2025-12-02 17:26:58.881763	\N	completed	\N
22	14	\N	Mất ngủ, chán ăn, suy nghĩ lung tung, 	2025-11-21 11:42:05.468694	\N	\N	completed	\N
48	13	9	Phân lỏng lẹt 	2025-12-02 18:06:18.918402	\N	2025-12-02	completed	\N
49	1	15	Mất ngủ kinh niên, rất khó chiềm vào giấc 	2025-12-02 23:04:38.4207	\N	2025-12-10	completed	\N
50	1	15	omgggg	2025-12-03 11:11:42.224535	\N	2025-12-03	completed	\N
51	2	15	- Da viêm \n- Nóng trong người \n- Đau nhức .... 	2025-12-03 16:33:05.842816	\N	2025-12-03	completed	\N
52	3	15	Toanggggg	2025-12-03 16:39:18.23503	\N	2025-12-25	completed	\N
54	7	9	Hêhhee cựucj cức của tui oii 	2025-12-03 18:08:45.393869	\N	2025-12-03	completed	\N
55	8	15	Không rõ nguyên nhân, bị mệt nhiều	2025-12-03 23:43:12.863031	\N	2025-12-10	completed	\N
56	11	15	Ói quài đi .... 	2025-12-04 00:18:20.148405	\N	2025-12-11	completed	\N
58	13	15	Thua luon	2025-12-04 00:23:05.690832	\N	2025-12-25	completed	\N
59	17	15	heehehehe	2025-12-04 00:28:50.656755	\N	2025-12-04	completed	\N
78	1	9	OMGNICEEEEE	2025-12-09 19:30:04.33091	\N	2025-12-09	examined	\N
77	1	9	OMGNICEEEEE	2025-12-09 19:30:03.215509	\N	2025-12-09	completed	\N
79	14	9	hehehee	2025-12-09 19:32:04.22824	\N	2025-12-09	completed	\N
80	10	9	Đau đầu, hoa mắt chống mặt, khó ngủ ....	2025-12-10 23:55:28.333675	\N	2025-12-10	completed	\N
81	9	15	omggggg	2025-12-10 23:57:54.385155	\N	2025-12-10	completed	\N
61	4	9	Không biết, chịu rồi !!!! @@	2025-12-05 13:28:47.768563	2025-12-05 14:22:34.109084	2025-12-19	completed	\N
60	2	9	hihi	2025-12-04 00:42:12.40624	2025-12-05 12:23:06.152768	2025-12-04	completed	\N
62	1	9	Xin chào 	2025-12-07 16:12:30.417332	\N	2025-12-21	completed	\N
63	22	9	Khó ngủ ... 	2025-12-07 16:23:36.658048	\N	2025-12-07	completed	\N
82	9	15	omgniceeeee 	2025-12-11 01:23:56.552888	\N	2025-12-11	completed	\N
65	1	15	Het thuoc chua, tức là hết cứu nhé, tui là bác sĩ mà thích nói dị á, ko có chuyện lươg y như từ mẫu ở đây nheeeeee	2025-12-08 01:09:28.360349	2025-12-08 17:22:17.39345	2025-12-10	completed	\N
83	1	9	Troi đất ôiii là troi 	2025-12-12 09:33:23.787902	\N	2025-12-12	examined	\N
66	6	15	Ho nhieu lam, tui nói thiệt	2025-12-08 20:41:44.473006	2025-12-08 21:06:37.974837	2025-12-08	completed	\N
74	9	9	omgniceeeeee	2025-12-09 15:20:29.24666	\N	2025-12-09	completed	\N
75	10	9	Khó thở 	2025-12-09 15:27:06.287753	\N	2025-12-09	completed	\N
76	6	9	gfhfdgbfgbfb	2025-12-09 15:46:14.453897	\N	2025-12-31	completed	\N
100	29	9	omggggg	2025-12-17 00:24:47.911763	\N	2025-12-17	completed	\N
93	8	15	Ói miết luôn, nóng trong người ...	2025-12-13 23:36:30.817971	2025-12-13 23:38:33.966682	2025-12-13	examined	\N
92	15	9	Đau đầu, hoa mắt chóng mặt	2025-12-12 13:22:03.075869	\N	2025-12-18	completed	\N
64	14	9	omgniceeeee	2025-12-07 18:31:22.721808	\N	2025-12-07	completed	\N
91	13	9	OMG,  đi ngoài lỏng ...	2025-12-12 12:20:44.129584	2025-12-12 13:25:46.590539	2025-12-12	completed	\N
96	7	9	khong biet nói gì 	2025-12-14 17:39:54.107557	\N	2025-12-14	examined	\N
95	2	9	Đau đầu, Suy nghĩ nhiều thứ, mơ hồ	2025-12-14 17:34:57.096147	\N	2025-12-28	completed	\N
97	6	9	hehehehehehheh, cứu tôiiiiii, cố lên tranvo làm được mà	2025-12-14 17:41:45.625254	\N	2025-12-14	completed	\N
99	13	9	tui chịu rồi, tui quá mệt, tui cần một liều thuốc trị khùng	2025-12-17 00:15:08.80758	\N	2025-12-17	completed	\N
101	13	9	Ừm ....	2025-12-26 15:19:20.109612	2025-12-26 15:20:16.177321	2025-12-31	completed	\N
103	3	9	omgnice nha, suy nghi tum lum 	2025-12-26 15:56:00.360037	\N	2026-01-30	completed	\N
102	1	9	Khoong gi lam dau, colennha	2025-12-26 15:49:21.669943	\N	2025-12-26	completed	\N
98	2	9	dffdfikfddf	2025-12-15 23:29:10.968817	\N	2025-12-15	completed	\N
94	4	15	Khó chìm vào giấc ngủ ...	2025-12-13 23:42:40.079686	\N	2025-12-13	completed	\N
\.


--
-- TOC entry 5158 (class 0 OID 3322711)
-- Dependencies: 246
-- Data for Name: medicine_usage_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicine_usage_reports (medicine_usage_report_id, month_year, created_at) FROM stdin;
4	2025-11	2025-12-11 18:47:46.736563
\.


--
-- TOC entry 5160 (class 0 OID 3322719)
-- Dependencies: 248
-- Data for Name: medicine_usage_reports_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicine_usage_reports_details (id, medicine_usage_report_id, medicine_id, usage_count, quantity_used, total_value) FROM stdin;
31	4	32	4	19	136500.00
32	4	33	2	14	147000.00
33	4	34	7	78	783900.00
34	4	35	1	20	135000.00
35	4	36	1	10	67500.00
36	4	37	3	35	577500.00
\.


--
-- TOC entry 5140 (class 0 OID 3322517)
-- Dependencies: 228
-- Data for Name: medicines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicines (medicine_id, medicine_name, unit_id, stock_quantity, created_at, updated_at, is_active, min_stock_level, status, note) FROM stdin;
34	Loratadine	3	220	2025-11-21 12:30:14.70819	2025-11-24 14:26:45.11631	t	10	active	\N
33	Cefalexin	5	130	2025-11-21 12:27:06.367642	2025-11-25 00:32:51.600389	t	50	active	\N
35	Azithromycin	5	325	2025-11-21 12:31:48.713579	2025-12-05 20:18:09.002675	t	0	active	\N
37	Loperamide	2	200	2025-11-25 00:34:35.42748	2025-12-16 23:56:09.334001	t	200	low_stock	trị ỉa chảy
38	Almagate	1	190	2025-11-25 00:35:54.426608	2025-12-07 19:39:02.305836	t	10	active	Trào ngược 
45	Dophylin	26	100	2025-12-17 00:30:24.376813	2025-12-17 00:37:12.384034	t	10	active	Thuốc giúp tỉnh táo để chạy deadlineeeee
36	Efferalgan	5	250	2025-11-24 23:36:32.99413	2025-12-05 20:18:08.915449	t	50	active	Hạ sốt
32	Panadol	5	345	2025-11-21 12:20:57.928955	2025-12-09 15:15:55.373336	t	50	active	Đau đầu
\.


--
-- TOC entry 5162 (class 0 OID 3322738)
-- Dependencies: 250
-- Data for Name: monthly_revenue_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_revenue_reports (monthly_report_id, month_year, total_revenue, created_at, updated_at, total_patient_count) FROM stdin;
11744	2025-12	4930200.00	2025-12-15 19:22:39.72224	2025-12-15 19:22:39.72224	0
16	2025-11	3354650.00	2025-11-24 21:17:00.136402	2025-12-09 11:31:00.096391	10
\.


--
-- TOC entry 5167 (class 0 OID 3322775)
-- Dependencies: 255
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (user_id, token, token_expiry) FROM stdin;
14	4dd9c85e5536ab7fa5e7552913b5a40ebabe131b86f902cfa575078bc1da7a3a	2025-12-06 22:05:20.128+07
9	9b4515122cadf78f54a638fdb5857fe1b0d6b3723f2bc2b7703fd4bb3ef85e5e	2025-12-26 21:44:59.344+07
9	f4bdb6d86e1660f243e03edab94d3d9bb900536be00275630c6333f5b896abe2	2025-12-26 21:47:46.868+07
9	1c34965cb6ebc95d61f3a68fea63d103e3ae650ed51e91dd820e9cbb5b979099	2025-12-26 21:49:06.133+07
\.


--
-- TOC entry 5134 (class 0 OID 3322489)
-- Dependencies: 222
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (patient_id, full_name, gender, date_of_birth, address, phone, email, created_at, isarchived, is_active) FROM stdin;
6	Võ Thị Hương	Nữ	1988-05-01	45 Pasteur, Quận 1, TP.HCM	0905123006	huongcute@gmail.com	2025-11-09 14:48:33.199291	f	t
8	Cao Mỹ Duyên	Nữ	2000-07-12	22 Nguyễn Huệ, TP.HCM	0905123008	\N	2025-11-09 14:48:33.199291	f	t
10	Bùi Thị Kim Ngân	Nữ	1982-02-12	7 Trần Hưng Đạo, Quận 5, TP.HCM	0905123010	\N	2025-11-09 14:48:33.199291	f	t
9	Phan Quốc Anh	Nam	1995-03-27	120 Lý Thường Kiệt, Quận Tân Bình, TP.HCM	0905123009	\N	2025-11-09 14:48:33.199291	f	t
11	Huỳnh Văn Phúc	Nam	1990-01-02	31 Nguyễn Văn Cừ, Quận 5, TP.HCM	0905123011	\N	2025-11-09 14:48:33.199291	t	t
5	Đỗ Văn Cường	Nam	2001-12-20	14 Huỳnh Tấn Phát, Quận 7, TP.HCM	0905123005	\N	2025-11-09 14:48:33.199291	t	t
25	Trần Anh Quốc	Nam	2004-06-12	Suối Hiệp, Diên Khánh, Khánh Hòa	0378725123	quocanh@gmail.com	2025-12-09 20:54:14.014765	t	t
1	Nguyễn Văn Hùng	Nam	1985-01-27	23 Nguyễn Văn Linh, Quận 7, TP.HCM	0905123001	\N	2025-11-09 14:48:33.199291	f	t
2	Trần Thị Mai	Nữ	1992-05-27	56 Lê Văn Sỹ, Quận 3, TP.HCM	0905123002	\N	2025-11-09 14:48:33.199291	t	t
4	Phạm Ngọc Yến	Nữ	1999-09-01	12 Võ Văn Kiệt, Quận 1, TP.HCM	0905123004	\N	2025-11-09 14:48:33.199291	t	t
22	Thái Văn An	Nam	2000-05-18	Nha Trang, Khánh Hòa	0331236547	\N	2025-12-07 16:14:00.120077	f	t
17	Nguyễn Minh Pháp	Nam	2003-11-11	Diên Khánh, Khánh Hòa	0358125218	phap.minh@gmail.com	2025-11-24 14:50:56.070748	f	t
7	Nguyễn Thành Tâm	Nam	1975-06-03	99 Cách Mạng Tháng 8, Quận 10, TP.HCM	0905123007	\N	2025-11-09 14:48:33.199291	f	t
23	Nguyễn Minh Quân	Nam	2003-02-12	Quận 2, TP. Hồ Chí Minh	0338756234	quan.minhnguyen@gmail.com	2025-12-08 23:43:15.445667	f	t
24	Nguyễn Anh Thu	Nữ	1999-05-12	Thủ Đức 	0338498333	thunguyen@gmail.com	2025-12-08 23:54:46.448716	f	t
15	Nguyễn Minh Ánh	Nữ	2000-02-23	Gò Vấp, Quận Bình Thạnh	0338721124	anhminh.nguyen@gmail.com	2025-11-24 14:42:52.677136	f	t
26	Nguyễn Hoàng Như Ngọc	Nữ	2004-03-19	Khánh Hòa	0338123456	ngocnhu@gmail.com	2025-12-11 22:02:48.695954	f	t
12	Tô Ngọc Hà	Nữ	2002-02-02	16 Lê Lợi, TP.HCM	0905123012	\N	2025-11-09 14:48:33.199291	f	t
14	Cao Lê Thành Công 	Nam	2005-06-23	Quận 5, Khu Phố hai lần, TP. Hồ Chí Minh	0378125466	congthanh.cao@gmail.com	2025-11-19 13:41:48.713634	t	t
27	Nguyễn Thu Thủy	Nữ	2001-05-17	Quận Bình Thạnh	0348127890	thuythu@gmail.com	2025-12-13 23:17:15.265627	f	\N
28	Nguyễn Hoàng Phong	Nam	1995-04-30	Quận 1, Thành Phố Hồ Chí Minh	0337125219	phongnguyenn@gmail.com	2025-12-14 17:14:19.076995	f	\N
29	Nguyen Thanh An	Nam	2001-03-10	Thủ Đức	0337458192	anhthanh@gmail.com	2025-12-17 00:21:06.384981	f	\N
3	Lê Thanh Bình	Nam	1978-01-01	88 Nguyễn Trãi, Quận 5, TP.HCM	0905123003	\N	2025-11-09 14:48:33.199291	t	t
13	Võ Ngọc Bảo Trân	Nữ	2004-05-27	Khu số 6, phường Linh Trung, Thành phố Thủ Đức	0338498306	22521508@gm.uit.edu.vn	2025-11-19 11:55:35.368768	f	t
\.


--
-- TOC entry 5154 (class 0 OID 3322652)
-- Dependencies: 242
-- Data for Name: prescription_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription_detail (prescription_detail_id, medical_record_id, batch_id, medicine_id, quantity, sell_price, usage_method_id, created_at, total) FROM stdin;
46	23	70	32	50	8400.00	2	2025-11-21 21:34:07.751618	\N
47	24	70	32	5	7575.00	2	2025-11-21 23:51:16.67932	\N
48	24	77	32	5	7575.00	2	2025-11-21 23:51:16.67932	\N
49	25	69	34	2	10050.00	7	2025-11-22 00:02:50.175163	\N
50	26	69	34	10	10050.00	5	2025-11-22 00:05:28.095195	\N
51	29	69	34	10	10050.00	13	2025-11-22 19:31:28.591338	100500.00
52	29	77	32	5	6750.00	2	2025-11-22 19:31:28.591338	33750.00
53	30	69	34	5	10050.00	2	2025-11-23 00:39:57.972317	50250.00
54	31	72	35	20	6750.00	7	2025-11-24 18:11:20.64327	135000.00
55	32	69	34	25	10050.00	12	2025-11-25 00:12:49.885874	251250.00
56	33	142	37	5	16500.00	2	2025-11-25 00:41:18.010927	82500.00
57	34	69	34	20	10050.00	4	2025-11-25 15:38:04.623791	201000.00
58	35	136	36	10	6750.00	7	2025-11-25 19:47:50.170048	67500.00
59	36	142	37	10	16500.00	2	2025-11-25 23:01:36.134911	165000.00
60	37	91	33	4	10500.00	5	2025-11-25 23:54:25.143962	42000.00
61	38	69	34	3	10050.00	2	2025-11-26 02:03:46.071505	30150.00
62	39	142	37	20	16500.00	2	2025-11-27 00:42:47.109013	330000.00
63	40	91	33	10	10500.00	9	2025-11-27 01:04:18.8824	105000.00
64	43	69	34	5	10050.00	1	2025-11-27 14:00:13.919526	50250.00
99	46	77	32	4	6750.00	12	2025-12-02 15:46:01.870554	27000.00
100	47	72	35	5	6750.00	2	2025-12-02 16:09:31.062642	33750.00
101	47	77	32	8	6750.00	5	2025-12-02 16:11:51.666499	54000.00
102	48	77	32	5	6750.00	2	2025-12-02 18:06:18.918402	33750.00
103	49	91	33	6	10500.00	2	2025-12-02 23:04:38.4207	63000.00
104	50	81	34	5	10500.00	2	2025-12-03 11:11:42.224535	52500.00
105	51	77	32	5	6750.00	2	2025-12-03 16:33:05.842816	33750.00
106	52	81	34	10	10500.00	4	2025-12-03 16:39:18.23503	105000.00
108	54	142	37	6	16500.00	2	2025-12-03 18:08:45.393869	99000.00
109	54	72	35	10	6750.00	2	2025-12-03 18:08:45.393869	67500.00
110	55	77	32	5	6750.00	2	2025-12-03 23:43:12.863031	33750.00
111	55	142	37	9	16500.00	2	2025-12-03 23:43:12.863031	148500.00
112	56	136	36	10	6750.00	2	2025-12-04 00:18:20.148405	67500.00
113	58	136	36	4	6750.00	2	2025-12-04 00:23:05.690832	27000.00
114	59	81	34	5	10500.00	2	2025-12-04 00:28:50.656755	52500.00
120	60	141	38	5	10500.00	2	2025-12-05 12:23:06.152768	52500.00
123	61	141	38	5	10500.00	2	2025-12-05 14:22:34.109084	52500.00
124	62	144	37	5	14250.00	15	2025-12-07 16:12:30.417332	71250.00
125	63	144	37	5	14250.00	16	2025-12-07 16:23:36.658048	71250.00
126	64	93	32	10	11250.00	15	2025-12-07 18:31:22.721808	112500.00
127	64	72	35	15	6750.00	17	2025-12-07 18:31:22.721808	101250.00
128	65	93	32	10	11250.00	18	2025-12-08 01:09:28.360349	112500.00
129	65	68	35	5	18000.00	15	2025-12-08 01:09:28.360349	90000.00
130	66	68	35	5	18000.00	15	2025-12-08 20:41:44.473006	90000.00
138	74	77	32	10	6750.00	17	2025-12-09 15:20:29.24666	67500.00
139	75	91	33	10	10500.00	9	2025-12-09 15:27:06.287753	105000.00
140	76	144	37	5	14250.00	17	2025-12-09 15:46:14.453897	71250.00
141	77	137	33	50	14250.00	16	2025-12-09 19:30:03.215509	712500.00
142	78	137	33	50	14250.00	16	2025-12-09 19:30:04.33091	712500.00
143	79	68	35	30	18000.00	15	2025-12-09 19:32:04.22824	540000.00
144	80	77	32	5	7575.00	17	2025-12-10 23:55:28.333675	37875.00
145	80	67	32	5	7575.00	17	2025-12-10 23:55:28.333675	37875.00
146	81	136	36	15	6750.00	18	2025-12-10 23:57:54.385155	101250.00
147	82	144	37	15	14250.00	16	2025-12-11 01:23:56.552888	213750.00
148	83	67	32	10	8400.00	16	2025-12-12 09:33:23.787902	84000.00
150	93	136	36	15	4500.00	16	2025-12-13 23:36:30.817971	67500.00
151	94	68	35	10	15600.00	15	2025-12-13 23:42:40.079686	156000.00
152	94	67	32	20	7280.00	18	2025-12-13 23:42:40.079686	145600.00
153	95	67	32	20	7280.00	18	2025-12-14 17:34:57.096147	145600.00
154	96	136	36	10	5850.00	16	2025-12-14 17:39:54.107557	58500.00
155	97	89	35	15	9880.00	18	2025-12-14 17:41:45.625254	148200.00
156	99	67	32	45	7579.00	16	2025-12-17 00:15:08.80758	341055.00
157	99	73	32	5	7579.00	16	2025-12-17 00:15:08.80758	37895.00
158	99	163	38	10	6500.00	16	2025-12-17 00:15:08.80758	65000.00
159	100	144	37	10	12350.00	18	2025-12-17 00:24:47.911763	123500.00
160	101	121	32	10	10400.00	16	2025-12-26 15:19:20.109612	104000.00
161	102	136	36	10	5850.00	9	2025-12-26 15:49:21.669943	58500.00
162	103	121	32	20	10400.00	17	2025-12-26 15:56:00.360037	208000.00
\.


--
-- TOC entry 5130 (class 0 OID 3322459)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name, description, created_at, updated_at) FROM stdin;
1	Admin	Quản trị viên hệ thống — có toàn quyền quản lý người dùng, dữ liệu và cấu hình.	2025-11-09 14:37:34.597156	\N
2	Doctor	Bác sĩ — có quyền xem, lập và cập nhật hồ sơ khám bệnh, kê đơn thuốc cho bệnh nhân.	2025-11-09 14:37:34.597156	\N
3	Nurse	Y tá — có quyền xem và hỗ trợ cập nhật thông tin bệnh nhân, hỗ trợ bác sĩ.	2025-11-09 14:37:34.597156	\N
4	Pharmacist	Dược sĩ — có quyền nhập, xuất, theo dõi tồn kho thuốc và lập phiếu nhập thuốc.	2025-11-09 14:37:34.597156	\N
5	Receptionist	Lễ tân — có quyền tạo lịch khám, tiếp nhận bệnh nhân, lập hóa đơn thanh toán.	2025-11-09 14:37:34.597156	\N
6	Accountant	Kế toán — có quyền xem và xuất báo cáo doanh thu, chi phí, lập báo cáo tháng.	2025-11-09 14:37:34.597156	\N
7	Manager	Quản lý — có quyền xem toàn bộ báo cáo, thống kê, và phân tích hiệu suất hoạt động.	2025-11-09 14:37:34.597156	\N
\.


--
-- TOC entry 5166 (class 0 OID 3322763)
-- Dependencies: 254
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, setting_key, setting_value, description, updated_at) FROM stdin;
2	MaxPatientsPerDay	10	Số lượng bệnh nhân tối đa trong một ngày	2025-12-13 23:41:05.548463
3	ConsultationFee	150000	Tiền khám cho bệnh nhân	2025-12-13 23:41:05.548463
1	SellingPriceRatio	1.3	Tỷ lệ đơn giá bán thuốc so với đơn giá nhập	2025-12-13 23:41:05.548463
\.


--
-- TOC entry 5136 (class 0 OID 3322499)
-- Dependencies: 224
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (unit_id, unit_name, is_active, created_at, updated_at) FROM stdin;
1	Viên	t	2025-11-09 14:56:05.778838	\N
10	Lít	t	2025-11-09 14:56:05.778838	\N
5	Hộp	t	2025-11-09 14:56:05.778838	\N
3	Lọ	f	2025-11-09 14:56:05.778838	\N
2	Gói	f	2025-11-09 14:56:05.778838	\N
26	Vỉ	t	2025-12-17 00:30:02.642651	\N
\.


--
-- TOC entry 5138 (class 0 OID 3322508)
-- Dependencies: 226
-- Data for Name: usage_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usage_methods (usage_method_id, usage_method_name, is_active, created_at, updated_at) FROM stdin;
1	Uống trực tiếp	t	2025-11-09 14:56:05.778838	\N
18	4	t	2025-12-05 16:28:47.019358	\N
4	Bôi trực tiếp lên da	t	2025-11-09 14:56:05.778838	\N
9	Hít qua mũi	t	2025-11-09 14:56:05.778838	\N
5	Nhỏ mắt	t	2025-11-09 14:56:05.778838	\N
7	Tiêm bắp	t	2025-11-09 14:56:05.778838	\N
2	Uống sau ăn	t	2025-11-09 14:56:05.778838	\N
16	2	t	2025-12-05 16:28:38.969263	\N
15	1	t	2025-12-05 16:28:34.37623	\N
12	Uống trong khi ngủ	t	2025-11-18 18:22:24.534348	\N
17	3	f	2025-12-05 16:28:42.746012	\N
13	Ngủ rồi uống	f	2025-11-18 18:23:12.954214	\N
\.


--
-- TOC entry 5132 (class 0 OID 3322471)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, password, full_name, role_id, phone, email, created_at, updated_at, is_active) FROM stdin;
9	tranvocute	$2a$10$.Wbrxu53dKJRgqcLvi3Piuz86GxR8UjZn2Cx0pnJuwgF.Rb.4hQpq	Võ Ngọc Bảo Trân	1	0338498306	tranvoisloading@gmail.com	2025-11-09 21:53:28.637483	2025-12-16 23:24:02.720536	t
15	minh.doctor	$2a$10$qXGKKBD19/sF.Ee9tjuVAufEvciNe.zMhcMUbVvbg0x64GtNEGFia	Nguyễn Hữu Minh	2	0337986123	minhhuunguyen@gmail.com	2025-12-02 22:15:50.54357	\N	t
16	letan123	$2a$10$twHwyoF8/AfsCo57fCT1UO7ZV460rAo0dJRW/g/A.sAtz0npJSqZW	Lễ Tân	5	0338497980	letan123@gmail.com	2025-12-02 23:27:19.357866	\N	t
17	tranvonee	$2a$10$HkPgEoCgTJyG6U09TS.oX.t76WHEPfX/Yxr.u5FuILxs7H.PWXcdi	Tran Vo 	2	0358125218	votran315@gmail.com	2025-12-06 00:34:10.041404	2025-12-06 00:41:55.068932	t
8	netranvo	$2a$10$W6K/QHzwYc3D1NOppQUks.KELy6ZKhlTvS6aaVjPCFvUJ4scN.0oK	TranVo nè	1	0338498306	tranvo@gmail.com	2025-11-09 21:49:18.090731	2025-12-13 17:24:03.565894	t
\.


--
-- TOC entry 5194 (class 0 OID 0)
-- Dependencies: 231
-- Name: batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.batches_batch_id_seq', 166, true);


--
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 233
-- Name: daily_appointments_daily_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_appointments_daily_appointment_id_seq', 124, true);


--
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 251
-- Name: daily_revenue_reports_daily_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_revenue_reports_daily_report_id_seq', 58046, true);


--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 239
-- Name: disease_details_disease_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disease_details_disease_detail_id_seq', 109, true);


--
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 237
-- Name: diseases_disease_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.diseases_disease_id_seq', 27, true);


--
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 229
-- Name: import_receipts_import_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_receipts_import_receipt_id_seq', 111, true);


--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 243
-- Name: invoices_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_invoice_id_seq', 58, true);


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 235
-- Name: medical_records_medical_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medical_records_medical_record_id_seq', 103, true);


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 247
-- Name: medicine_usage_reports_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicine_usage_reports_details_id_seq', 36, true);


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 245
-- Name: medicine_usage_reports_medicine_usage_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicine_usage_reports_medicine_usage_report_id_seq', 4, true);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 227
-- Name: medicines_medicine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicines_medicine_id_seq', 45, true);


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 249
-- Name: monthly_revenue_reports_monthly_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.monthly_revenue_reports_monthly_report_id_seq', 11744, true);


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 221
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 29, true);


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 241
-- Name: prescription_detail_prescription_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescription_detail_prescription_detail_id_seq', 162, true);


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 7, true);


--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 253
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 3, true);


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 223
-- Name: units_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_unit_id_seq', 26, true);


--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 225
-- Name: usage_methods_usage_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usage_methods_usage_method_id_seq', 19, true);


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 17, true);


--
-- TOC entry 4923 (class 2606 OID 3322564)
-- Name: batches batches_batch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_batch_code_key UNIQUE (batch_code);


--
-- TOC entry 4925 (class 2606 OID 3322562)
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (batch_id);


--
-- TOC entry 4927 (class 2606 OID 3322583)
-- Name: daily_appointments daily_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_appointments
    ADD CONSTRAINT daily_appointments_pkey PRIMARY KEY (daily_appointment_id);


--
-- TOC entry 4953 (class 2606 OID 3322755)
-- Name: daily_revenue_reports daily_revenue_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_revenue_reports
    ADD CONSTRAINT daily_revenue_reports_pkey PRIMARY KEY (daily_report_id);


--
-- TOC entry 4937 (class 2606 OID 3322640)
-- Name: disease_details disease_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disease_details
    ADD CONSTRAINT disease_details_pkey PRIMARY KEY (disease_detail_id);


--
-- TOC entry 4933 (class 2606 OID 3322631)
-- Name: diseases diseases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT diseases_pkey PRIMARY KEY (disease_id);


--
-- TOC entry 4921 (class 2606 OID 3322543)
-- Name: import_receipts import_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts
    ADD CONSTRAINT import_receipts_pkey PRIMARY KEY (import_receipt_id);


--
-- TOC entry 4941 (class 2606 OID 3322694)
-- Name: invoices invoices_invoice_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_code_key UNIQUE (invoice_code);


--
-- TOC entry 4943 (class 2606 OID 3322692)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- TOC entry 4931 (class 2606 OID 3322606)
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (medical_record_id);


--
-- TOC entry 4947 (class 2606 OID 3322726)
-- Name: medicine_usage_reports_details medicine_usage_reports_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports_details
    ADD CONSTRAINT medicine_usage_reports_details_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 3322717)
-- Name: medicine_usage_reports medicine_usage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports
    ADD CONSTRAINT medicine_usage_reports_pkey PRIMARY KEY (medicine_usage_report_id);


--
-- TOC entry 4919 (class 2606 OID 3322526)
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (medicine_id);


--
-- TOC entry 4949 (class 2606 OID 3322745)
-- Name: monthly_revenue_reports monthly_revenue_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_revenue_reports
    ADD CONSTRAINT monthly_revenue_reports_pkey PRIMARY KEY (monthly_report_id);


--
-- TOC entry 4962 (class 2606 OID 3322779)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (user_id, token);


--
-- TOC entry 4964 (class 2606 OID 3322781)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 4913 (class 2606 OID 3322497)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- TOC entry 4939 (class 2606 OID 3322660)
-- Name: prescription_detail prescription_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail
    ADD CONSTRAINT prescription_detail_pkey PRIMARY KEY (prescription_detail_id);


--
-- TOC entry 4905 (class 2606 OID 3322467)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4907 (class 2606 OID 3322469)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4958 (class 2606 OID 3322771)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 3322773)
-- Name: settings settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 4935 (class 2606 OID 3322788)
-- Name: diseases unique_disease_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diseases
    ADD CONSTRAINT unique_disease_name UNIQUE (disease_name);


--
-- TOC entry 4915 (class 2606 OID 3322506)
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (unit_id);


--
-- TOC entry 4951 (class 2606 OID 3331137)
-- Name: monthly_revenue_reports uq_month_year; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_revenue_reports
    ADD CONSTRAINT uq_month_year UNIQUE (month_year);


--
-- TOC entry 4955 (class 2606 OID 3331139)
-- Name: daily_revenue_reports uq_report_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_revenue_reports
    ADD CONSTRAINT uq_report_date UNIQUE (report_date);


--
-- TOC entry 4917 (class 2606 OID 3322515)
-- Name: usage_methods usage_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_methods
    ADD CONSTRAINT usage_methods_pkey PRIMARY KEY (usage_method_id);


--
-- TOC entry 4909 (class 2606 OID 3322480)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4911 (class 2606 OID 3322482)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4928 (class 1259 OID 3322594)
-- Name: idx_daily_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_appointments_date ON public.daily_appointments USING btree (appointment_date);


--
-- TOC entry 4929 (class 1259 OID 3322622)
-- Name: idx_medical_records_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medical_records_patient ON public.medical_records USING btree (patient_id);


--
-- TOC entry 4956 (class 1259 OID 3322761)
-- Name: ux_daily_report_date_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_daily_report_date_month ON public.daily_revenue_reports USING btree (monthly_report_id, report_date);


--
-- TOC entry 4968 (class 2606 OID 3322570)
-- Name: batches batches_import_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_import_receipt_id_fkey FOREIGN KEY (import_receipt_id) REFERENCES public.import_receipts(import_receipt_id) ON DELETE SET NULL;


--
-- TOC entry 4969 (class 2606 OID 3322565)
-- Name: batches batches_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 3322584)
-- Name: daily_appointments daily_appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_appointments
    ADD CONSTRAINT daily_appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 3322589)
-- Name: daily_appointments daily_appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_appointments
    ADD CONSTRAINT daily_appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4985 (class 2606 OID 3322756)
-- Name: daily_revenue_reports daily_revenue_reports_monthly_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_revenue_reports
    ADD CONSTRAINT daily_revenue_reports_monthly_report_id_fkey FOREIGN KEY (monthly_report_id) REFERENCES public.monthly_revenue_reports(monthly_report_id) ON DELETE CASCADE;


--
-- TOC entry 4975 (class 2606 OID 3322646)
-- Name: disease_details disease_details_disease_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disease_details
    ADD CONSTRAINT disease_details_disease_id_fkey FOREIGN KEY (disease_id) REFERENCES public.diseases(disease_id) ON DELETE SET NULL;


--
-- TOC entry 4976 (class 2606 OID 3322641)
-- Name: disease_details disease_details_medical_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disease_details
    ADD CONSTRAINT disease_details_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(medical_record_id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 3331153)
-- Name: invoices fk_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 4972 (class 2606 OID 3322883)
-- Name: daily_appointments fk_medical_record; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_appointments
    ADD CONSTRAINT fk_medical_record FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(medical_record_id);


--
-- TOC entry 4967 (class 2606 OID 3322544)
-- Name: import_receipts import_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_receipts
    ADD CONSTRAINT import_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4982 (class 2606 OID 3322695)
-- Name: invoices invoices_medical_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(medical_record_id) ON DELETE SET NULL;


--
-- TOC entry 4973 (class 2606 OID 3322617)
-- Name: medical_records medical_records_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4974 (class 2606 OID 3322612)
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 4983 (class 2606 OID 3322732)
-- Name: medicine_usage_reports_details medicine_usage_reports_details_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports_details
    ADD CONSTRAINT medicine_usage_reports_details_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id) ON DELETE SET NULL;


--
-- TOC entry 4984 (class 2606 OID 3322727)
-- Name: medicine_usage_reports_details medicine_usage_reports_details_medicine_usage_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicine_usage_reports_details
    ADD CONSTRAINT medicine_usage_reports_details_medicine_usage_report_id_fkey FOREIGN KEY (medicine_usage_report_id) REFERENCES public.medicine_usage_reports(medicine_usage_report_id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 3322527)
-- Name: medicines medicines_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(unit_id) ON DELETE SET NULL;


--
-- TOC entry 4977 (class 2606 OID 3322666)
-- Name: prescription_detail prescription_detail_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail
    ADD CONSTRAINT prescription_detail_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE SET NULL;


--
-- TOC entry 4978 (class 2606 OID 3322661)
-- Name: prescription_detail prescription_detail_medical_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail
    ADD CONSTRAINT prescription_detail_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(medical_record_id) ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 3322671)
-- Name: prescription_detail prescription_detail_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail
    ADD CONSTRAINT prescription_detail_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id) ON DELETE SET NULL;


--
-- TOC entry 4980 (class 2606 OID 3322676)
-- Name: prescription_detail prescription_detail_usage_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_detail
    ADD CONSTRAINT prescription_detail_usage_method_id_fkey FOREIGN KEY (usage_method_id) REFERENCES public.usage_methods(usage_method_id) ON DELETE SET NULL;


--
-- TOC entry 4965 (class 2606 OID 3322483)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE SET NULL;


-- Completed on 2025-12-29 16:26:25

--
-- PostgreSQL database dump complete
--

