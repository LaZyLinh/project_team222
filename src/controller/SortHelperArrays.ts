// Sorts the 'helper arrays' of the dataset after all entries have been added
import {ICourseDataset, ImKeyEntry, IsKeyEntry} from "./IDataset";

export function sortHelperArrays(dataset: ICourseDataset) {
    let promises: Array<Promise<boolean>> = [];
    getImKeyArrays(dataset).forEach((value) => {
        value.sort((a, b) => {
            let ask: ImKeyEntry = a;
            let bsk: ImKeyEntry = b;
            return bsk.mKey - ask.mKey;
        });
    });
    getIsKeyArrays(dataset).forEach((value) => {
        value.sort((a, b) => {
            let ask: IsKeyEntry = a;
            let bsk: IsKeyEntry = b;
            return bsk.sKey > ask.sKey ? -1 : 1;
        });
    });
}

export function getImKeyArrays(dataset: ICourseDataset): ImKeyEntry[][] {
    return [dataset.audit, dataset.avg, dataset.fail, dataset.pass, dataset.year];
}

export function getIsKeyArrays(dataset: ICourseDataset): IsKeyEntry[][] {
    return [dataset.course_ids, dataset.dept, dataset.instructor, dataset.title, dataset.uuid];
}
