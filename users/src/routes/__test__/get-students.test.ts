import request from "supertest";
import { app } from "../../app";
import { StudentAttributes, UserAttributes, UserRole } from "@rkh-ms/classify-lib";
import { Student } from "../../models/student";
import { User } from "../../models/user";

const students = [{
    id: '123456789',
    firstName: 'Rami',
    lastName: 'Khattab',
    email: 'rami.khattab0@gmail.com',
    grade: 10,
    fatherName: 'Ahmed',
    motherName: 'Alaa',
    phone: '0543957965',
    motherPhone: '0543957965',
    fatherPhone: '0543957965'
}, {
    id: '123456788',
    firstName: 'Mark',
    lastName: 'Josan',
    email: 'mark.josan@gmail.com',
    grade: 7,
    fatherName: 'Henry',
    motherName: 'Jessica'
}, {
    id: '123456787',
    firstName: 'John',
    lastName: 'Cena',
    email: 'john.cena@outlook.com',
    grade: 11,
    fatherName: 'David'
}, {
    id: '123456786',
    firstName: 'Ahmed',
    lastName: 'Alsarea',
    email: 'ahmed.alsarea@outlook.com',
    grade: 6,
    fatherName: 'Khaled'
}, {
    id: '123456785',
    firstName: 'Steve',
    lastName: 'Jobs',
    email: 'steve.jobs@google.com',
    grade: 3,
    fatherName: 'Ali'
}, {
    id: '123456784',
    firstName: 'Bale',
    lastName: 'Gates',
    email: 'bale.gates@microsoft.com',
    grade: 5,
    fatherName: 'Mate'
}, {
    id: '123456783',
    firstName: 'Lee',
    lastName: 'Jae-yong',
    email: 'lee.yong@samsung.com',
    grade: 9,
    fatherName: 'Jae',
    motherName: 'Lee'
}]

export const checkSearch = (rows: UserAttributes[], regex: RegExp) => {
    const filteredStudents = rows.map(s => s.id)

    //filter students based on firstName + lastName
    //and sort them based on their ID
    const filteredBasedOnSearch = [...students]
        .filter(s => regex.test(s.firstName.toLowerCase() + ' ' + s.lastName.toLowerCase()))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 4)
        .map(s => s.id)

    expect(filteredStudents)
        .toEqual(filteredBasedOnSearch)
}


const addStudents = async () => {

    await User.bulkCreate(students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        role: UserRole.Student
    })))

    await Student.bulkCreate(students.map(student => ({
        id: student.id,
        grade: student.grade,
        motherName: student.motherName,
        motherPhone: student.motherPhone,
        fatherName: student.fatherName,
        fatherPhone: student.fatherPhone
    })))

    // students.forEach(async (student) => {
    //     const {
    //         id,
    //         firstName,
    //         lastName,
    //         email,
    //         grade,
    //         fatherName,
    //         motherName,
    //         fatherPhone,
    //         motherPhone,
    //         phone
    //     } = student

    //     await sequelize.transaction(async (t) => {
    //         const user = User.build({ id, firstName, lastName, email, phone, role: UserRole.Student });
    //         await user.save({ transaction: t });

    //         //create new student
    //         const std = Student.build({ id: user.id, grade, motherName, motherPhone, fatherName, fatherPhone })
    //         await std.save({ transaction: t })
    //     })
    // })

}

it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .get("/api/users/students")
        .send()
        .expect(401);
});

it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .post("/api/users/students")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});

it('Get all students successfully', async () => {

    await addStudents()

    //make get request to get all teachers
    const res = await request(app)
        .get('/api/users/students')
        .set('Cookie', global.signin())
        .expect(200)

    expect(res.body.rows.length).toEqual(students.length)

    //check if responses contain 7 teachers
    const all_students = await Student.findAll({ where: {} })
    expect(all_students.length).toEqual(students.length)
})

it('Get all students successfully based on limit and page filter', async () => {

    await addStudents()

    //make get request to get all teachers
    const res = await request(app)
        .get('/api/users/students?limit=4')
        .set('Cookie', global.signin())
        .expect(200)

    expect(res.body.rows.length).toEqual(4)

    const res2 = await request(app)
        .get('/api/users/students?page=2&limit=4')
        .set('Cookie', global.signin())
        .expect(200)

    //second page should contain the 3 left students
    expect(res2.body.rows.length).toEqual(3)

    //check if responses contain 4 teachers
    const all_students = await Student.findAll({ where: {} })
    expect(all_students.length).toEqual(students.length)
})

it('Get students sorted based on their first name', async () => {
    await addStudents()

    //make get request to get all teachers
    const { body } = await request(app)
        .get('/api/users/students?page=1&limit=4&sort=2')
        .set('Cookie', global.signin())
        .expect(200)

    const sortedStudents: StudentAttributes[] = body.rows

    //sort the original students array based on firstName field 
    //and check if the array equals to the one gets from the request
    //finally sort the studentSlice based on firstName and get first 4 results
    const studnetsSlice = [...students]
        .sort((a, b) => a.firstName.localeCompare(b.firstName))
        .slice(0, 4)
        .map(student => student.id)


    expect(studnetsSlice).
        toEqual(sortedStudents.map(student => student.id))
})


it('Get students sorted in DESC based on their grades', async () => {

    await addStudents()

    const { body: { rows } } = await request(app)
        .get('/api/users/students?page=1&limit=4&sort=6&sortDir=DESC')
        .set('Cookie', global.signin())
        .expect(200)
    const sortedStudents: StudentAttributes[] = rows

    console.log(sortedStudents);


    const sort = sortedStudents.every(
        (s, index, students) => index === 0 || s.grade <= students[index - 1].grade)

    expect(sort).toBeTruthy()
})

it('Filter students based on their grade', async () => {

    await addStudents()

    const filterByGrades = [10, 3, 5]

    const { body: { rows } } = await request(app)
        .get(`/api/users/students?page=1&limit=4&grades=${filterByGrades.join(',')}`)
        .set('Cookie', global.signin())
        .expect(200)

    const filterStudents: StudentAttributes[] = rows

    const filterStudnetBasedOnGrades = [...students]
        .filter(s => filterByGrades.includes(s.grade))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 4)
        .map(s => s.id)

    expect(filterStudents.map(s => s.id))
        .toEqual(filterStudnetBasedOnGrades)
})

it('Search for students based on their first and/or last name', async () => {

    await addStudents()
    const searchQuery = ['le', 'le%g']

    const { body: { rows } } = await request(app)
        .get(`/api/users/students?page=1&limit=4&search=${searchQuery[0]}`)
        .set('Cookie', global.signin())
        .expect(200)

    const res2 = await request(app)
        .get(`/api/users/students?page=1&limit=4&search=${searchQuery[1]}`)
        .set('Cookie', global.signin())
        .expect(200)



    checkSearch(rows, /le/i)
    checkSearch(res2.body.rows, /le.*g/)
})