import request from "supertest";
import { app } from "../../app";
import { Course as CourseAttrs } from "@rkh-ms/classify-lib/interfaces";
import { API } from "@rkh-ms/classify-lib/api";
import { UserRole } from "@rkh-ms/classify-lib";
import { ErrorAttr } from "@rkh-ms/classify-lib/errors";
import { Course } from "../../models/Course";
import { Teacher } from "../../models/Teacher";
import { TeacherCourse } from "../../models/TeacherCourse";
import { Op } from "sequelize";
import { StundetEnrollmentStatus, TeacherAssignedStatus } from "@rkh-ms/classify-lib/enums";
import { Student } from "../../models/Student";
import { StudentCourse } from "../../models/StudentCourse";

const CourseAPIS = API.courses

/**a function to make call to specific course 
 * 
 * @param courseId the id of the course want to get
*/
const makeRequest = (courseId: number, id?: string, role?: UserRole) =>
    request(app)
        .get(CourseAPIS.getCourse(courseId))
        .set('Cookie', id && role ? global.signin({
            id,
            role
        }) : global.signin())
        .send()


it('Return error after trying to delete a course and not logged in', async () => {
    await request(app)
        .get(CourseAPIS.getCourse(3))
        .expect(401)
})



it('Get error after try to get course with invalid id type - string instead of number', async () => {

    const { body } = await makeRequest('aa' as unknown as number)
        .expect(400)

    const errorMessage = (body.errors as ErrorAttr['errors'])[0]?.message
    expect(errorMessage).toBeDefined()
})



it('Get error if try to get a course not exists', async () => {

    await makeRequest(10000)
        .expect(404)
})



it('Return course successfully', async () => {

    // first fetch some course from the DB
    const course = await Course.findOne()
    expect(course).toBeDefined()

    const courseId = course!.dataValues.id

    // now make request to get course data
    const { body } = await makeRequest(courseId).expect(200)

    const reCourse = body as CourseAttrs
    expect(reCourse).toBeDefined()

    // check that values are also correct
    expect(reCourse.id).toEqual(courseId)
    expect(reCourse.title).toEqual(course!.dataValues.title)
    expect(reCourse.startDate).toEqual(course!.dataValues.startDate)
})



it('Return error when teacher try to fetch course not assigned to it', async () => {

    // get some teacher from the DB
    const teacher = await Teacher.findOne()
    expect(teacher).toBeDefined()

    // get all courses, he assigned to
    const teacherCourses = await TeacherCourse.findAll({
        where: {
            teacherId: teacher!.dataValues.id
        }
    })

    // now get some courseId that teacher not assgined for
    const course = await Course.findOne({
        where: {
            id: {
                [Op.notIn]: teacherCourses.map(t => t.dataValues.courseId)
            }
        }
    })
    expect(course).not.toBeNull()

    // make request as teacher to get that course that not assigned to
    // then expect an error
    await makeRequest(course!.dataValues.id, teacher!.dataValues.id, UserRole.Teacher)
        .expect(403)
})



it('Return course successfully when teacher assigned to it', async () => {

    // get some teacher that assigned to a course
    const teacher = await TeacherCourse.findOne({
        where: {
            status: TeacherAssignedStatus.ASSIGNED
        }
    })
    expect(teacher).not.toBeNull()

    // make a request to get that course, as a teacher
    const { body } = await makeRequest(teacher!.dataValues.courseId, teacher!.dataValues.teacherId, UserRole.Teacher)
        .expect(200)
    expect(body).toBeDefined()
})



it('Return error when student try to access course, not enrolled for', async () => {

    // get some student from the DB
    const student = await Student.findOne()
    expect(student).toBeDefined()

    // get all courses, he enrolled to
    const studentCourses = await StudentCourse.findAll({
        where: {
            studentId: student!.dataValues.id,
            status: StundetEnrollmentStatus.ACTIVE
        }
    })

    // now get some course that not enrolled for
    const course = await Course.findOne({
        where: {
            id: {
                [Op.notIn]: studentCourses.map(s => s.dataValues.courseId)
            }
        }
    })
    expect(course).not.toBeNull()


    // now make request to get the course and expect a error
    await makeRequest(course!.dataValues.id, student!.dataValues.id, UserRole.Student)
        .expect(403)
})



it('Return course successfully when student enrolled to it', async () => {

    // get some student that enrolled to a course
    const student = await StudentCourse.findOne({
        where: {
            status: StundetEnrollmentStatus.ACTIVE
        }
    })
    expect(student).not.toBeNull()

    // make a request to get that course, as a teacher
    const { body } = await makeRequest(student!.dataValues.courseId, student!.dataValues.studentId, UserRole.Student)
        .expect(200)
    expect(body).toBeDefined()
})