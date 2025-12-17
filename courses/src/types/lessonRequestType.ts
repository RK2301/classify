// This file export 2 interfaces describe the body request for add and update lesson request

import { LessonKeys } from "@rkh-ms/classify-lib/enums";


/** What post request should contain in order to add lesson successfully */
interface RequestBody {
    /**YYYY-MM-DD format */
    date: string,
    /**HH:MM format */
    [LessonKeys.START_TIME]: string,
    /**HH:MM format */
    [LessonKeys.END_TIME]: string
}

/**interface describes the request body for add new lesson request */
export interface AddLessonRequestBody extends RequestBody {
    [LessonKeys.COURSE_ID]: number,
}

/**interface describes the request body for update lesson request */
export interface UpdatedLessonRequestBody extends RequestBody {
    [LessonKeys.ID]: number
}