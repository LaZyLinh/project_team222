import {InsightDatasetKind} from "./IInsightFacade";
import {ICourse, ICourseDataset, IDatabase} from "./ICourseDataset";
import InsightFacade from "./InsightFacade";
import * as fs from "fs";

export function newDatasetHelper(newID: string, newKind: InsightDatasetKind): ICourseDataset {
    return {
        audit: [],
        avg: [],
        course_ids: [],
        courses: [],
        dept: [],
        fail: [],
        instructor: [],
        pass: [],
        title: [],
        uuid: [],
        year: [],
        kind: newKind,
        numRows: 0,
        id: newID,
    };
}

// TODO: write tests for me!
export function addCoursesToDataset(courses: ICourse[], dataset: ICourseDataset) {
    for (let course of courses) {
        let index = dataset.courses.push(course) - 1;
        // TODO: Add the key/val pairs to all of the other arrays in the dataset
    }
    dataset.numRows += courses.length;
}

// TODO: write tests for me!
// TODO: rewrite me, I don't know how to check the disk for things!
// returns a string array of the ID's of currently-added datasets, given an IDatabase
export function idListHelper(database: IDatabase): string[] {
    let res: string[] = [];
    for (let item of database.datasets) {
        res.push(item.id);
    }
    return res;
}

// TODO: write tests for me!
// given a course json file, generates an array of ICourse corresponding to it.
export function ICourseHelper(course: any): ICourse[] {
    let result: ICourse[] = [];
    if (!course.hasOwnProperty("result") || !Array.isArray(course.result)) {
        return result; // just skip it!
    }
    let neededKeys: { [index: string]: any; } = {
        Year: "string", // year -> Year
        Avg: "number", // avg -> Avg
        Pass: "number", // pass -> Pass
        Fail: "number", // fail -> Fail
        Audit: "number", // audit -> Audit
        Subject: "string", // dept -> Subject
        Course: "string", // id -> Course
        Professor: "string", // instructor -> Professor
        Title: "string", // title -> Title
        id: "number", // uuid -> id
    };
    for (let item of course.result) {
        let allValid: boolean = true;
        for (let key in neededKeys) {
            if (!item.hasOwnProperty(key) || typeof item[key] !== neededKeys[key]) {
                allValid = false;
            }
        }
        if (!allValid) {
            continue;
        }
        // so now we know that we have all the parameters that we need to do this... So let's do it.
        let newCourse: ICourse = {
            year: Number(item.Year),
            avg: item.Avg,
            pass: item.Pass,
            fail: item.Fail,
            audit: item.Audit,
            dept: item.Subject,
            id: item.Course,
            instructor: item.Professor,
            title: item.Title,
            uuid: String(item.id),
        };
        result.push(newCourse);
    }
    return result;
}

// Given a new dataset that has been created, persist it to disk
export function saveDatasetToDisk(dataset: ICourseDataset) {
    fs.writeFileSync("data/" + dataset.id, JSON.stringify(dataset), null);
    // TODO: should this be a async method call or 'sync', do we want to block the execution here until this is done?
}

// If the insightFacade doesn't already have a dataset with the given ID loaded,
// check the disk for it. If it's there, try to load it into memory.
export function loadFromDiskIfNecessary(infa: InsightFacade, id: string) {
    if (idsInDatabase(infa.database).indexOf(id) === -1) {
        loadDatasetFromDisk(infa, id);
    }
}

// Given an id, check if it's on the disk.
// If it is, load it into memory and store it in infa.database.datasets.
export function loadDatasetFromDisk(infa: InsightFacade, id: string): boolean {
    try {
        // fs.accessSync("data/" + id, fs.constants.F_OK);
        let data = fs.readFileSync("data/" + id, {encoding: "string"});
        // It exists on disk!
        let loadedDataset: ICourseDataset = JSON.parse(data);
        infa.database.datasets.push(loadedDataset);
        return true;
    } catch (err) {
        // It doesn't, so we can't read it.
        return false;
    }
}

export function loadAllFromDisk(infa: InsightFacade, id: string) {
    try {
        let fnames: string[] = fs.readdirSync("data/");
        for (let fname of fnames) {
            loadDatasetFromDisk(infa, fname);
        }
    } catch {
        return;
    }
}

// Given an id, check if it's on the disk. If it is,
// delete it from the disk.
export function deleteDatasetFromDisk(id: string): boolean {
    try {
        fs.accessSync("data/" + id, fs.constants.F_OK);
        // it's on the disk. Let's delete it.
        fs.unlinkSync("data/" + id);
        return true;
    } catch {
        return false;
    }
}

export function deleteAllFromDisk(infa: InsightFacade, id: string) {
    try {
        let fnames: string[] = fs.readdirSync("data/");
        for (let fname of fnames) {
            deleteDatasetFromDisk(fname);
        }
    } catch {
        return;
    }
}

// returns list of id strings corresponding to datasets currently in memory
export function idsInDatabase(database: IDatabase): string[] {
    let res: string[] = [];
    for (let item of database.datasets) {
        res.push(item.id);
    }
    return res;
}
