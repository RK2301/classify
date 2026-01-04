import express from 'express'
import CookieSession from 'cookie-session';
import cors from 'cors';

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { ClassifyErrorHandler, typesafe_i18n_middleware, errorHandler } from '@rkh-ms/classify-lib/middlewares'

import { requestOTPRouter } from './routes/request-prc'
import { verifyPrcRouter } from './routes/verify-prc'
import { resetRouter } from './routes/reset'

const app = express()

console.log('APP_ORIGIN, COOKIE_DOMAIN are:');
console.log(process.env.APP_ORIGIN, process.env.COOKIE_DOMAIN);

app.set('trust proxy', true)
app.use(cors({
    origin: [process.env.APP_ORIGIN!, 'http://localhost:3000'],
    credentials: true,
}))

app.use(CookieSession({
    domain: process.env.COOKIE_DOMAIN,
    signed: false,
    secure: true,
    sameSite: 'none'
}))
app.use(express.json())
app.use(typesafe_i18n_middleware)

app.use(requestOTPRouter)
app.use(verifyPrcRouter)
app.use(resetRouter)

app.use('*', (req, res) => { throw new NotFoundError() })

app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }