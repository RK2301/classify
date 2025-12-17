
/**retrun a path to all material files as represented in the firebase storage
 * 
 * could be use to get paths for all material files, and mayble later delete them
 */
export const pathToMaterial = (courseId: number, materialId: number) =>
    `materials/course_${courseId}/material_${materialId}/`