import express from 'express'
import CookieSession from 'cookie-session'

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { ClassifyErrorHandler, typesafe_i18n_middleware, errorHandler } from '@rkh-ms/classify-lib/middlewares'

import { requestOTPRouter } from './routes/request-prc'
import { verifyPrcRouter } from './routes/verify-prc'
import { resetRouter } from './routes/reset'

const app = express()

app.set('trust proxy', true)

app.use(CookieSession({
    domain: process.env.NODE_ENV === 'production' ? '.classify26.live' : 'classify.dev',
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