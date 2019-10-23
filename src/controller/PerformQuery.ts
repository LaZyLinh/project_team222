import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import {ICourse, ICourseDataset, IDatabase, ImKeyEntry, IResultObj} from "./IDataset";
import {validateIDString} from "./AddDatasetHelpers";
import {findArray} from "./FindArray";

function MultHelper(key: string, result: number[], clause: any, dataset: ICourseDataset) {
    if (key === "AND") {
        if (!Array.isArray(result) || !result.length) {
            result = performValidQuery(clause, dataset);
        } else {
            let temp = performValidQuery(clause, dataset);
            result = [...new Set(temp.filter((value) =>
                result.includes(value)))]; // might not have to Set
        }
    } else {
        if (!Array.isArray(result) || !result.length) {
            result = performValidQuery(clause, dataset);
        } else {
            let array: number[] = performValidQuery(clause, dataset);
            result = result.concat(array);
            result = [...new Set(result)];
        }
    }
    return result;
}

export function performValidQuery(query: any, dataset: ICourseDataset): number[] {
    const mult = ["AND", "OR"];
    const mSingle = ["GT", "LT", "EQ"];
    const sSingle = ["IS"];
    const neg = "NOT";
    let result: number[] = [];

    if (query === null || typeof query !== "object") {
        return result;
    }
    if (Array.isArray(Object.keys(query))) {
        for (const [key, more] of Object.entries(query)) {
            if (key === neg) {
                let fullSet = Array.from(Array(dataset.numRows).keys());   // create array [1, 2, .. numRows]
                const tmp: number[] = performValidQuery(more, dataset);
                result = fullSet.filter((value) => !tmp.includes(value));
                continue;
            }
            if (mult.includes(key) && Array.isArray(more)) {
                for (const clause of more) {
                    result = MultHelper(key, result, clause, dataset);
                }
                continue;
            }
            // if (mSingle.includes(key) || sSingle.includes(key)) {
            for (const [field, value] of Object.entries(query[key])) {
                let tmResult = typeMatchValidID(field);
                if (tmResult !== null) {
                    const compared = tmResult[2];
                    // if (result.length === 0) {
                    //    result = findArray(compared, key, value, dataset);
                    // } else {
                    result = [...new Set(findArray(compared, key, value, dataset))];
                }
            }
        }
    }
    return result;
}

export function validateQuery(query: any): null | string {
    let dataID: string;
    if (!query.hasOwnProperty("WHERE")) {
        return null;
    } else if (!query.hasOwnProperty("OPTIONS")) {
        return null;
    } else if (!query["OPTIONS"].hasOwnProperty("COLUMNS")) {
        return null;
    }
    const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
    const optionCont = query["OPTIONS"];
    const columnCont = optionCont["COLUMNS"]; // should be string[]

    if (whereCont === null || optionCont === null || columnCont === null) {
        return null;
    }
    // dealing with OPTION section
    let test = correctOption(columnCont, optionCont);
    if (test === null) {
        return null;
    } else {
        dataID = test;
    }
    // dealing with WHERE section
    if (Object.keys(whereCont).length !== 0) {            // if WHERE: {}, all good!
        if (this.whereHandler(whereCont, dataID) > 0) {
            return null;
        } else {
            return dataID;
        }
    }
    return dataID;
}

export function correctOption(columnCont: string[], optionCont: any): null | string {
    if (Array.isArray(columnCont) && columnCont.length === 0) {
        return null;
    }
    let id = null;
    for (const value of columnCont) {
        if (value === null || typeMatchValidID(value) === null) {
            return null;
        } else {
            if (id === null) {
                id = typeMatchValidID(value)[1];
            } else {
                if (typeMatchValidID(value)[1] !== id) {
                    return null;
                }
            }
        }
    }
    if (Object.entries(optionCont).length > 2) {
        return null;
    } else if (Object.entries(optionCont).length > 1) {
        if (!optionCont.hasOwnProperty("ORDER")) {
            return null;
        }
        if (Array.isArray(optionCont["ORDER"])) {
            return null;
        }
        if (!columnCont.includes(optionCont["ORDER"])) {
            return null;
        }

    }

    return id;
}

