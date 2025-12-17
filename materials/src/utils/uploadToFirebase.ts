import { v4 as uuidv4 } from "uuid"
import { bucket } from "../config/firebase"
import { pathToFile } from "./pathToFile"

/**This function upload a file to firebase storage 
 * 
 * * when file uploaded successfully, the path of the file will be returned
*/
export const uploadToFirebase = (file: Express.Multer.File, courseId: number, materialId: number) =>
    new Promise<string>(async (resolve, rejected) => {

        // create unique name for the file to avoid overwrite
        const fileName = pathToFile(courseId, materialId, `${uuidv4()}-${file.originalname}`)

        const blob = bucket.file(fileName)


        try {
            // upload the file to the bucket
            await blob.save(file.buffer, {
                metadata: {
                    contentType: file.mimetype
                }
            })

            resolve(fileName)

        } catch (err) {
            console.error(err);
            rejected(err)
        }
    })


