import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

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
