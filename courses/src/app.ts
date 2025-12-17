import express from 'express'
import cors from 'cors'
import cookieSession from 'cookie-session'

import { ClassifyErrorHandler, currentUser, requireAuth, typesafe_i18n_middleware } from '@rkh-ms/classify-lib/middlewares'
import { NotFoundError } from '@rkh-ms/classify-lib/errors'
import { errorHandler } from '@rkh-ms/classify-lib/middlewares'
import { addCourseRouter } from './routes/add'
import { updateCourseTitleRouter } from './routes/updateTitle'
import { updateCourseSubjectRouter } from './routes/updateSubject'
import { updateCourseStartTimeRouter } from './routes/updateStartTime'
import { deleteCourseRouter } from './routes/delete'
import { getCourseRouter } from './routes/get-course'
import { assignTeacherRouter } from './routes/teachers/assign'
import { unassignTeacherRouter } from './routes/teachers/unassign'
import { getCourseTeachers } from './routes/teachers'
import { getTeachersToAssign } from './routes/teachers/get-teachers-to-assign'
import { withdrawalStudnetRouter } from './routes/students/withdrawal'
import { enrollStudentRouter } from './routes/students/enroll'
import { getCourseStudentsRouter } from './routes/students'
import { getStundetsToEnrollRouter } from './routes/students/students-to-enroll'
import { addLessonRouter } from './routes/lessons/add'
import { updateLessonRouter } from './routes/lessons/update'
import { deleteLessonRouter } from './routes/lessons/delete'
import { getLessonsRouter } from './routes/lessons'
import { getLast6LessonsRouter } from './routes/lessons/last6Lessons'
import { getCoursesRouter } from './routes'
import { getAllLessons } from './routes/lessons/all-lessons'

const app = express()

app.set('trust proxy', true)
app.use(cors({
    origin: ['https://classify.dev', 'http://localhost:3000'],
    credentials: true
}))

app.use(express.json())
app.use(cookieSession({
    signed: false,
    secure: true,
    sameSite: 'none'
}))

app.use(currentUser)
//must be called before requiredAuth, so if error thrown by
//it, so the error handler can return response in the right language
app.use(typesafe_i18n_middleware)

// to access all routes, the user must be authenticated
app.use(requireAuth)

// routes handler
app.use(getCoursesRouter)
app.use(getCourseRouter)
app.use(addCourseRouter)
app.use(updateCourseTitleRouter)
app.use(updateCourseSubjectRouter)
app.use(updateCourseStartTimeRouter)
app.use(deleteCourseRouter)

// routes handlers for teacher assignment for a course
app.use(getCourseTeachers)
app.use(getTeachersToAssign)
app.use(assignTeacherRouter)
app.use(unassignTeacherRouter)

// routes to handle studnet enrollment for courses
app.use(getCourseStudentsRouter)
app.use(getStundetsToEnrollRouter)
app.use(enrollStudentRouter)
app.use(withdrawalStudnetRouter)

// routes for handling add, update, delete and get lessons for specific course
app.use(getAllLessons)
app.use(getLessonsRouter)
app.use(getLast6LessonsRouter)
app.use(addLessonRouter)
app.use(updateLessonRouter)
app.use(deleteLessonRouter)


app.use('*', () => {
    console.log('Got here, route not found');

    throw new NotFoundError()
})

app.use(ClassifyErrorHandler)
app.use(errorHandler)

export { app }