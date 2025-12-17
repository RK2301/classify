import cookieSession from "cookie-session";
import express from 'express'
import cors from 'cors'

import {  NotFoundError } from "@rkh-ms/classify-lib/errors";
import { 
    ClassifyErrorHandler,
    currentUser,
    typesafe_i18n_middleware,
    errorHandler
} from "@rkh-ms/classify-lib/middlewares";

import { startShiftRouter } from "./routes/start-shift";
import { endShiftRouter } from "./routes/end-shift";
import { getCurrentShiftRouter } from "./routes/current-shift";
import { getShiftsRouter } from "./routes";
import { deleteShiftRoute } from "./routes/delete-shift";
import { updateShiftRouter } from "./routes/update-shift";
import { getTeachersInfo } from "./routes/teachers-info";

const app = express()

app.set('trust proxy', true)
app.use(cors({
    origin: ['https://classify.dev', 'http://localhost:3000'],
    credentials: true,
}))

app.use(cookieSession({
    signed: false,
    secure: true, // Use secure cookies in production
    sameSite: 'none'
}))
app.use(express.json())

app.use(currentUser)
app.use(typesafe_i18n_middleware)

app.use(getShiftsRouter);
app.use(getTeachersInfo)
app.use(startShiftRouter)
app.use(endShiftRouter)
app.use(getCurrentShiftRouter)
app.use(updateShiftRouter)
app.use(deleteShiftRoute)

app.use('*', () => {
    throw new NotFoundError();
})

app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }