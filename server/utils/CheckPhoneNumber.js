const isValidPhone = phone =>
  /^(03[2-9]|05[6|8|9]|07[0|6-9]|08[1-9]|09[0-4|6-9])[0-9]{7}$/.test(phone);

module.exports = {
    isValidPhone
}
