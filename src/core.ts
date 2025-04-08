import { FileUploadOptions } from "./middlewares/fileUpload";

export function Controller(prefix: string) {
  return function (target: any) {
    Reflect.defineMetadata('prefix', prefix, target)
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
  }
}

interface IAuth {
  isAuthenticated: boolean;
  authorizedRole: string;
  fileUpload?: boolean;
  fileUplaodOptions?: FileUploadOptions
}

export function Get(path: string, auth: IAuth, responseSchema: any | any[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor)
    }

    const routes = Reflect.getMetadata('routes', target.constructor) as Array<IRoute>
    routes.push({
      requestMethod: 'get',
      path: path,
      methodName: propertyKey,
      authorizedRole: auth.authorizedRole,
      isAuthenticated: auth.isAuthenticated,
      responseSchema: responseSchema
    })
  }
}

export function Post(path: string, validSchema: any, auth: IAuth, responseSchema: any) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor)
    }

    const routes = Reflect.getMetadata('routes', target.constructor) as Array<IRoute>
    routes.push({
      requestMethod: 'post',
      path: path,
      methodName: propertyKey,
      validSchema: validSchema,
      responseSchema: responseSchema,
      isAuthenticated: auth.isAuthenticated,
      authorizedRole: auth.authorizedRole,
      fileUpload: auth.fileUpload,
      fileUplaodOptions: auth.fileUplaodOptions
    })
  }
}

export function Put(path: string, validSchema: any, auth: IAuth, responseSchema: any) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor)
    }

    const routes = Reflect.getMetadata('routes', target.constructor) as Array<IRoute>
    routes.push({
      requestMethod: 'put',
      path: path,
      methodName: propertyKey,
      validSchema: validSchema,
      responseSchema: responseSchema,
      isAuthenticated: auth.isAuthenticated,
      authorizedRole: auth.authorizedRole,
      fileUpload: auth.fileUpload,
      fileUplaodOptions: auth.fileUplaodOptions
    })
  }
}

export function Delete(path: string, auth: IAuth, responseSchema: any) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor)
    }

    const routes = Reflect.getMetadata('routes', target.constructor) as Array<IRoute>
    routes.push({
      requestMethod: 'delete',
      path: path,
      methodName: propertyKey,
      responseSchema: responseSchema,
      authorizedRole: auth.authorizedRole,
      isAuthenticated: auth.isAuthenticated
    })
  }
}

export interface IRoute extends IAuth {
  requestMethod: string;
  path: string;
  methodName: string;
  validSchema?: any;
  responseSchema?: any;
}