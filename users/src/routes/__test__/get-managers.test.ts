import request from "supertest";
import { app } from "../../app";
import { ManagerSpecificAttr, TeacherAttributes, TeacherSpecificAttr, UserAttributes, UserRole } from "@rkh-ms/classify-lib";
import { Teacher } from "../../models/teacher";
import { User } from "../../models/user";
import { Manager } from "../../models/manager";

interface ManagerAttributes extends TeacherAttributes {
    managerStartDate: string,
    managerEndDate?: string | null
}

interface TeacherQuery extends TeacherSpecificAttr {
    User: UserAttributes
}

/**interface describe returned result for select query on managers */
interface ManagerQuery extends ManagerSpecificAttr {
    Teacher: TeacherQuery
}

const managers: ManagerAttributes[] = [{
    id: '123456789',
    firstName: 'Rami',
    lastName: 'Khattab',
    email: 'rami.khattab0@gmail.com',
    phone: '0543957965',
    startDate: '2025-01-01',
    managerStartDate: '2025-01-10',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456788',
    firstName: 'Mark',
    lastName: 'Josan',
    email: 'mark.josan@gmail.com',
    startDate: '2024-10-01',
    endDate: '2025-02-05',
    managerStartDate: '2025-04-10',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456787',
    firstName: 'John',
    lastName: 'Cena',
    phone: '0507816718',
    email: 'john.cena@gmail.com',
    startDate: '2023-09-20',
    endDate: '2025-04-10',
    managerStartDate: '2024-12-10',
    managerEndDate: '2025-04-10',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456786',
    firstName: 'Ahmed',
    lastName: 'Alsarea',
    email: 'ahmed.alsarea@outlook.com',
    startDate: '2022-10-01',
    managerStartDate: '2024-11-29',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456785',
    firstName: 'Steve',
    lastName: 'Jobs',
    email: 'steve.jobs@google.com',
    startDate: '2025-02-10',
    managerStartDate: '2025-06-08',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456784',
    firstName: 'Bale',
    lastName: 'Gates',
    email: 'bale.gates@microsoft.com',
    phone: '0518162518',
    startDate: '2024-08-20',
    managerStartDate: '2024-12-30',
    role: UserRole.Manager,
    version: 1
}, {
    id: '123456783',
    firstName: 'Lee',
    lastName: 'Jae-yong',
    email: 'lee.yong@samsung.com',
    startDate: '2022-07-25',
    endDate: '2025-02-26',
    managerStartDate: '2024-12-10',
    role: UserRole.Manager,
    version: 1
}]

export const checkSearch = (filteredSearch: UserAttributes[], regex: RegExp, rows: UserAttributes[]) => {
    const filteredIds = filteredSearch.map(s => s.id)

    //filter rows of users based on firstName + lastName
    //and sort them based on their ID
    const filteredBasedOnSearch = [...rows]
        .filter(s => regex.test(s.firstName.toLowerCase() + ' ' + s.lastName.toLowerCase()))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 4)
        .map(s => s.id)

    expect(filteredIds)
        .toEqual(filteredBasedOnSearch)
}


/**function that add teachers from the array to the DB */
const addManagers = async () => {

    await User.bulkCreate(managers.map((user): UserAttributes => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: UserRole.Manager,
        version: 1
    })))

    await Teacher.bulkCreate(managers.map((teacher): TeacherSpecificAttr => ({
        id: teacher.id,
        startDate: teacher.startDate,
        endDate: teacher.endDate,
        version: 1
    })))

    await Manager.bulkCreate(managers.map((manager): ManagerSpecificAttr => ({
        id: manager.id,
        startDate: manager.managerStartDate,
        endDate: manager.managerEndDate,
        version: 1
    })))

}

