import {InsightDatasetKind} from "./IInsightFacade";
import {ICourseDataset, IRoomDataset} from "./IDataset";

export function groupResults(dataset: ICourseDataset | IRoomDataset, result: number[], group: string[]): any[] {
    let groupedResult: number[][] = [];
    let unique: any[][] = [];
    let dataList: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        dataList = (dataset as ICourseDataset).courses;
    } else {
        dataList = (dataset as IRoomDataset).rooms;
    }
    for (const courseIndex of result) {
        if (unique === []) {
            let newUnique = [];
            for (const key of group) {
                newUnique.push(dataList[courseIndex][key]);
            }
            unique.push(newUnique);
            groupedResult.push([courseIndex]);
            break;
        }
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

export function applyMax(dataset: ICourseDataset | IRoomDataset, indexGroup: number[], key: string): any[] {
    return [];
}
