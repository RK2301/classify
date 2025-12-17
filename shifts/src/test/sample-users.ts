import { UserRole } from "@rkh-ms/classify-lib";
import { UserMainAttributes } from "../models/user";

/**array of 5 users to be used with tests */
export const sampleUsers: UserMainAttributes[] = [
    {
        id: "123456789",
        firstName: "Nora",
        lastName: "Levy",
        email: "nora.levy@example.com",
        phone: "0521234567",
        role: UserRole.Teacher,
        version: 0
    },
    {
        id: "987654321",
        firstName: "Adam",
        lastName: "Cohen",
        email: "adam.cohen@example.com",
        phone: "0537654321",
        role: UserRole.Manager,
        version: 0
    },
    {
        id: "246813579",
        firstName: "Lina",
        lastName: "Sharif",
        email: "lina.sharif@example.com",
        phone: "0542468135",
        role: UserRole.Teacher,
        version: 0
    },
    {
        id: "135792468",
        firstName: "Omer",
        lastName: "Mizrahi",
        email: "omer.mizrahi@example.com",
        phone: "0551357924",
        role: UserRole.Manager,
        version: 0
    },
    {
        id: "192837465",
        firstName: "Salma",
        lastName: "Khoury",
        email: "salma.khoury@example.com",
        phone: "0561928374",
        role: UserRole.Teacher,
        version: 0
    }
];