import request from "supertest";
import { app } from "../../app";
import { TeacherAttributes, TeacherSpecificAttr, UserAttributes, UserRole } from "@rkh-ms/classify-lib";
import { Teacher } from "../../models/teacher";
import { User } from "../../models/user";
import { checkSearch } from "./get-students.test";

const teachers: TeacherAttributes[] = [{
    id: '123456789',
    firstName: 'Rami',
    lastName: 'Khattab',
    email: 'rami.khattab0@gmail.com',
    phone: '0543957965',
    startDate: '2025-01-01',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456788',
    firstName: 'Mark',
    lastName: 'Josan',
    email: 'mark.josan@gmail.com',
    startDate: '2024-10-01',
    endDate: '2025-02-05',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456787',
    firstName: 'John',
    lastName: 'Cena',
    phone: '0507816718',
    email: 'john.cena@gmail.com',
    startDate: '2023-09-20',
    endDate: '2025-04-10',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456786',
    firstName: 'Ahmed',
    lastName: 'Alsarea',
    email: 'ahmed.alsarea@outlook.com',
    startDate: '2022-10-01',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456785',
    firstName: 'Steve',
    lastName: 'Jobs',
    email: 'steve.jobs@google.com',
    startDate: '2025-02-10',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456784',
    firstName: 'Bale',
    lastName: 'Gates',
    email: 'bale.gates@microsoft.com',
    phone: '0518162518',
    startDate: '2024-08-20',
    role: UserRole.Teacher,
    version: 1
}, {
    id: '123456783',
    firstName: 'Lee',
    lastName: 'Jae-yong',
    email: 'lee.yong@samsung.com',
    startDate: '2022-07-25',
    endDate: '2025-02-26',
    role: UserRole.Teacher,
    version: 1
}]

interface TeacherUser extends TeacherSpecificAttr {
    User: UserAttributes
}

/**function that add teachers from the array to the DB */
const addTeachers = async () => {

    await User.bulkCreate(teachers.map((teacher): UserAttributes => ({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        role: UserRole.Teacher,
        version: 1
    })))

    await Teacher.bulkCreate(teachers.map((teacher): TeacherSpecificAttr => ({
        id: teacher.id,
        startDate: teacher.startDate,
        endDate: teacher.endDate,
        version: 1
    })))

}

/**function that make request to get all teachers.
 * * @param queryOptions: object that contains the query options to be passed to the request
 */
const makeRequest = async (queryOptions?: {
    page?: number,
    limit?: number,
    sort?: number,
    sortDir?: 'ASC' | 'DESC',
    search?: string,
    endDate?: boolean
}) => {
    const api = '/api/users/teachers'
    let params = ''

    if (queryOptions)
        params = new URLSearchParams(queryOptions as any).toString()

    //make get request to get all teachers
    const res = await request(app)
        .get(`${api}${params ? '?' + params : ''}`)
        .set('Cookie', global.signin())
        .expect(200)

    return res
}

/**sort teachers based on some field and direction 
 * @returns the sorted teachers id based on the field and direction
*/
const checkSort = <T extends keyof TeacherAttributes>(teachers: TeacherAttributes[],
    field: T, orderDir: 'ASC' | 'DESC' = 'ASC') => {
    let compareResult = 0

    const sortedTeachers = [...teachers]
        .sort((a, b) => {
            compareResult = 0

            if (typeof a[field] === 'number' && typeof b[field] === 'number')
                compareResult = orderDir === 'ASC' ? a[field] - b[field] :
                    b[field] - a[field]

            if (typeof a[field] === 'string' && typeof b[field] === 'string')
                compareResult = orderDir === 'ASC' ? a[field].localeCompare(b[field]) :
                    b[field].localeCompare(a[field])


            //if one of the values is null and the other is not
            //then we need to check the order direction
            //if the order direction is ASC then the null value should be at the beginning of the array
            if (a[field] == null && b[field] !== null)
                compareResult = orderDir === 'ASC' ? -1 : 1


            if (b[field] == null && a[field] !== null)
                compareResult = orderDir === 'ASC' ? 1 : -1



            //if we got equlaity based on the field we are sorting by
            //then sort based on their index in the original array
            // if (compareResult === 0) {
            //     const aInx = teachers.findIndex(t => t.id === a.id)
            //     const bInx = teachers.findIndex(t => t.id === b.id)
            //     return aInx - bInx
            //     // return a.id.localeCompare(b.id)
            // }

            return compareResult
        })
        .slice(0, 4)
        .map(t => t.id)

    return sortedTeachers
}

it("retrun an error if the user not signed in", async () => {
    await request(app)
        .get("/api/users/teachers")
        .send()
        .expect(401);
});


it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .post("/api/users/teachers")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});



it('get all teachers successfully', async () => {

    await addTeachers()

    //make get request to get all teachers
    const res = await makeRequest()

    expect(res.body.rows.length).toEqual(teachers.length)

    //check if responses contain 2 teachers
    const all_teachers = await Teacher.findAll({ where: {} })
    expect(all_teachers.length).toEqual(teachers.length)
})

