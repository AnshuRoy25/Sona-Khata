// mock for now: prints to terminal
// later: replace the body with MSG91 / Twilio API call, nothing else changes
async function sendSms(phone, message) {
  console.log(`[SMS to ${phone}] ${message}`);
}

export default sendSms;