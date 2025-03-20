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
    BEDROCK_AWS_REGION: process.env.BEDROCK_AWS_REGION || '',
    BEDROCK_AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEYID || '',
    BEDROCK_AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_KEY || '',
    BEDROCK_AWS_MODELID: process.env.BEDROCK_AWS_MODELID || '',
    //OPENAI models
    OPENAI_KEY: process.env.OPENAI_KEY,
    OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini",
    OPENAI_MATURE_MODEL: process.env.OPENAI_MATURE_MODEL || "gpt-4o",
    //HF models
    HUGGING_FACE_DEFAULT_MODEL: process.env.HUGGING_FACE_DEFAULT_MODEL || "HuggingFaceH4/zephyr-7b-beta",
    HUGGING_FACE_KEY: process.env.HUGGING_FACE_KEY,
    //gemini models
    GEMINI_DEFAULT_MODEL: process.env.GEMINI_DEFAULT_MODEL || "gemini-1.5-flash",
    GEMINI_KEY: process.env.GEMINI_KEY,
    //llm config
    DEFAULT_CHAT_LLM_PLATFORM: process.env.DEFAULT_CHAT_LLM_PLATFORM || "GEMINI",
    DEFAULT_EMBEDDING_LLM_PLATFORM: process.env.DEFAULT_EMBEDDING_LLM_PLATFORM || "OPENAI",

    ISOMETRIC_DBNAME: process.env.ISOMETRIC_DBNAME,
    ISOMETRIC_DATABASE_USERNAME: process.env.ISOMETRIC_DATABASE_USERNAME,
    ISOMETRIC_DATABASE_PASSWORD: process.env.ISOMETRIC_DATABASE_PASSWORD,
    ISOMETRIC_DATABASE_HOST: process.env.ISOMETRIC_DATABASE_HOST,
    ISOMETRIC_DATABASE_PORT: process.env.ISOMETRIC_DATABASE_PORT,
    PG_VECTOR_ISOMETRIC_DB_TABLENAME: process.env.PG_VECTOR_ISOMETRIC_DB_TABLENAME || 'isometric_vector',
    DATABASE_CLIENT: process.env.DATABASE_CLIENT,


}

console.log("config", config)

export default config;