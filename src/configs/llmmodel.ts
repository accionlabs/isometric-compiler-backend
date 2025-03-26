import * as dotenv from 'dotenv';
dotenv.config();


const config = {
    //OPENAI models
    OPENAI_KEY: process.env.OPENAI_KEY,
    OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini",
    OPENAI_MATURE_MODEL: process.env.OPENAI_MATURE_MODEL || "gpt-4o",

    //gemini models
    GEMINI_DEFAULT_MODEL: process.env.GEMINI_DEFAULT_MODEL || "gemini-1.5-flash",
    GEMINI_KEY: process.env.GEMINI_KEY,
    //llm config
    DEFAULT_CHAT_LLM_PLATFORM: process.env.DEFAULT_CHAT_LLM_PLATFORM || "GEMINI",
    DEFAULT_EMBEDDING_LLM_PLATFORM: process.env.DEFAULT_EMBEDDING_LLM_PLATFORM || "OPENAI",

}
export default config;