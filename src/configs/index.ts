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
    API_KEY: process.env.API_KEY,
    ISOMETRIC_DOC_FOLDER: process.env.ISOMETRIC_DOC_FOLDER || 'isometric/document/',
    ISOMETRIC_IMAGE_FOLDER: process.env.ISOMETRIC_IMAGE_FOLDER || 'isometric/image/',


    PG_VECTOR_ISOMETRIC_DB_TABLENAME: process.env.PG_VECTOR_ISOMETRIC_DB_TABLENAME || 'isometric_vector',
    DATABASE_CLIENT: process.env.DATABASE_CLIENT,

    SOURCE_EMAIL_ID: process.env.SOURCE_EMAIL_ID,


}

export default config;