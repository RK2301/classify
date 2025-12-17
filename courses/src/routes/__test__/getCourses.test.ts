import request from "supertest";
import { app } from "../../app";
import { Course as CourseAttrs } from "@rkh-ms/classify-lib/interfaces";

import { API } from "@rkh-ms/classify-lib/api";
import { PaginationResponse, TeacherAttributes, UserRole } from "@rkh-ms/classify-lib";
import { Course } from "../../models/Course";
import { TeacherCourse } from "../../models/TeacherCourse";
import { CourseKeys, CourseStatus, Sort } from "@rkh-ms/classify-lib/enums";
import { Op } from "sequelize";
import { StudentCourse } from "../../models/StudentCourse";
import dayjs from "dayjs";

const CourseAPIS = API.courses

interface queryParams {
    page?: number,
    limit?: number,
    sort?: number,
    sortDir?: Sort,
    status?: CourseStatus,
    subjectId?: number,
    teacherId?: string
}

/**a function to make call to get all courses */
const makeRequest = (query?: queryParams, id?: string, role?: UserRole) => {

    const queryString: string = query ? new URLSearchParams(query as any).toString() : ''

    return request(app)
        .get(`${CourseAPIS.getCourses}${queryString ? '?' + queryString : ''}`)
        .set('Cookie', id && role ? global.signin({
            id,
            role
        }) : global.signin())
        .send()
}




it('Return error after trying to all courses and not logged in', async () => {
    await request(app)
        .get(CourseAPIS.getCourses)
        .expect(401)
})



// it('Get all courses successfully', async () => {

//     const { body } = await makeRequest()
//         .expect(200)

//     const courses = body as PaginationResponse<CourseAttrs & { Teachers: TeacherAttributes }>

//     // make sure that all courses fetched from the DB
//     const allCourses = await Course.findAll()
//     expect(allCourses).toBeDefined()

//     expect(courses.rows.length).toEqual(allCourses.length)
// })



it('Return all courses for a specific teacher', async () => {

    // first get any teacher assigned to a course
    const teacher = (await TeacherCourse.findOne())?.dataValues.teacherId
    expect(teacher).toBeDefined()

    // fecth teacher courses
    const { body } = await makeRequest(undefined, teacher, UserRole.Teacher)
    const assignedCourses = (body as PaginationResponse<CourseAttrs>).rows

    // fetch from the DB the courses a teacher has assigned to
    const teacherCoursesDB = await TeacherCourse.findAll({
        where: {
            teacherId: teacher
        }
    })

    expect(assignedCourses.length).toEqual(teacherCoursesDB.length)
})



it('Return all courses for a specific student', async () => {

    // first get one of students that enrolled for some course
    const studentId = (await StudentCourse.findOne())?.dataValues.studentId
    expect(studentId).toBeDefined()

    // make request to fetch all courses
    const { body } = await makeRequest(undefined, studentId, UserRole.Student).expect(200)
    const courses = (body as PaginationResponse<CourseAttrs & { StudentCourses: StudentCourse }>).rows

    // fetch from the DB all courses the student  enrolled for
    const enrolledCourses = await StudentCourse.findAll({
        where: {
            studentId
        }
    })

    expect(courses.length).toEqual(enrolledCourses.length)
})



it('Return all courses related to a specific subject', async () => {

    // fetch some subejct
    const subject = (await Course.findOne({
        where: {
            subjectId: {
                [Op.gte]: 1
            }
        }
    }))?.dataValues.subjectId
    expect(subject).toBeDefined()


    const { body } = await makeRequest({ subjectId: subject })
    const courses = (body as PaginationResponse<CourseAttrs>).rows

    // get all subhects related to the subject
    const courseSubjectsDB = await Course.findAll({
        where: {
            subjectId: subject
        }
    })

    expect(courses.length).toEqual(courseSubjectsDB.length)
})



it('Delete a subject and fetch all courses that was related to him', async () => {

    // get some subject that related to any of the courses
    const course = await Course.findOne({
        where: {
            subjectId: {
                [Op.gte]: 1
            }
        }
    })
    expect(course).toBeDefined()
    const subjectId = course!.dataValues.subjectId

    // now set all courses subject to null
    // course who has the specific subject id
    const [updateRows] = await Course.update({
        subjectId: null as unknown as undefined
    }, {
        where: {
            subjectId
        }
    })
    expect(updateRows).toBeGreaterThan(0)

    // now make request to get all courses
    const { body } = await makeRequest({ limit: 100 })
        .expect(200)

    const courses = (body as PaginationResponse<CourseAttrs>).rows

    // now fetch all courses that hasn't assigned to a subject
    // and expect all them must be in the response
    const coursesWithoutSubject = await Course.findAll({
        where: {
            subjectId: {
                [Op.is]: null as unknown as undefined
            }
        }
    })


    /**every course without subject must be returned in the response */
    const allCoursesWithoutSubject = coursesWithoutSubject.every(courseNoSubject =>
        courses.find(course => course.id === courseNoSubject.dataValues.id))

    expect(allCoursesWithoutSubject).toBeTruthy()
})



