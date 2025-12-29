const { randomUUID } = require("crypto"); 

function generateCode() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");

  const short = randomUUID().slice(0,6).toUpperCase();

  return `INV/${y}/${m}/${d}/${short}`;
}

module.exports = {
    generateCode
}