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
import { reportAttendanceRouter } from './routes/report-attendance'
import { lessonAttendanceRouter } from './routes/lesson-attendance'
import { studentAttendanceRouter } from './routes/student-attendance'

const app = express()

app.set('trust proxy', true)
app.use(cors({
    origin: ['https://classify.dev', 'http://localhost:3000'],
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

app.use(express.json())

// router handlers for attendance
app.use(reportAttendanceRouter)
app.use(lessonAttendanceRouter)
app.use(studentAttendanceRouter)

app.use('*', async () => {
    throw new NotFoundError()
})
app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }