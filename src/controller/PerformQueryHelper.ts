import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
// import InsightFacade from "./InsightFacade";
import {ICourse, ICourseDataset, IDatabase, IResultObj, IRoomDataset} from "./IDataset";
// import {validateIDString} from "./AddDatasetHelpers";
import {findArray} from "./FindArray";
import "./ValidateQuery";
import {typeMatchValidID} from "./ValidateQuery";

function MultHelper(key: string, result: number[], clause: any, dataset: InsightDataset) {
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

export function performValidQuery(query: any, dataset: InsightDataset): number[] {
    const kind: InsightDatasetKind = dataset.kind;
    const mult = ["AND", "OR"];
    // const mSingle = ["GT", "LT", "EQ"];
    // const sSingle = ["IS"];
    const neg = "NOT";
    let result: number[] = [];

    if (query === null || typeof query !== "object") {
        return result;
    }
    if (Array.isArray(Object.keys(query)) && Object.keys(query).length === 0) {
         return Array.from(Array(dataset.numRows).keys()); // edge case: empty WHERE should just return the
        // whole dataset.
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
                let tmResult = typeMatchValidID(field, kind);
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

export function formatResults(dataset: InsightDataset, arr: number[], columns: string[], order: string): IResultObj[] {
    let res: IResultObj[] = [];
    let id: string = dataset.id;
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (let index of arr) {
        res.push(buildResultObj(dataList[index], columns, id));
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
