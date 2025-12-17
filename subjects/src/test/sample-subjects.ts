import { Subject } from "@rkh-ms/classify-lib/interfaces";

export const sampleSubjects: Omit<Subject, 'id' | 'version'>[] = [
    {
        en: "History",
        he: "היסטוריה",
        ar: "تاريخ"
    },
    {
        en: "Biology",
        he: "ביולוגיה",
        ar: "أحياء"
    },
    {
        en: "Geography",
        he: "גיאוגרפיה",
        ar: "جغرافيا"
    },
    {
        en: "Chemistry",
        he: "כימיה",
        ar: "كيمياء"
    },
    {
        en: "Literature",
        he: "ספרות",
        ar: "أدب"
    }
]