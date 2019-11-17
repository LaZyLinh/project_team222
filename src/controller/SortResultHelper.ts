import {ICourseDataset, IResultObj} from "./IDataset";

interface IndexableObject {
    [key: string]: any;
}
/*
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
 */

function getComparison(keyToSortBy: string,
                       typeOfKey: string,
                       dir: string): (a: IndexableObject, b: IndexableObject) => number {
    let directionVal = 1;
    if (dir === "DOWN") {
        directionVal = -1;
    }
    if (typeOfKey === "number") {
        // sort by numerical order of that column:
        return (a: IndexableObject, b: IndexableObject) => {
            let aNum: number = Number(a[keyToSortBy]);
            let bNum: number = Number(b[keyToSortBy]);
            return (aNum - bNum) * directionVal;
        };
    } else {
        // sort by alphabetical order of that column:
        return (a: IndexableObject, b: IndexableObject) => {
            let aStr: string = String(a[keyToSortBy]);
            let bStr: string = String(b[keyToSortBy]);
            return bStr > aStr ? -directionVal : directionVal;
        };
    }
}
// assume that: each object in resultArray has a key corresponding to the entries of columns
//              dir is one of: "UP" or "DOWN"
//              sortBy is a subset of columns
//              resultArray has at least one entry
export function sortResultHelper(resultArray: IndexableObject[], sortBy: string[], dir: string): IndexableObject[] {
    // Assuming that the default .sort is stable (It might be!)
    // We need to know the types of each of the things in
    let types: string[] = [];
    for (let key of sortBy) {
        types.push(typeof resultArray[0][key]);
    }
    let reverse: boolean = sortBy.length % 2 === 0;
    for (let i = sortBy.length - 1; i >= 0; i--) {
        // sortByOneThing(resultArray, sortBy[i], types[i], dir);
        // TODO: GET RID OF THIS WEIRD HACK WITH DIR
        if (reverse) {
            if (dir === "UP") {
                resultArray = mergeSort(resultArray, getComparison(sortBy[i], types[i],  "DOWN"));
            } else {
                resultArray = mergeSort(resultArray, getComparison(sortBy[i], types[i],  "UP"));
            }
        } else {
            resultArray = mergeSort(resultArray, getComparison(sortBy[i], types[i], dir));
        }
        reverse = !reverse;
    }
    return resultArray;
}

// FOR SOME REASON; this seems to be 'anti-stable'... so let's make a quick hack to get this working
// mergesort implementation adapted from
// https://stackoverflow.com/questions/1427608/fast-stable-sorting-algorithm-implementation-in-javascript
// because we needed a stable sorting algorithm
function mergeSort(arr: IndexableObject[],
                   cm: (a: IndexableObject, b: IndexableObject) => number): IndexableObject[] {
    if (arr.length < 2) {
        return arr;
    }
    let middle = Math.floor(arr.length / 2);
    let left   = arr.slice(0, middle);
    let right  = arr.slice(middle, arr.length);

    return merge(mergeSort(left, cm), mergeSort(right, cm), cm);
}

function merge(left: IndexableObject[],
               right: IndexableObject[],
               cm: (a: IndexableObject, b: IndexableObject) => number): IndexableObject[] {
    let result: IndexableObject[] = [];

    while (left.length && right.length) {
        if (cm(left[0], right[0]) <= 0) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
    while (left.length) {
        result.push(left.shift());
    }
    while (right.length) {
        result.push(right.shift());
    }
    return result;
}

// insertionSort grabbed from https://basarat.gitbooks.io/algorithms/content/docs/sorting/insertion.html
// because I needed a stable sorting algorithm to use!
function insertionSort<T>(
    array: T[],
    cmp: (a: T, b: T) => number
): T[] {
    let current: T;
    let j: number;
    for (let i = 1; i < array.length; i += 1) {
        current = array[i];
        j = i - 1;
        while (j >= 0 && cmp(array[j], current) > 0) {
            array[j + 1] = array[j];
            j -= 1;
        }
        array[j + 1] = current;
    }
    return array;
}
