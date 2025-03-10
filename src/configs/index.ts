import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    nodePort: process.env.PORT,
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
    },
    logLocation: process.env.LOG_LOCATION,
    microserviceName: process.env.MICROSERVICE_NAME,
    API_KEY:process.env.API_KEY
}

console.log("config", config)

export default config;