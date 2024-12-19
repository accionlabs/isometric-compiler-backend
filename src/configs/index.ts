import * as dotenv from 'dotenv';
const result = dotenv.config();

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('Loaded .env file:', result.parsed);
}

const config = {
    nodePort: process.env.PORT,
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME
    }
}

console.log("Confffffffffff", config)

export default config;