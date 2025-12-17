import { Shift as ShiftAttr } from "@rkh-ms/classify-lib"

/**type represent shift in test time
 * 
 * no start or end locations to be saved
 */
export type ShiftTestAttributes = Pick<ShiftAttr, 'id' | 'startTime' | 'endTime' | 'teacherId' | 'version'>
