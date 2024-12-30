import fs from 'fs';
import path from 'path';
import { generateSwaggerDoc } from './utils/swagger'; // Swagger generation logic
import { controllers } from './routes'; // Import your controllers

function main() {
    try {
        const swaggerDoc = generateSwaggerDoc(controllers);

        // Define the output directory and file path
        const outputDir = path.resolve(__dirname, '../build');
        const outputPath = path.resolve(outputDir, 'swagger.json');

        // Ensure the directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it doesn't exist
        }

        // Write Swagger JSON to the output file
        fs.writeFileSync(outputPath, JSON.stringify(swaggerDoc, null, 2), 'utf-8');

        console.log(`Swagger documentation generated at: ${outputPath}`);
        process.exit(0);
    } catch(err) {
        console.error('Error generating Swagger documentation:', err);
        process.exit(1);
    }
}

main()