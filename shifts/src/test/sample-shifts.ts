import { ShiftCreationAttributes } from "../models/shift";



/**This array contain a smaple shifts to use when test the services */
export const sampleShifts: ShiftCreationAttributes[] = [
    {
        id: '1',
        startTime: "2025-08-08T10:00:00Z",
        endTime: "2025-08-08T14:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "246813579"
    },
    {
        id: '2',
        startTime: "2025-08-06T10:00:00Z",
        endTime: "2025-08-06T14:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "246813579"
    },
    {
        id: '3',
        startTime: "2025-08-07T10:00:00Z",
        endTime: "2025-08-07T14:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "246813579"
    },
    {
        id: '4',
        startTime: "2025-08-07T08:00:00Z",
        endTime: "2025-08-07T12:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "192837465"
    },
    {
        id: '5',
        startTime: "2025-07-21T10:00:00Z",
        endTime: "2025-07-21T15:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "192837465"
    },
    {
        id: '6',
        startTime: "2025-07-25T10:00:00Z",
        endTime: "2025-07-25T15:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "192837465"
    },
    {
        id: '7',
        startTime: "2025-08-15T10:00:00Z",
        endTime: null,
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "246813579"
    },
    {
        id: '8',
        startTime: "2025-08-17T11:00:00Z",
        endTime: "2025-08-17T16:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "246813579"
    },
    {
        id: '9',
        startTime: "2025-08-15T10:00:00Z",
        endTime: "2025-08-15T16:00:00Z",
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "123456789"
    },
    {
        id: '10',
        startTime: "2025-08-16T14:00:00Z",
        endTime: null,
        startLocation: { type: 'Point', coordinates: [20.212, 30.212] },
        endLocation: null,
        teacherId: "123456789"
    }
];