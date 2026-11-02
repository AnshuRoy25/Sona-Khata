// phone → { code, expiresAt, ...extra data like name, role }
const otpStore = new Map();

const OTP_VALID_MINUTES = 5;

function saveOTP(phone, data) {
  const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);
  otpStore.set(phone, { ...data, expiresAt: expiresAt });

  setTimeout(function () {
    const current = otpStore.get(phone);
    if (current && current.code === data.code) {
      otpStore.delete(phone);
    }
  }, OTP_VALID_MINUTES * 60 * 1000);
}

function getOTP(phone) {
  return otpStore.get(phone);
}

function deleteOTP(phone) {
  otpStore.delete(phone);
}

// demo version: same code for everyone, no SMS
function generateOTP() {
  return "123456";
}

export { saveOTP, getOTP, deleteOTP, generateOTP };