it('Get all teachers successfully based on limit and page filter', async () => {

    await addTeachers()

    //make get request to get all teachers
    const res = await makeRequest({ page: 1, limit: 4 })
    expect(res.body.rows.length).toEqual(4)

    const res2 = await makeRequest({ page: 2, limit: 4 })
    //second page should contain the 3 left students
    expect(res2.body.rows.length).toEqual(3)

    //check if responses contain 4 teachers
    const all_teachers = await Teacher.findAll({ where: {} })
    expect(all_teachers.length).toEqual(teachers.length)
})

it('Get teachers sorted based on their first name', async () => {
    await addTeachers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 2
    })

    const sortedTeacehrs: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original teachers array based on firstName field 
    //and check if the array equals to the one gets from the request
    //finally sort the teacherSlice based on firstName and get first 4 results
    const teachersSlice = checkSort(teachers, 'firstName', 'ASC')
    expect(teachersSlice).toEqual(sortedTeacehrs)

    //now sort the teachers based on firstName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 2,
        sortDir: 'DESC'
    })
    const sortedTeachersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const teachersSliceDESC = checkSort(teachers, 'firstName', 'DESC')

    expect(sortedTeachersDESC).toEqual(teachersSliceDESC)
})


it('Get teachers sorted based on their last name', async () => {
    await addTeachers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 3
    })

    const sortedTeachers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original teachers array based on lastName field 
    //and check if the array equals to the one gets from the request
    //finally sort the teacherSlice based on lastName and get first 4 results
    const sortedTeachersOriginal = checkSort(teachers, 'lastName', 'ASC')
    expect(sortedTeachers).toEqual(sortedTeachersOriginal)

    //now sort the teachers based on lastName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 3,
        sortDir: 'DESC'
    })
    const sortedTeachersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const teachersSliceDESC = checkSort(teachers, 'lastName', 'DESC')

    expect(sortedTeachersDESC).toEqual(teachersSliceDESC)
})


it('Get teachers sorted based on their email', async () => {
    await addTeachers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 4
    })

    const sortedTeachers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original teachers array based on lastName field 
    //and check if the array equals to the one gets from the request
    //finally sort the teacherSlice based on lastName and get first 4 results
    const sortedTeachersOriginal = checkSort(teachers, 'email')
    expect(sortedTeachers).toEqual(sortedTeachersOriginal)

    //now sort the teachers based on lastName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 4,
        sortDir: 'DESC'
    })
    const sortedTeachersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const teachersSliceDESC = checkSort(teachers, 'email', 'DESC')

    expect(sortedTeachersDESC).toEqual(teachersSliceDESC)
})

it('filter teachers based on their endDate', async () => {
    await addTeachers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        endDate: true
    })

    const filteredTeachers: string[] = body.rows
        .filter((t: TeacherAttributes) => !t.endDate)
        .length

    //response shouldn't return any teacher that has endDate set to null
    expect(filteredTeachers).toEqual(0)

})

it('Get teachers based on search filter', async () => {

    await addTeachers()

    const search = [{
        search: 'le',
        searchRegex: /le/i
    }, {
        search: 'le%g',
        searchRegex: /le.*g/i
    }]

    const res1 = await makeRequest({
        page: 1,
        limit: 4,
        search: search[0].search
    })
    checkSearch((res1.body.rows) as TeacherAttributes[], search[0].searchRegex)

    const res2 = await makeRequest({
        page: 1,
        limit: 4,
        search: search[1].search
    })
    checkSearch((res2.body.rows) as TeacherAttributes[], search[1].searchRegex)
})



it('Get teachers sorted based on their phone', async () => {
    await addTeachers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 10,
        sort: 5
    })

    const phones: string[] = body.rows.map((t: TeacherUser) => t.User.phone)

    // Check if nulls are first
    let i = 0;
    while (i < phones.length && phones[i] === null) {
        i++;
    }

    // Now from index i to end, all phones must be non-null and sorted
    const remainingPhones = phones.slice(i);


    const isSorted = remainingPhones.every((phone, index, arr) => {
        return index === 0 || arr[index - 1].localeCompare(phone) <= 0
    })

    expect(isSorted).toBe(true)
})


// it('Get teachers sorted based on their phone', async () => {
//     await addTeachers()

//     //make get request to get all teachers
//     const { body } = await makeRequest({
//         page: 1,
//         limit: 4,
//         sort: 5
//     })

//     const sortedTeachers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

//     //sort the original teachers array based on phone field
//     //and check if the array equals to the one gets from the request
//     //finally sort the teacherSlice based on phone and get first 4 results
//     const sortedTeachersOriginal = checkSort(teachers, 'phone')
//     expect(sortedTeachers).toEqual(sortedTeachersOriginal)

//     //now sort the teachers based on phone on descending order
//     const { body: body2 } = await makeRequest({
//         page: 1,
//         limit: 4,
//         sort: 5,
//         sortDir: 'DESC'
//     })
//     const sortedTeachersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
//     const teachersPhoneDESC = checkSort(teachers, 'phone', 'DESC')

//     console.log(`Array sorted by JS: ${teachersPhoneDESC.join(', ')}`);
//     console.log(`Array returned from teachers service: ${sortedTeachersDESC.join(', ')}`);
//     expect(sortedTeachersDESC).toEqual(teachersPhoneDESC)
// })

