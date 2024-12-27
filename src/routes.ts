import express from 'express'
// import UserController from './controllers/user.controller'
import { Container, Token } from 'typedi'
import { IRoute } from './core'
import { validateRequest }  from './middlewares/validation'
import { authenticate } from './middlewares/authentication'
import ShapeController  from './controllers/shape.controller'
import CategoriesController from './controllers/categories.controller'

var router = express.Router();

[
  ShapeController,
    CategoriesController
].forEach(controller => {

  // create instance of the controller
  const instance: any = Container.get(controller as Token<any>);
  //Get Prefix route of the controller
  const prefix = Reflect.getMetadata('prefix', controller)
  //Get all the internal route of the controller
  const routes: Array<IRoute> = Reflect.getMetadata('routes', controller)
  // creating all routes with express routes
  routes.forEach(route => {
    if (route.validSchema) {
      router[route.requestMethod as 'get' | 'post' | 'delete' | 'put'](prefix + route.path,
        authenticate(route.isAuthenticated), // Authentication 
        validateRequest(route.validSchema), // Validate request before serving it
        instance[route.methodName].bind(instance)
      )
    }else {
      router[route.requestMethod as 'get' | 'post' | 'delete' | 'put'](prefix + route.path,
        authenticate(route.isAuthenticated),
        instance[route.methodName].bind(instance)
      )
    }
  })
})

export default router