import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {queryParser} from "restify";
import * as fs from "fs";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    // public code: number;
    // public val: any;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        // by here we know the id string is valid
        let newZip = new JSZip(); // more files !
        newZip.loadAsync(content, {base64: true})
            .then(function (zip) {
                // TODO: finish this!

                // you now have every files contained in the loaded zip
                // newZip.file("hello.txt").async("string"); // a promise of "Hello World\n"
            });
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise <any[]> {
        if (!this.validateQuery(query)) {
            const error = new InsightError("Invalid Query");
            return Promise.reject(error);
        }
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }

    // tslint:disable-next-line:max-func-body-length
    public validateQuery(query: any): boolean {
        const mField = ["year", "avg", "pass", "fail", "audit"];
        const sField = ["dept", "id", "instructor", "title", "uuid"];

        if (!query.hasOwnProperty("WHERE")) {
            return false;
        } else if (!query.hasOwnProperty("OPTIONS")) {
            return false;
        } else if (!query["OPTIONS"].hasOwnProperty("COLUMNS")) {
            return false;
        }

        const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
        const optionCont = query["OPTIONS"];
        const columnCont = optionCont["COLUMNS"];   // should be string[]

        // dealing with OPTION section
        if (Array.isArray(columnCont) && columnCont.length === 0) {
            return false;
        }
        for (const value of columnCont) {
            if (this.typeOfKey(value) !== "string" && this.typeOfKey(value) !== "number") {
                return false;
            }
        }
        if (optionCont.hasOwnProperty("ORDER")) {
            if (Array.isArray(optionCont["ORDER"])) {
                return false;
            }
            if (this.typeOfKey(optionCont["ORDER"]) !== "string"
                && this.typeOfKey(optionCont["ORDER"]) !== "number") {
                return false;
            }
        }

        // dealing with WHERE section
        if (Object.keys(whereCont).length !== 0) {            // if WHERE: {}, all good!
            if (this.whereHandler(whereCont) > 0) {
                return false;
            } else {return true; }
        }
        return true;

    }

    public whereHandler(item: any): number {
        const mult = ["AND", "OR"];
        const mSingle = ["GT", "LT", "EQ"];
        const sSingle = ["IS"];
        const neg = "NOT";
        let anyFalse = 0;
        if (item !== null && typeof item === "object") {
            if (Array.isArray(Object.keys(item))) {
                for (const[key, more] of Object.entries(item)) {
                    if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key)) {
                        anyFalse++;
                        break;
                    }
                    if (more === null || Object.entries(more).length === 0) {
                        anyFalse++;
                        break;
                    }
                    if (key === neg) {
                        if (Array.isArray(more)) {
                            anyFalse++;
                            break;
                        }
                        anyFalse += this.whereHandler(more);
                    }
                    if (mult.includes(key)) {
                        if (Array.isArray(more)) {
                            for (const clause of more) {
                                anyFalse += this.whereHandler(clause);
                            }
                        } else {anyFalse += this.whereHandler(more); }
                    } else {
                        for (const [field, value] of Object.entries(item[key])) {
                            if (mSingle.includes(key)) {
                                if (this.typeOfKey(field) !== "number" && !this.valueMatchKey([field, value])) {
                                    anyFalse++;
                                    break;
                                }
                            } else {
                                if (this.typeOfKey(field) !== "string" && !this.valueMatchKey([field, value])) {
                                    anyFalse++;
                                    break;
                                }}
                        }
                    }
                    }
                }
             }
        return anyFalse;
    }

    public valueMatchKey([key, value]: [string, any]) {
        if (this.typeOfKey(key) === "string") {
            if (value !== null && typeof value === "string") {
                return true;
            } else {
                return false;
            }
        } else if (this.typeOfKey(key) === "number") {
            if (value !== null && typeof value === "number") {
                return true;
            } else {return false; }
        } else {return false; }
    }

    public typeOfKey(key: string): string | null {
        let mRegex = [/_year$/, /_avg$/, /_pass$/, /_fail$/, /_audit$/];
        let sRegex = [/_dept$/, /_id$/, /_instructor$/, /_title$/, /_uuid$/];

        if (mRegex.some(function (rx) { return rx.test(key); })) {
            return "number";
        } else if (sRegex.some(function (rx) { return rx.test(key); })) {
            return "string";
        } else {
            return null;
        }

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
    datasets: InsightDataset[];
}

interface ImKeyEntry {
    courseIndex: number;
    mKey: number;
}

interface IsKeyEntry {
    courseIndex: number;
    sKey?: number;
}
