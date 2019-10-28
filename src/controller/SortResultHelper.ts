import {ICourseDataset, IResultObj} from "./IDataset";

interface IndexableObject {
    [key: string]: any;
}

function sortByOneThing(resultArray: IndexableObject[], keyToSortBy: string, typeOfKey: string, dir: string) {
    let directionVal = 1;
    if (dir === "DOWN") {
        directionVal = -1;
    }
    if (typeOfKey === "number") {
        // sort by numerical order of that column:
        resultArray.sort((a, b) => {
            let aObj: IndexableObject = a;
            let bObj: IndexableObject = b;
            let aNum: number = Number(aObj[keyToSortBy]);
            let bNum: number = Number(bObj[keyToSortBy]);
            return (aNum - bNum) * directionVal;
        });
    } else {
        // sort by alphabetical order of that column:
        resultArray.sort((a, b) => {
            let aObj: IndexableObject = a;
            let bObj: IndexableObject = b;
            let aStr: string = String(aObj[keyToSortBy]);
            let bStr: string = String(bObj[keyToSortBy]);
            return bStr > aStr ? -directionVal : directionVal;
        });
    }
}
// assume that: each object in resultArray has a key corresponding to the entries of columns
//              dir is one of: "UP" or "DOWN"
//              sortBy is a subset of columns
//              resultArray has at least one entry
export function sortResultHelper(resultArray: IndexableObject[], sortBy: string[], dir: string) {
    // Assuming that the default .sort is stable (It might be!)
    // We need to know the types of each of the things in
    let types: string[] = [];
    for (let key of sortBy) {
        types.push(typeof resultArray[0][key]);
    }
    for (let i = sortBy.length - 1; i >= 0; i--) {
        sortByOneThing(resultArray, sortBy[i], types[i], dir);
    }
}
