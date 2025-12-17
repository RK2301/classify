import request from "supertest";
import path from 'path';

import { app } from "../app";
import { API } from "@rkh-ms/classify-lib/api";

const MaterialAPIS = API.materials

/**Update material by make request to upload new files to the material 
 * 
 * this function to be used in tests
*/
export const updateMaterial = async (materialId: number) =>
    await request(app)
        .patch(MaterialAPIS.update(materialId))
        .set('Cookie', global.signin())
        .attach('files', path.resolve(__dirname, './files/shifts.png'))
        .attach('files', path.resolve(__dirname, './files/teachers.png'))
        .expect(201)
