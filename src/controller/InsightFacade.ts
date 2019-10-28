import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {applyAvg, applyCount, applyMax, applyMin, applySum, getApplyList, groupResults} from "./FormatTransformation";
import {ICourseDataset, IDatabase, IRoomDataset} from "./IDataset";
import {
    deleteDatasetFromDisk, getAddDatasetPromise,
    idListHelper, idsInMemory, loadAllFromDisk, loadFromDiskIfNecessary, validateIDString,
} from "./AddDatasetHelpers";
import {performValidQuery, findDatasetById, formatResults} from "./PerformQueryHelper";
import {validateQuery, getFirstQueryId, typeMatchValidID} from "./ValidateQuery";
import {sortResultHelper} from "./SortResultHelper";

function withTrans(query: any, groupedArray: number[][], dataset: InsightDataset, result: number[]) {
    let finalArray: any[] = [];
    let group = query["TRANSFORMATIONS"]["GROUP"];
    let apply = query["TRANSFORMATIONS"]["APPLY"];
    const optionCont = query["OPTIONS"];
    const columnCont = optionCont["COLUMNS"];
    group = group.map((str: string) =>
        str.replace(dataset.id + "_", ""));

    groupedArray = groupResults(dataset, result, group);
    let applyList: any;
    if (query["TRANSFORMATIONS"]["APPLY"].length !== 0) {
        applyList = makeApplyResult(apply, columnCont, dataset.kind, dataset.id, groupedArray, dataset);
    }
    // build the final grouping
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (let i = 0; i < groupedArray.length; i++) {
        let obj: { [k: string]: any } = {};
        for (const key of optionCont["COLUMNS"]) {
            if (typeMatchValidID(key, dataset.kind) !== null) {
                obj[key] = dataList[groupedArray[i][0]][typeMatchValidID(key, dataset.kind)[2]];
            } else {
                obj[key] = applyList[key][i];
            }
        }
        finalArray.push(obj);
    }
    if (optionCont.hasOwnProperty("ORDER")) {
        if (typeof optionCont["ORDER"] === "string") {
            finalArray = sortResultHelper(finalArray, [optionCont["ORDER"]], "UP");
        } else {
            finalArray = sortResultHelper(finalArray, optionCont["ORDER"]["keys"], optionCont["ORDER"]["dir"]);
        }
    }
    return finalArray;
}

function withoutTrans(query: any, finalArray: any[], dataset: InsightDataset, result: number[], columnCont: string[]) {
    const optionCont = query["OPTIONS"];
    let order: string = "";
    if (!optionCont.hasOwnProperty("ORDER")) {
        finalArray = formatResults(dataset, result, columnCont, "");
    } else { // has ORDER
        if (typeof optionCont["ORDER"] === "string") {
            order = optionCont["ORDER"].replace(dataset.id + "_", ""); // should be string
            finalArray = formatResults(dataset, result, columnCont, order);
        } else {
            finalArray = formatResults(dataset, result, columnCont, "");
            finalArray = sortResultHelper(finalArray, optionCont["ORDER"]["keys"], optionCont["ORDER"]["dir"]);
        }
    }
    return finalArray;
}

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
        // by here we know the id string is valid, so add the dataset
        return getAddDatasetPromise(kind, content, id, this.database.datasets).then((res) => {
            // then return a list of the added datasets.
            return idListHelper(this.database);
        }).catch((err) => {
            return Promise.reject(new InsightError(err));
        });
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
        return new Promise((resolve, reject) => {
            if (this.database.datasets === []) {
                return reject(new InsightError("No Dataset added"));
            }
            const datasetID: string = getFirstQueryId(query);
            if (datasetID === null) {
                return reject(new InsightError("Invalid Query"));
            }
            loadFromDiskIfNecessary(this, datasetID);
            if (!idsInMemory(this.database).includes(datasetID)) {
                return reject(new InsightError("Dataset not found"));
            }
            let dataset: InsightDataset = findDatasetById(this.database, datasetID);
            let kind: InsightDatasetKind = dataset.kind;
            let temp = validateQuery(query, kind);
            if (temp === null || temp !== datasetID) {
                return reject(new InsightError("Invalid Query"));
            }
            const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
            const optionCont = query["OPTIONS"];
            const columnCont = optionCont["COLUMNS"]
                .map((str: string) => str.replace(datasetID + "_", "")); // should be string[]
            const result = performValidQuery(whereCont, dataset); // return result of index
            if (result === []) {
                return resolve([]);
            }
            let groupedArray: number[][] = [];
            let finalArray: any[] = [];
            if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                if (result.length > 5000) {
                    return reject(new ResultTooLargeError());
                }
                finalArray = withoutTrans(query, finalArray, dataset, result, columnCont);
                return resolve(finalArray);
            }

            if (query.hasOwnProperty("TRANSFORMATIONS")) {
                finalArray = withTrans(query, groupedArray, dataset, result);
                if (finalArray.length > 5000) {
                    return reject(new ResultTooLargeError());
                }
                resolve(finalArray);
            }
        });
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

function makeApplyResult(apply: any, columnCont: string[], kind: InsightDatasetKind,
                         datasetID: string, groupedArray: number[][], dataset: InsightDataset): object {
    let applyList: string[][] = getApplyList(apply, columnCont, kind, datasetID);
    let applyResult: { [k: string]: any } = {};
    for (const rule of applyList) {
        let newRule: number[] = [];
        for (const array of groupedArray) {
            switch (rule[1]) {
                case "MAX": {
                    newRule.push(applyMax(dataset, array, rule[2]));
                    break;
                }
                case "MIN": {
                    newRule.push(applyMin(dataset, array, rule[2]));
                    break;
                }
                case "AVG": {
                    newRule.push(applyAvg(dataset, array, rule[2]));
                    break;
                }
                case "COUNT": {
                    newRule.push(applyCount(dataset, array, rule[2]));
                    break;
                }
                case "SUM": {
                    newRule.push(applySum(dataset, array, rule[2]));
                    break;
                }
            }
        }
        applyResult[rule[0]] = newRule;
    }
    return applyResult;
}
