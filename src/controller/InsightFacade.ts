import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
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
    saveDatasetToDisk, validateIDString,
} from "./AddDatasetHelpers";
import {validateQuery, performValidQuery} from "./PerformQuery";
import {sortHelperArrays} from "./SortHelperArrays";

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
        let validatedId: string | InsightError = validateIDString(id);
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
                    sortHelperArrays(newDataset);
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
        let validatedId: string | InsightError = validateIDString(id);
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

        if (validateQuery(query) === null) {
            return Promise.reject(new InsightError("Invalid Query"));
        }
        const datasetID: string = validateQuery(query);

        if (this.database.datasets === []) {
            return Promise.reject(new InsightError("No Dataset added"));
        }
        loadFromDiskIfNecessary(this, datasetID);
        if (!idsInMemory(this.database).includes(datasetID)) {
            return Promise.reject(new InsightError());
        }

        let dataset: ICourseDataset = this.database.datasets[0];    // TODO: find dataset
        const whereCont = query["WHERE"];
        const array = performValidQuery(whereCont, dataset);
        if (array === []) {
            return Promise.resolve(array);
        }

        if (array.length > 5000) {
            return Promise.reject(new ResultTooLargeError());
        } // return array of index

        // TODO: turn index array into actual result array of courses, then return
        return Promise.resolve(array);

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
}
