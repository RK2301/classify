import { TeacherAttributes, UserRole } from "@rkh-ms/classify-lib";

/**array of 5 users to be used with tests */
export const sampleTeachers: TeacherAttributes[] = [
    {
        id: "123456780",
        firstName: "Nora",
        lastName: "Levy",
        email: "nora.levy@example.com",
        phone: "0521234567",
        role: UserRole.Teacher,
        version: 1,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
    },
    {
        id: "987654321",
        firstName: "Adam",
        lastName: "Cohen",
        email: "adam.cohen@example.com",
        phone: "0537654321",
        role: UserRole.Manager,
        version: 1,
        startDate: '2025-02-01'
    },
    {
        id: "246813579",
        firstName: "Lina",
        lastName: "Sharif",
        email: "lina.sharif@example.com",
        phone: "0542468135",
        role: UserRole.Teacher,
        version: 1,
        startDate: '2024-07-01'
    },
    {
        id: "135792468",
        firstName: "Omer",
        lastName: "Mizrahi",
        email: "omer.mizrahi@example.com",
        phone: "0551357924",
        role: UserRole.Manager,
        version: 1,
        startDate: '2024-09-11'
    },
    {
        id: "192837465",
        firstName: "Salma",
        lastName: "Khoury",
        email: "salma.khoury@example.com",
        phone: "0561928374",
        role: UserRole.Teacher,
        version: 1,
        startDate: '2023-11-05',
        endDate: '2024-11-05'
    }
];