import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Table,
  Divider,
  Space,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import styles from "./ModalDetail.module.css";

import { settingsAPI } from "../../services/api";


