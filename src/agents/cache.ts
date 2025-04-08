import * as examples from "./example.json";

const __CACHE__: Record<string, any> = examples;

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getCache = async (hash?: string): Promise<any | null> => {
    if (!hash) return null;
    const value = __CACHE__[hash.toLowerCase()];
    if (value) {
        await delay(1000);
        return value;
    }
    return null;
};

export { getCache };
