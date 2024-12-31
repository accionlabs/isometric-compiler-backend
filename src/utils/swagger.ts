import { plainToInstance } from 'class-transformer';
// import { validateSync, ValidationError } from 'class-validator';
import { IRoute } from "../core"
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
const { defaultMetadataStorage } = require('class-transformer/cjs/storage')

function generateSwaggerSchema() {
    const schema = validationMetadatasToSchemas({
        classTransformerMetadataStorage: defaultMetadataStorage, // 2) Define class-transformer metadata in options
      })
    console.log("schema", schema)
    return schema
}


export function generateSwaggerDoc(controllers: any[]): any {
  const paths: Record<string, any> = {};

  controllers.forEach((controller) => {
    //Get Prefix route of the controller
    const prefix = Reflect.getMetadata('prefix', controller)
    //Get all the internal route of the controller
    const routes: Array<IRoute> = Reflect.getMetadata('routes', controller)

    const jsonValidataionSchema = generateSwaggerSchema()

    routes.forEach(({ path,  requestMethod: method, validSchema: validationClass, responseSchema }) => {
    console.log(`Swagger Document created for: ${prefix + path} method: ${method},,`)
      const fullPath = `${prefix}${path}`;
      let requestBody: any = {};
      if(validationClass) {
        const myClassInstance = new validationClass();
        console.log("classname", myClassInstance.constructor.name)
        requestBody = jsonValidataionSchema[myClassInstance.constructor.name];
      }
      paths[fullPath] = paths[fullPath] || {};
      paths[fullPath][method.toLowerCase()] =       {
        summary: `Endpoint for ${method.toUpperCase()} ${path}`,
        requestBody: requestBody
          ? {
              content: {
                'application/json': {
                  "$schema": "http://json-schema.org/draft-07/schema#",
                   schema: requestBody,
                },
              },
            }
          : undefined,
        responses: {
          '200': {
            description: 'Successful Response',
            content: {
              'application/json': {
                  "$schema": "http://json-schema.org/draft-07/schema#",
                schema: {},
              },
            },
          },
        },
      }
    });
  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    paths,
  };
}
