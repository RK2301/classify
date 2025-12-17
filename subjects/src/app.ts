import cookieSession from 'cookie-session';
import express from 'express';
import cors from 'cors'

import { NotFoundError } from '@rkh-ms/classify-lib/errors';
import { ClassifyErrorHandler, currentUser, typesafe_i18n_middleware, errorHandler } from '@rkh-ms/classify-lib/middlewares';

import { addSubjectRouter } from './routes/add-subject';
import { updateSubjectRouter } from './routes/update-subject';
import { deleteSubjectRouter } from './routes/delete-subject';
import { getSubjectsRouter } from './routes';
import { getSubjectRouter } from './routes/get-subject';

const app = express()

app.set('trust proxy', true)
app.use(cors({
    origin: ['https://classify.dev', 'http://localhost:3000'],
    credentials: true,
}))

app.use(express.json())
app.use(cookieSession({
    signed: false,
    secure: true,
    sameSite: 'none'
}))

app.use(currentUser)
app.use(typesafe_i18n_middleware)

// routers handlers
app.use(getSubjectsRouter)
app.use(getSubjectRouter)

app.use(addSubjectRouter)
app.use(updateSubjectRouter)
app.use(deleteSubjectRouter)

app.use('*', () => {
    console.log('path not found');

    throw new NotFoundError()
})

// error handlers
app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }