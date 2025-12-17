
/**Return a path to file, as represents in the firebase storage
 * 
 * could be use to create a new path to file before upload it, so it preserve the current folder structure
 * 
 * @param file the name and type of the file, e.g. hello.pdf
 * @param courseId of the course to which the file related
 * @param materialId of the material that the file will be under it
 */
export const pathToFile = (courseId: number, materialId: number, file: string) =>
    `materials/course_${courseId}/material_${materialId}/${file}`