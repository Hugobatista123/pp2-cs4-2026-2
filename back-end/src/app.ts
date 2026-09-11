import express, { json, urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'

import indexRouter from './routes/index.js'
import usersRouter from './routes/users.js'
import customersRouter from './routes/customers.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { NotFoundError } from './errors/NotFoundError.js'

const app = express()

app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/customers', customersRouter)
app.use((_req, _res, next) => next(new NotFoundError()))
app.use(errorHandler)

export default app
