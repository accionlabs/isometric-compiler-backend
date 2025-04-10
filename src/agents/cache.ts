// import * as examples from "./example.json";

// const __CACHE__: Record<string, any> = examples;
import fs from 'fs/promises';

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getCache = async (filename?: string): Promise<any | null> => {
    if (!filename) return null;
    const hash = filename.split('.').slice(0, -1).join('.');
    // const value = __CACHE__[hash.toLowerCase()];
    let value = null;
    try {
        value = await fs.readFile(`./src/agents/${hash}.json`, 'utf8')
    } catch (e) {
        console.error("Error reading cache file:");
    }
    if (value) {
        await delay(1000);
        return JSON.parse(value);
    }
    return null;
};

export { getCache };
