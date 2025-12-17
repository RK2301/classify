import { MaterialKeys } from "@rkh-ms/classify-lib/enums";
import { Material as MaterialAttrs } from "@rkh-ms/classify-lib/interfaces";
import { sampleCourses } from "./sample-courses";
import dayjs from "dayjs";


/** create a material for each one of the courses */
export const sampleMaterials: Omit<MaterialAttrs, MaterialKeys.ID | 'version'>[] = sampleCourses.map(course => ({
    courseId: course.id,
    title: 'A material',
    description: 'a description',
    uploadAt: dayjs().format('YYYY-MM-DD')
}))