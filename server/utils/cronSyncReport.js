// cron/receipt.cron.js
const cron = require("node-cron");

const {syncReportRevenue} = require('../services/report_revenue_update'); 
// Hàm export cron job
function startCronReport() {
  // Chạy mỗi 5 phút
  cron.schedule("*/1 * * * *", async () => {
    console.log("Cron chạy: cập nhật báo cáo...");
    try {
     await syncReportRevenue(); // gọi hàm xử lý từ service
    } catch (error) {
      console.error("Lỗi cron receipt:", error);
    }
  });
};


module.exports = {
    startCronReport
}