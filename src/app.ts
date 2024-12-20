import express from 'express'
import ApiError from './utils/apiError'
import { ApiResponse }  from './utils/apiResponse'
import { Request, Response, NextFunction } from 'express'
import router from './routes'
import { Container } from "typedi";
import { LoggerService } from "./services/logger.service";
import morganLogger from 'morgan'
// import './dbconnection'

const app = express()

app.use(morganLogger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', router);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err  = new ApiError('Resourse not found!', 404)
  next(err)
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  let errMessage = err.message
  let errStatus = err.status || 500
  if (errStatus === 500) {
    const logger = Container.get(LoggerService);
    logger.info('application error', err)
    errMessage = 'Something went wrong'
  }
  const apiResponse = new ApiResponse(true, errMessage, errStatus, null)
  res.status(errStatus).json(apiResponse.response)
});



const errorHandler = (error: any) => {
    const logger = Container.get(LoggerService);
    logger.error("UncaughtException: ", error);
  };
  
  process.on("uncaughtException", function (error) {
    errorHandler(error);
  });
  process.on("unhandledRejection", function (error) {
    errorHandler(error);
  });

export default app
