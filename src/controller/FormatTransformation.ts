import {InsightDatasetKind} from "./IInsightFacade";
import {ICourseDataset, IRoomDataset} from "./IDataset";

export function groupResults(dataset: ICourseDataset | IRoomDataset, result: number[], group: string[]): any[] {
    let groupedResult: any[];
    let unique: any[] = [];
    let entries: any;
    if (dataset.kind === InsightDatasetKind.Courses) {
        entries = (dataset as ICourseDataset).courses;
    } else {
        entries = (dataset as IRoomDataset).rooms;
    }
    if (unique === []) {
        let newUnique = [];
        for (const key of group) {
            newUnique.push(entries[result[0]][key]);
        }
        unique.push(newUnique);
    }

    for (const courseIndex of result) {
        let uCount = 0;
        for (const u of unique) {
            let keyCount = 0;
            let isMatch = true;
            for (const key of group) {
                if (entries[courseIndex][key] !== u[keyCount]) {
                    isMatch = false;
                    break;
                }
                keyCount++;
            }
            if (isMatch) {
                groupedResult[uCount].push(courseIndex);
                break;
            }
            uCount++;
        }
    }
    return groupedResult;
}