/**function that make request to get all managers.
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
    const api = '/api/users/managers'
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
        .get("/api/users/managers")
        .send()
        .expect(401);
});

it("retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .get("/api/users/managers")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});

it('get all managers successfully', async () => {

    await addManagers()

    //make get request to get all managers
    const res = await makeRequest()

    expect(res.body.rows.length).toEqual(managers.length)

    //check if responses contain 2 teachers
    const all_managers = await Manager.findAll({ where: {} })
    expect(all_managers.length).toEqual(managers.length)
})

it('Get all managers successfully based on limit and page filter', async () => {

    await addManagers()

    //make get request to get all teachers
    const res = await makeRequest({ page: 1, limit: 4 })
    expect(res.body.rows.length).toEqual(4)

    const res2 = await makeRequest({ page: 2, limit: 4 })
    //second page should contain the 3 left students
    expect(res2.body.rows.length).toEqual(3)
})


it('Get managers sorted based on their first name', async () => {
    await addManagers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 2
    })

    const sortedManagers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original teachers array based on firstName field
    //and check if the array equals to the one gets from the request
    //finally sort the teacherSlice based on firstName and get first 4 results
    const managersSlice = checkSort(managers, 'firstName', 'ASC')
    expect(managersSlice).toEqual(sortedManagers)

    //now sort the teachers based on firstName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 2,
        sortDir: 'DESC'
    })
    const sortedManagersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const managersSliceDESC = checkSort(managers, 'firstName', 'DESC')

    expect(sortedManagersDESC).toEqual(managersSliceDESC)
})


it('Get managers sorted based on their last name', async () => {
    await addManagers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 3
    })

    const sortedManagers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original managers array based on lastName field
    //and check if the array equals to the one gets from the request
    //finally sort the teacherSlice based on lastName and get first 4 results
    const sortedManagersOriginal = checkSort(managers, 'lastName', 'ASC')
    expect(sortedManagers).toEqual(sortedManagersOriginal)

    //now sort the managers based on lastName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 3,
        sortDir: 'DESC'
    })
    const sortedManagersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const managersSliceDESC = checkSort(managers, 'lastName', 'DESC')

    expect(sortedManagersDESC).toEqual(managersSliceDESC)
})


it('Get managers sorted based on their email', async () => {
    await addManagers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 4
    })

    const sortedManagers: string[] = body.rows.map((t: TeacherAttributes) => t.id)

    //sort the original managers array based on email field
    //and check if the array equals to the one gets from the request
    //finally sort the managerSlice based on email and get first 4 results
    const sortedManagersOriginal = checkSort(managers, 'email')
    expect(sortedManagers).toEqual(sortedManagersOriginal)

    //now sort the teachers based on lastName on descending order
    const { body: body2 } = await makeRequest({
        page: 1,
        limit: 4,
        sort: 4,
        sortDir: 'DESC'
    })
    const sortedManagersDESC = body2.rows.map((t: TeacherAttributes) => t.id)
    const managersSliceDESC = checkSort(managers, 'email', 'DESC')

    expect(sortedManagersDESC).toEqual(managersSliceDESC)
})



it('filter managers based on their endDate', async () => {
    await addManagers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 4,
        endDate: true
    })

    const filteredManagers: string[] = body.rows
        .filter((t: TeacherAttributes) => !t.endDate)
        .length

    //response shouldn't return any teacher that has endDate set to null
    expect(filteredManagers).toEqual(0)
})


it('Get managers based on search filter', async () => {

    await addManagers()

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
    checkSearch((res1.body.rows) as ManagerAttributes[], search[0].searchRegex, managers)

    const res2 = await makeRequest({
        page: 1,
        limit: 4,
        search: search[1].search
    })
    checkSearch((res2.body.rows) as TeacherAttributes[], search[1].searchRegex, managers)
})



it('Get managers sorted based on their phone', async () => {
    await addManagers()

    //make get request to get all teachers
    const { body } = await makeRequest({
        page: 1,
        limit: 10,
        sort: 5
    })

    const phones: string[] = body.rows.map((t: ManagerQuery) => t.Teacher.User.phone)

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

