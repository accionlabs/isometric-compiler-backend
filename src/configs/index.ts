import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    nodePort: process.env.PORT,
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME
    }
}

export default config;