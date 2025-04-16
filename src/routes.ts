import express from 'express'
// import UserController from './controllers/user.controller'
import { Container, Token } from 'typedi'
import { IRoute } from './core'
import { validateRequest } from './middlewares/validation'
import { authenticate } from './middlewares/authentication'
import ShapeController from './controllers/shape.controller'
import CategoriesController from './controllers/categories.controller'
import UserController from './controllers/user.controller'
import DiagramController from './controllers/diagram.controller'
import ChatController from './controllers/chat.controller'
import { fileUpload } from './middlewares/fileUpload'
import { DocumentController } from './controllers/document.controller'
import SematicModelController from './controllers/semanticModel.controller'
import SematicModelHistoryController from './controllers/sematicModelHistory.controller'

var router = express.Router();

export const controllers = [
  ShapeController,
  CategoriesController,
  UserController,
  DiagramController,
  ChatController,
  DocumentController,
  SematicModelController,
  SematicModelHistoryController
]

controllers.forEach(controller => {

  // create instance of the controller
  const instance: any = Container.get(controller as Token<any>);
  //Get Prefix route of the controller
  const prefix = Reflect.getMetadata('prefix', controller)
  //Get all the internal route of the controller
  const routes: Array<IRoute> = Reflect.getMetadata('routes', controller)
  // creating all routes with express routes
  routes.forEach(route => {
    console.log(`Route Registerd path: ${prefix + route.path} method: ${route.requestMethod}`)
    const middlewares = [authenticate(route.isAuthenticated)];

    if (route.fileUpload) {
      const fileUploadMid = fileUpload(route.fileUplaodOptions ?? {})
      if (fileUploadMid) middlewares.push(fileUploadMid)
    }

    if (route.validSchema) {
      middlewares.push(validateRequest(route.validSchema));
    }

    middlewares.push(instance[route.methodName].bind(instance));

    router[route.requestMethod as 'get' | 'post' | 'delete' | 'put'](prefix + route.path, ...middlewares);
  })
})

export default router