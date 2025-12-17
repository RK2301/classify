import { UserAttributes } from "@rkh-ms/classify-lib"
import { col, fn, Op, where, WhereOptions } from "sequelize"

/**this function return a where object that checks if search query contains 
 * in the first + last name of the user
 * @param search the search query to find if user full name contain
 */
export const userSearchWhere = (search: string) => {
    const whereUser: WhereOptions<UserAttributes> =
        where(fn('CONCAT', col('firstName'), ' ', col('lastName')), {
            [Op.like]: `%${search}%`
        })
    return whereUser
}