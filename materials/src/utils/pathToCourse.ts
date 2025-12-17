
/**retrun a path to all course materials as represented in the firebase storage
 * 
 * could be use to path to the course materials files, and delete them when a course deleted
 */
export const pathToCourse = (courseId: number) =>
    `materials/course_${courseId}/`