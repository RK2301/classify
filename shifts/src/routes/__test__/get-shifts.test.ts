import request from "supertest";
import { app } from "../../app";
import {
    PaginationResponse,
    Shift as ShiftAttr,
    UserRole
} from "@rkh-ms/classify-lib";
import dayjs from "dayjs";
import { Shift } from "../../models/shift";
import { Op, WhereOptions } from "sequelize";
import { User, UserMainAttributes } from "../../models/user";


/**This function return shifts based or a range
 * 
 * start of the month - range as date
 * 
 * end of the month - range as date
 */
const fetchShiftsInRange = async (start: Date, end: Date, conditions: WhereOptions<ShiftAttr> = {}) => {

    return await Shift.findAll({
        where: {
            startTime: {
                [Op.between]: [start, end]
            },
            ...conditions
        }
    })

}

/**this function return a range of 2 dates, one indicate start of the range and other the end
 * 
 * range decided based on month and year
 * 
 * e.g. month=8 and year=2025 will return 2025-08-01T00:00.000Z -> 2025-08-31T23:59.000Z as dates object
 * 
 * @param month number indicate the month start from 1 to 12
 */
const returnRangeDates = (month: number, year: number) => {

    if (month > 12 || month < 1)
        return null

    const rangeBasedOn = `${year}-${month < 10 ? `0${month}` : month}-01`

    const start = dayjs(rangeBasedOn).startOf('month').toDate()
    const end = dayjs(rangeBasedOn).endOf('month').toDate()

    return { start, end }
}


it("Retrun an error if the user not signed in", async () => {
    await request(app)
        .get("/api/shifts")
        .send()
        .expect(401);
});


it("Retrun an error if the user doesn't have permission", async () => {
    await request(app)
        .get("/api/shifts")
        .set("Cookie", global.signin({ role: UserRole.Student }))
        .send()
        .expect(403);
});


it('Get all shfits successfully', async () => {

    // make get request to get all teachers
    // shifts reutrn based on based month and year
    // or if not based then on the current month and year
    const res = await request(app)
        .get('/api/shifts')
        .query({
            m: 8,
            y: 2025
        })
        .set('Cookie', global.signin())
        .expect(200)

    const shifts = ((res.body) as PaginationResponse<ShiftAttr>).rows

    //fecth all relevant shifts from 08.2025
    const range = returnRangeDates(8, 2025)

    const db_shifts = await fetchShiftsInRange(range!.start, range!.end)

    expect(shifts.length).toEqual(db_shifts.length)
})


it('Get all shifts successfully based on limit and page filter', async () => {

    const limit = 4
    const month = 8
    const year = 2025

    //make get request to get all teachers
    const res = await request(app)
        .get('/api/shifts')
        .query({
            limit,
            m: month,
            y: year
        })
        .set('Cookie', global.signin())
        .expect(200)

    const shifts = (res.body as PaginationResponse<ShiftAttr>).rows

    const range = returnRangeDates(month, year)
    const db_shifts = await fetchShiftsInRange(range!.start, range!.end)

    /**max shifts can be returned per page
     * if shifts less than the limit then all must be retuned in the request
     * otherwise must return shifts up till limit value
     */
    const max_shifts_per_page = db_shifts.length > limit ? limit : db_shifts.length

    expect(shifts.length).toEqual(max_shifts_per_page)

})



it('Get shifts sorted based on start time', async () => {

    //make get request to get all teachers
    const { body } = await request(app)
        .get('/api/shifts')
        .set('Cookie', global.signin())
        .query({
            m: 8,
            y: 2025,
            sortDir: 'ASC'
        })
        .expect(200)

    const sortedShifts = (body as PaginationResponse<ShiftAttr>).rows

    // loop over the shifts and check if they are sorted based on their 
    // start time in ASC order
    const isSortedASC = sortedShifts
        .map(shift => new Date(shift.startTime))
        .every((startTime, index, array) => {
            return index === 0 || startTime >= array[index - 1]
        })

    expect(isSortedASC).toBe(true)
})


it('Get shifts sorted based on teachers id', async () => {

    //make get request to get all teachers
    const { body } = await request(app)
        .get('/api/shifts')
        .set('Cookie', global.signin())
        .query({
            m: 8,
            y: 2025,
            sort: 1
        })
        .expect(200)

    const sortedShifts = (body as PaginationResponse<ShiftAttr & { User: UserMainAttributes }>).rows

    // loop over the shifts and check if they are sorted based on  
    // teacher id in DESC order (the default order for this route)
    const isSortedDESC = sortedShifts
        .map(shift => shift.User.id)
        .every((id, index, array) => {
            return index === 0 || id <= array[index - 1]
        })

    expect(isSortedDESC).toBe(true)
})


it('filter shifts based on teachers id', async () => {

    const month = 8
    const year = 2025

    // get 2 teachers id and filter shifts based on their id
    const users = await User.findAll({
        limit: 2
    })

    const teachersId = users.map(user => user.dataValues.id)

    const { body } = await request(app)
        .get('/api/shifts')
        .query({
            m: month,
            y: year,
            teachers: teachersId.join(',')
        })
        .set('Cookie', global.signin())
        .expect(200)

    const teachers_shifts = (body as PaginationResponse<ShiftAttr>).rows

    // fetch from the DB all shifts related to these teachers
    const range = returnRangeDates(8, 2025)
    const db_shifts = await fetchShiftsInRange(range!.start, range!.end, {
        teacherId: {
            [Op.in]: teachersId
        }
    })

    expect(teachers_shifts.length).toEqual(db_shifts.length)
})


it('Make sure when teacher make a request only get his own shifts', async () => {

    // fetch one of the user data from the DB
    // user must be a teacher
    const users = await User.findAll({
        where: {
            role: UserRole.Teacher
        },
        limit: 1
    })
    const user = users[0]


    const { body } = await request(app)
        .get(`/api/shifts`)
        .query({
            m: 8,
            year: 2025
        })
        .set('Cookie', global.signin({
            id: user.dataValues.id,
            role: user.dataValues.role
        }))
        .expect(200)

    const teacher_shifts = (body as PaginationResponse<ShiftAttr>).rows

    //make sure every shift have teacher id (created by him)
    const isTeacherShifts = teacher_shifts.every(shift => shift.teacherId === user.dataValues.id)

    expect(isTeacherShifts).toBe(true)

})
