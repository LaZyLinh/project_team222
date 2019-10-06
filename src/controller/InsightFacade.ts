import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {queryParser} from "restify";
import * as fs from "fs";
import {JSZipObject} from "jszip";
import {ICourse, ICourseDataset, IDatabase} from "./ICourseDataset";
import {
    addCoursesToDataset, deleteDatasetFromDisk,
    ICourseHelper,
    idListHelper, idsInMemory, loadAllFromDisk, loadFromDiskIfNecessary,
    newDatasetHelper,
    saveDatasetToDisk,
} from "./AddDatasetHelpers";
import {validateQuery} from "./PerformQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    public database: IDatabase = {
        datasets: [],
    };

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        for (let dataset of this.database.datasets) {
            if (dataset.id === id) {
                return Promise.reject(new InsightError("Invalid ID: id already in database"));
            }
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
                let newDataset: ICourseDataset = newDatasetHelper(id, InsightDatasetKind.Courses);
                for (content of res) {
                    try {
                        let course = JSON.parse(content);
                        let coursesData: ICourse[] = ICourseHelper(course);
                        addCoursesToDataset(coursesData, newDataset);
                    } catch (err) {
                        // parsing the json failed!
                        // but this is fine so long as not *all* of the json files fail. We'll see later.
                    }
                }
                if (newDataset.courses.length !== 0) {
                    this.database.datasets.push(newDataset);
                    // sortHelperArrays(newDataset);
                    saveDatasetToDisk(newDataset);
                    return Promise.resolve();
                } else {
                    return Promise.reject(new InsightError("No valid courses in zip file."));
                }
            }).then((res) => {
                return idListHelper(this.database);
            }).catch((err) => {
                // okay what happened?
                return Promise.reject(new InsightError(err));
            });

        // return Promise.reject("Shouldn't have made it to here.");
    }

    public removeDataset(id: string): Promise<string> {
        let validatedId: string | InsightError = this.validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        let idIndex: number = idsInMemory(this.database).indexOf(id);
        if (idIndex > -1) {
            // remove the dataset
            let foundId: string = this.database.datasets[idIndex].id;
            this.database.datasets.splice(idIndex);
            deleteDatasetFromDisk(id); // because we still need to clear the disk!
            return Promise.resolve(foundId);
            // what if the dataset is on the disk? Just in case...
        } else if (deleteDatasetFromDisk(id)) {
                return Promise.resolve(id);
            } else {
            return Promise.reject(new NotFoundError("dataset id not found"));
        }
    }

    public performQuery(query: any): Promise <any[]> {
        let datasetID: string = "";

        // TODO: find datasetID
        if (!validateQuery(query)) {
            return Promise.reject(new InsightError("Invalid Query"));
        }
        if (this.database.datasets === []) {
            return Promise.reject(new InsightError("No Dataset added"));
        }
        loadFromDiskIfNecessary(this, datasetID);
        const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
        const optionCont = query["OPTIONS"];
        const columnCont = optionCont["COLUMNS"];

        return Promise.resolve([]);
        // let result = this.performQueryHelper(whereCont, datasetID);

    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {
            loadAllFromDisk(this);
            let result: InsightDataset[] = [];
            for (let dataset of this.database.datasets) {
                let newObj: InsightDataset = {
                    id: dataset.id, kind: dataset.kind, numRows: dataset.numRows
                };
                result.push(newObj);
            }
            resolve(result);
        });
    }

    public validateIDString(id: string): string | InsightError {
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
