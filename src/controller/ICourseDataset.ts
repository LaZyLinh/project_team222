import {InsightDataset} from "./IInsightFacade";

export interface ICourse {
    [key: string]: string|number;
    year: number;
    avg: number;
    pass: number;
    fail: number;
    audit: number;
    dept: string;
    id: string;
    instructor: string;
    title: string;
    uuid: string;
}

export interface ICourseDataset extends InsightDataset {
    courses: ICourse[];
    year: ImKeyEntry[];
    avg: ImKeyEntry[];
    pass: ImKeyEntry[];
    fail: ImKeyEntry[];
    audit: ImKeyEntry[];
    dept: IsKeyEntry[];
    course_ids: IsKeyEntry[];
    instructor: IsKeyEntry[];
    title: IsKeyEntry[];
    uuid: IsKeyEntry[];
}

export interface IDatabase {
    datasets: ICourseDataset[];
}

export interface ImKeyEntry {
    courseIndex: number;
    mKey: number;
}

export interface IsKeyEntry {
    courseIndex: number;
    sKey: string;
}

export interface IResultObj {
    [key: string]: string|number;
    year?: number;
    avg?: number;
    pass?: number;
    fail?: number;
    audit?: number;
    dept?: string;
    id?: string;
    instructor?: string;
    title?: string;
    uuid?: string;
}
