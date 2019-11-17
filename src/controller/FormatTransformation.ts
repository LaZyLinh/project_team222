import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {ICourseDataset, IRoomDataset} from "./IDataset";
import Decimal from "decimal.js";
import {typeMatchValidID} from "./ValidateQuery";

export function groupResults(dataset: InsightDataset, result: number[], group: string[]): number[][] {
    let groupedResult: number[][] = [];
    let unique: any[][] = [];
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const courseIndex of result) {
        let uCount = 0;
        let matchFound = false;
        for (const u of unique) {
            let keyCount = 0;
            let isMatch = true;
            for (const key of group) {
                if (dataList[courseIndex][key] !== u[keyCount]) {
                    isMatch = false;
                    break;
                }
                keyCount++;
            }
            if (isMatch) {
                matchFound = true;
                groupedResult[uCount].push(courseIndex);
                break;
            }
            uCount++;
        }
        if (!matchFound) {
            let newUnique = [];
            for (const key of group) {
                newUnique.push(dataList[courseIndex][key]);
            }
            unique.push(newUnique);
            groupedResult.push([courseIndex]);
        }
    }
    return groupedResult;
}

export function getApplyList(apply: any, column: string[], kind: InsightDatasetKind, dataID: string): string[][] {
    let result = [];
    for (const obj of apply) {
        for (const [appKey, entry] of Object.entries(obj)) {
            if (!column.includes(appKey)) {
                break;
            }
            let newRule = [];
            newRule.push(appKey);
            for (const [token, key] of Object.entries(entry)) {
                newRule.push(token);
                newRule.push(key.replace(dataID + "_", ""));
            }
            result.push(newRule);
        }
    }
    return result;
}
export function applyMax(dataset: InsightDataset, indexGroup: number[], key: string): number {
    let max = 0;
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const index of indexGroup) {
        if (dataList[index][key] > max) {
            max = dataList[index][key];
        }
    }
    return max;
}

export function applyMin(dataset: InsightDataset, indexGroup: number[], key: string): number {
    let min: number = Number.MAX_VALUE;
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const index of indexGroup) {
        if (dataList[index][key] < min) {
            min = dataList[index][key];
        }
    }
    return min;
}

export function applySum(dataset: InsightDataset, indexGroup: number[], key: string): number {
    let sum = 0;
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const index of indexGroup) {
        sum += dataList[index][key];
    }
    return Number(sum.toFixed(2));
}

export function applyAvg(dataset: InsightDataset, indexGroup: number[], key: string): number {
    let sum = new Decimal(0);
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const index of indexGroup) {
        sum = sum.add(new Decimal(dataList[index][key]));
    }
    let avg = sum.toNumber() / indexGroup.length;
    return Number(avg.toFixed(2));
}

export function applyCount(dataset: InsightDataset, indexGroup: number[], key: string): number {
    let current: string[] | number[] = [];
    let count = 0;
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const index of indexGroup) {
        if (!current.includes(dataList[index][key])) {
            count++;
            current.push(dataList[index][key]);
        }
    }
    return count;
}