export function whereHandler(item: any, dataID: string): number {
    const mult = ["AND", "OR"];
    const mSingle = ["GT", "LT", "EQ"];
    const sSingle = ["IS"];
    const neg = "NOT";
    let anyFalse = 0;
    if (item !== null && typeof item === "object") {
        if (Array.isArray(Object.keys(item))) {
            for (const [key, more] of Object.entries(item)) {
                if (Object.keys(item).length > 1) {
                    anyFalse++;
                    break;
                }
                if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key) && key !== neg) {
                    anyFalse++;
                    break;
                }
                if (more === null || Object.entries(more).length === 0) {
                    anyFalse++;
                    break;
                }
                if (mult.includes(key)) {
                    if (Array.isArray(more)) {
                        for (const clause of more) {
                            anyFalse += this.whereHandler(clause, dataID);
                        }
                    } else {
                        anyFalse += this.whereHandler(more, dataID);
                    }
                }
                if (key === neg) {
                    if (Object.entries(more).length > 1 || Array.isArray(more)) {
                        anyFalse++;
                        break;
                    }
                    anyFalse += this.whereHandler(more, dataID);
                }
                if (mSingle.includes(key) || sSingle.includes(key)) {
                    if (Object.entries(more).length > 1 || Array.isArray(more)) {
                        anyFalse++;
                        break;
                    }
                    if (anyFalseSingle(item, key, dataID) > 0) {
                        anyFalse++;
                        break;
                    }
                }
            }
        }
    }
    return anyFalse;
}

export function anyFalseSingle(item: any, key: string, dataID: string): number {
    const mSingle = ["GT", "LT", "EQ"];

    for (const [field, value] of Object.entries(item[key])) {
        let typeValid = typeMatchValidID(field);
        if (typeValid === null) {
            return 1;
        } else {
            if (typeValid[1] !== dataID) {
                return 1;
            }
        }
        if (mSingle.includes(key)) {
            if (typeValid[0] !== "number" || !valueMatchKey([field, value])) {
                return 1;
            }
        } else {
            if (typeValid[0] !== "string" || !valueMatchKey([field, value])) {
                return 1;
            }
            if (typeof value === "string" && !validateIS(value)) {
                return 1;
            }
        }
    }
}

export function validateIS(value: string): boolean {
    let match = value.match(/^[*]?[^*]*[*]?$/);
    if (match === null) {
        return false;
    } else {
        return /^[*]?[^*]*[*]?$/.test(value);
    }
}

export function valueMatchKey([key, value]: [string, any]) {
    let typeValid = typeMatchValidID(key);
    if (typeValid === null) {
        return false;
    }

    if (typeMatchValidID(key)[0] === "string") {
        if (value !== null && typeof value === "string") {
            return true;
        }
    }

    if (typeMatchValidID(key)[0] === "number") {
        if (value !== null && typeof value === "number") {
            return true;
        }
    }
    return false;
}

export function typeMatchValidID(key: string): string[] | null {        // returns [type, datasetID, field ie year/etc]
    let mRegex = [/_year$/, /_avg$/, /_pass$/, /_fail$/, /_audit$/];
    let sRegex = [/_dept$/, /_id$/, /_instructor$/, /_title$/, /_uuid$/];
    for (const rx of mRegex) {
        if (rx.test(key)) {
            let id = validateIDString(key.replace(rx, ""));
            if (typeof id === "string") {
                let comparedKey = key.replace(id + "_", "");
                return ["number", id, comparedKey];
            }
        }
    }
    for (const rx of sRegex) {
        if (rx.test(key)) {
            let id = validateIDString(key.replace(rx, ""));
            if (typeof id === "string") {
                let comparedKey = key.replace(id + "_", "");
                return ["string", id, comparedKey];
            }
        }
    }
    return null;
}

export function findDatasetById(database: IDatabase, id: string): InsightDataset {
    for (let dataset of database.datasets) {
        if (dataset.id === id) {
            return dataset;
        }
    }
    throw new InsightError("Dataset that should've been found, not found");
    // (because this method is only called when we already know the dataset exists and is loaded into memory.)
}

function buildResultObj(course: ICourse, columns: string[], id: string): IResultObj {
    let res: IResultObj = {};
    for (let key of columns) {
        res[id + "_" + key] = course[key];
    }
    return res;
}

export function formatResults(dataset: ICourseDataset, arr: number[], columns: string[], order: string): IResultObj[] {
    let res: IResultObj[] = [];
    let id: string = dataset.id;
    for (let index of arr) {
        res.push(buildResultObj(dataset.courses[index], columns, id));
    }
    if (order === "") {
        return res;
    }
    if (["year", "avg", "pass", "fail", "audit"].includes(order)) {
        // sort by numerical order of that column:
        let fieldName: string = id + "_" + order;
        res.sort((a, b) => {
            let aObj: IResultObj = a;
            let bObj: IResultObj = b;
            let aNum: number = Number(aObj[fieldName]);
            let bNum: number = Number(bObj[fieldName]);
            return aNum - bNum;
        });
    } else {
        // sort by alphabetical order of that column:
        let fieldName: string = id + "_" + order;
        res.sort((a, b) => {
            let aObj: IResultObj = a;
            let bObj: IResultObj = b;
            let aStr: string = String(aObj[fieldName]);
            let bStr: string = String(bObj[fieldName]);
            return bStr > aStr ? -1 : 1;
        });
    }
    return res;
}
