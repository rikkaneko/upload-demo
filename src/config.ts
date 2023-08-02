import dotenv from 'dotenv';

// Load environment variable
dotenv.config();

const config = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  ENDPOINT: process.env.ENDPOINT!,
  BUCKET_NAME: process.env.BUCKET_NAME!,
  REGION: process.env.REGION!,
};

for (const [key, value] of Object.entries(config)) {
  if (value == null) {
    console.error(`${key} is not defined`);
    process.exit(1);
  }
}

export default config;