it('Return courses for a specific teacher', async () => {

    const teacherId = (await TeacherCourse.findOne())?.dataValues.teacherId
    expect(teacherId).toBeDefined()
    console.log(teacherId);

    // make a request to get all teacher courses
    const { body } = await makeRequest({ teacherId, limit: 100 })
        .expect(200)
    const courses = (body as PaginationResponse<CourseAttrs & { Teachers: TeacherAttributes[] }>).rows

    console.log(courses.map(t => t.Teachers));

    // fetch all teacher courses
    const teacherCourses = await TeacherCourse.findAll({
        where: {
            teacherId
        }
    })
    expect(teacherCourses).toBeDefined()


    // make sure all the courses exists in the response
    expect(courses.length).toEqual(teacherCourses.length)
    expect(teacherCourses.map(c => c.dataValues.courseId).sort((a, b) => a - b))
        .toEqual(courses.map(c => c.id).sort((a, b) => a - b))
})



it('Expect courses returned based on course status', async () => {

    //  first query all completed courses and check if they are really completed
    const { body } = await makeRequest({ status: CourseStatus.Completed }).expect(200)
    const completedCourses = (body as PaginationResponse<CourseAttrs>).rows

    const allCompleted = completedCourses.every(c => dayjs() > dayjs(c.endDate))
    expect(allCompleted).toBeTruthy()


    //  second, get all courses that still in progress
    const { body: progressBody } = await makeRequest({ status: CourseStatus.InProgress }).expect(200)
    const inProgressCourses = (progressBody as PaginationResponse<CourseAttrs>).rows

    const allInProgess = inProgressCourses.every(c => dayjs().startOf('day').toDate() >= dayjs(c.startDate).toDate() &&
        dayjs().startOf('day').toDate() <= dayjs(c.endDate).toDate())

    expect(allInProgess).toBeTruthy()


    //  third, get all courses that not yet started
    const { body: notStartedBody } = await makeRequest({ status: CourseStatus.NotStarted }).expect(200)
    const notStartedCourses = (notStartedBody as PaginationResponse<CourseAttrs>).rows

    const allNotStarted = notStartedCourses.every(c => dayjs().startOf('day').isBefore(dayjs(c.startDate)))
    expect(allNotStarted).toBeTruthy()
})



it('Return courses sorted based on start date', async () => {

    // 1.A make request to get all courses
    // by default they should be sorted based on start date
    // and in DESC order
    const { body: startDateDescBody } = await makeRequest().expect(200)
    const startDateDescCourses = (startDateDescBody as PaginationResponse<CourseAttrs>).rows

    const isSorted = startDateDescCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].startDate >= course.startDate
    })
    expect(isSorted).toBe(true)


    // 1.B make request to sort courses based on start date and ASC direction
    const { body: startDateAscBody } = await makeRequest({ sortDir: Sort.ASC }).expect(200)
    const startDateAscCourses = (startDateAscBody as PaginationResponse<CourseAttrs>).rows

    const isSortedASC = startDateAscCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].startDate <= course.startDate
    })
    expect(isSortedASC).toBe(true)
})



it('Return courses sorted based on end date', async () => {

    // 1.A make request to get all courses, sorted based on end date
    // and in DESC order (as it's default order direction)
    const { body: endDateDescBody } = await makeRequest({ sort: 2 }).expect(200)
    const endDateDescCourses = (endDateDescBody as PaginationResponse<CourseAttrs>).rows

    const isSorted = endDateDescCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].endDate >= course.endDate
    })
    expect(isSorted).toBe(true)


    // 1.B make request to sort courses based on end date and ASC direction
    const { body: endDateAscBody } = await makeRequest({ sort: 2, sortDir: Sort.ASC }).expect(200)
    const endDateAscCourses = (endDateAscBody as PaginationResponse<CourseAttrs>).rows

    const isSortedASC = endDateAscCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].endDate <= course.endDate
    })
    expect(isSortedASC).toBe(true)
})



it('Return courses sorted based on title', async () => {

    // 1.A make request to get all courses, sorted based on title
    // and in DESC order (as it's default order direction)
    const { body: titleDescBody } = await makeRequest({ sort: 3 }).expect(200)
    const titleDescCourses = (titleDescBody as PaginationResponse<CourseAttrs>).rows

    const isSorted = titleDescCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].title.localeCompare(course.title) >= 0
    })

    expect(isSorted).toBe(true)


    // 1.B make request to sort courses based on title and ASC direction
    const { body: titleAscBody } = await makeRequest({ sort: 3, sortDir: Sort.ASC }).expect(200)
    const titleAscCourses = (titleAscBody as PaginationResponse<CourseAttrs>).rows

    const isSortedASC = titleAscCourses.every((course, index, arr) => {
        return index === 0 || arr[index - 1].title.localeCompare(course.title) <= 0
    })

    expect(isSortedASC).toBe(true)
})