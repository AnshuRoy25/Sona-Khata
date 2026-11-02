import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  gnaniApiKey: process.env.GNANI_API_KEY,

  llmUrl: process.env.LLM_URL,
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
};



export default config;