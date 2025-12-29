import React from "react";
import { Input } from "antd";
import styles from "./SearchBar.module.css";

const SearchBar = ({ placeholder }) => {
  return (
    <div className={styles.search}>
      <Input.Search placeholder={placeholder} allowClear enterButton />
    </div>
  );
};

export default SearchBar;
