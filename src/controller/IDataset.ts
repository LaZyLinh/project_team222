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

export interface IRoom {
    [key: string]: string|number;
    fullname: string;
    shortname: string;
    number: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    seats: number;
    type: string;
    furniture: string;
    href: string;
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

export interface IRoomDataset extends InsightDataset {
    [key: string]: IsKeyEntry[]|ImKeyEntry[]|IRoom[]|string|number;
    rooms: IRoom[];
    fullname: IsKeyEntry[];
    shortname: IsKeyEntry[];
    number: IsKeyEntry[];
    name: IsKeyEntry[];
    address: IsKeyEntry[];
    lat: ImKeyEntry[];
    lon: ImKeyEntry[];
    seats: ImKeyEntry[];
    type: IsKeyEntry[];
    furniture: IsKeyEntry[];
    href: IsKeyEntry[];
}

export interface IDatabase {
    datasets: InsightDataset[];
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
