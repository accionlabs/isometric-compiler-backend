import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { IRoute } from "../core"

function generateSwaggerSchema(validationClass: any): any {
  if (!validationClass) return null;

  const testData: any = {}
  const instance = plainToInstance(validationClass, testData);
  const validationErrors: ValidationError[] = validateSync(instance, {
    skipMissingProperties: true,
  });

  const schema: Record<string, any> = {};
  validationErrors.forEach((error) => {
    schema[error.property] = {
      type: error.constraints ? 'string' : 'object', // Assuming basic type, expand for complex types
      description: Object.values(error.constraints || {}).join('. '),
    };
  });

  return schema;
}

export function generateSwaggerDoc(controllers: any[]): any {
  const paths: Record<string, any> = {};

  controllers.forEach((controller) => {
    //Get Prefix route of the controller
    const prefix = Reflect.getMetadata('prefix', controller)
    //Get all the internal route of the controller
    const routes: Array<IRoute> = Reflect.getMetadata('routes', controller)

    console.log("routes", routes)
    routes.forEach(({ path,  requestMethod: method, validSchema: validationClass, responseSchema }) => {
    console.log(`Swagger Document created for: ${prefix + path} method: ${method}`)
      const fullPath = `${prefix}${path}`;
      const requestBody = generateSwaggerSchema(validationClass);

      console.log("requestBody", requestBody)
      paths[fullPath] = paths[fullPath] || {};
      paths[fullPath][method.toLowerCase()] = {
        summary: `${method} ${fullPath}`,
        requestBody: requestBody
          ? {
              content: {
                'application/json': {
                  schema: { type: 'object', properties: requestBody },
                },
              },
            }
          : undefined,
        responses: responseSchema || {
          200: {
            description: 'Success',
          },
        },
      };
    });
  });

  console.log("paths", paths)

  return {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    paths,
  };
}
