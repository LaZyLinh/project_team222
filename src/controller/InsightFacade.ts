import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {JSZipObject} from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private database: IDatabase = {
        datasets: [],
    };

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    // tslint:disable-next-line:max-func-body-length
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        // by here we know the id string is valid
        let newZip = new JSZip(); // more files !
        return newZip.loadAsync(content, {base64: true})
            .then((zip) => {
                let filePromises: Array<Promise<string|void>> = [];
                zip.folder("courses").forEach((path: string, file: JSZipObject) => {
                    filePromises.push(file.async("text"));
                });
                return Promise.all(filePromises);
            }).then((res: string[]) => {
                // do something with the string body of each file. parse it! (or not)
                let newDataset: ICourseDataset = {
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
                    kind: InsightDatasetKind.Courses,
                    numRows: 0,
                    id: id,
                };
                for (content of res) {
                    try {
                        let course = JSON.parse(content);
                        let coursesData: ICourse[] = this.ICourseHelper(course);
                        this.addCoursesToDataset(coursesData, newDataset);
                    } catch (err) {
                        // parsing the json failed!
                        // but this is fine so long as not *all* of the json files fail. We'll see later.
                    }
                }
                if (newDataset.courses.length !== 0) {
                    this.database.datasets.push(newDataset);
                    return Promise.resolve();
                } else {
                    return Promise.reject(new InsightError("No valid courses in zip file."));
                }
            }).then((res) => {
                return this.idListHelper();
            }).catch((err) => {
                // okay what happened?
                return Promise.reject(new InsightError(err));
            });

        // return Promise.reject("Shouldn't have made it to here.");
    }

    private addCoursesToDataset(courses: ICourse[], dataset: ICourseDataset) {
        for (let course of courses) {
            let index = dataset.courses.push(course) - 1;
            // TODO: Add the key/val pairs to all of the other arrays in the dataset
        }
    }

    // returns a string array of the ID's of currently-added datasets
    private idListHelper(): string[] {
        let res: string[] = [];
        for (let item of this.database.datasets) {
            res.push(item.id);
        }
        return res;
    }

    // given a course json file, generates an array of ICourse corresponding to it.
    public ICourseHelper(course: any): ICourse[] {
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

    public removeDataset(id: string): Promise<string> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }

    private validateIDString(id: string): string | InsightError {
        if (id === null) {
            return new InsightError("ID String cannot be null");
        } else if (id === undefined) {
            return new InsightError("ID String cannot be undefined");
        } else if (id === "") {
            return new InsightError("ID String cannot be an empty string");
        } else if (/^\s*$/.test(id)) {
            return new InsightError("ID String cannot be all whitespace");
        } else if ( !/^[^_]*$/.test(id)) {
            return new InsightError("ID String cannot contain underscores");
        }
        return id;
    }
}

interface ICourse {
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

interface ICourseDataset extends InsightDataset {
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

interface IDatabase {
    datasets: ICourseDataset[];
}

interface ImKeyEntry {
    courseIndex: number;
    mKey: number;
}

interface IsKeyEntry {
    courseIndex: number;
    sKey: string;
}
