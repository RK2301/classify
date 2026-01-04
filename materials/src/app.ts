import express from 'express'
import cookieSession from 'cookie-session'
import cors from 'cors'

import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import {
    ClassifyErrorHandler,
    currentUser,
    errorHandler,
    requireAuth,
    typesafe_i18n_middleware
} from '@rkh-ms/classify-lib/middlewares'
import { addMaterialRouter } from './routes/add'
import { getMaterialsRouter } from './routes'
import { downloadFileRouter } from './routes/downloadFile'
import { deleteFileRouter } from './routes/deleteFile'
import { deleteMaterialRouter } from './routes/deleteMaterial'
import { updateMaterialRouter } from './routes/updateMaterial'


const app = express()

console.log('APP_ORIGIN is:');
console.log(process.env.APP_ORIGIN);

app.set('trust proxy', true)
app.use(cors({
    origin: [process.env.APP_ORIGIN!, 'http://localhost:3000'],
    credentials: true
}))

app.use(cookieSession({
    signed: false,
    secure: true,
    sameSite: 'none'
}))
app.use(currentUser)
app.use(typesafe_i18n_middleware)

// all routes require user to be authenticated
app.use(requireAuth)

app.use(express.json());

// router handlers for materials
app.use(addMaterialRouter)
app.use(updateMaterialRouter)

app.use(getMaterialsRouter)
app.use(downloadFileRouter)

app.use(deleteMaterialRouter)
app.use(deleteFileRouter)

app.use('*', async () => {
    throw new NotFoundError()
})
app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }