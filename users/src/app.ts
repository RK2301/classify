import express from 'express';
import { json } from 'body-parser';
import CookieSession from 'cookie-session';
import cors from 'cors';

import { NotFoundError } from '@rkh-ms/classify-lib/errors';
import { errorHandler, ClassifyErrorHandler, typesafe_i18n_middleware, currentUser } from '@rkh-ms/classify-lib/middlewares';

import { newStudentRouter } from './routes/students/new-student';
import { loginRouter } from './routes/login';
import { currentUserRouter } from './routes/current-user';
import { signOutRouter } from './routes/logout';
import { updateStudentRouter } from './routes/students/update-student';
import { newTeacherRouter } from './routes/teachers/new-teacher';
import { updateTeacherRouter } from './routes/teachers/update-teacher';
import { getTeachersRouter } from './routes/teachers';
import { newManagerRouter } from './routes/managers/new-manager';
import { deleteManagerRouter } from './routes/managers/delete_manager';
import { getManagersRouter } from './routes/managers';
import { getStudentsRouter } from './routes/students';
import { getStudnetByIdRouter } from './routes/students/get-student-byId';
import { getNonManagersRouter } from './routes/teachers/none-managers';
import { GetTeacherRouter } from './routes/teachers/get-teacher';
import { getAllTeachersRouter } from './routes/teachers/all-teachers';


const app = express();

app.set('trust proxy', true)
app.use(cors({
    origin: ['https://classify.dev', 'http://localhost:3000'],
    credentials: true,
}))

app.use(json())
app.use(
    CookieSession({
        secure: true,
        signed: false,
        sameSite: 'none', // 'lax' for production, 'none' for development with cross-origin requests
    })
)
app.use(typesafe_i18n_middleware)

app.use(currentUser)
app.use(loginRouter)
app.use(currentUserRouter)

app.use(newStudentRouter)
app.use(updateStudentRouter)
app.use(getStudentsRouter)
app.use(getStudnetByIdRouter)

app.use(getTeachersRouter)
app.use(getAllTeachersRouter)
app.use(getNonManagersRouter)
app.use(GetTeacherRouter)
app.use(newTeacherRouter)
app.use(updateTeacherRouter)


app.use(newManagerRouter)
app.use(deleteManagerRouter)
app.use(getManagersRouter)

app.use(signOutRouter)

app.use('*', (req, res) => {
    throw new NotFoundError()
})

app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app };