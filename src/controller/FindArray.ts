import {ICourseDataset, ImKeyEntry, IRoomDataset, IsKeyEntry} from "./IDataset";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";

function getImKeyArray(dataset: InsightDataset, compared: string): ImKeyEntry[] {
    if (dataset.kind === InsightDatasetKind.Courses) {
        let courseDataset: ICourseDataset = dataset as ICourseDataset;
        switch (compared) {
            case "year": {
                return courseDataset.year;
            }
            case "avg": {
                return courseDataset.avg;
            }
            case "pass": {
                return courseDataset.pass;
            }
            case "fail": {
                return courseDataset.fail;
            }
            case "audit": {
                return courseDataset.audit;
            }
        }
    } else {
        let roomDataset: IRoomDataset = dataset as IRoomDataset;
        switch (compared) {
            case "lat": {
                return roomDataset.lat;
            }
            case "lon": {
                return roomDataset.lon;
            }
            case "seats": {
                return roomDataset.seats;
            }
        }
    }
}

function getIsKeyArray(dataset: InsightDataset, compared: string): IsKeyEntry[] {
    if (dataset.kind === InsightDatasetKind.Courses) {
        let courseDataset: ICourseDataset = dataset as ICourseDataset;
        switch (compared) {
            case "dept": {
                return courseDataset.dept;
            }
            case "id": {
                return courseDataset.course_ids;
            }
            case "instructor": {
                return courseDataset.instructor;
            }
            case "title": {
                return courseDataset.title;
            }
            case "uuid": {
                return courseDataset.uuid;
            }
        }
    } else {
        let roomDataset: IRoomDataset = dataset as IRoomDataset;
        switch (compared) {
            case "fullname": {
                return roomDataset.fullname;
            }
            case "shortname": {
                return roomDataset.shortname;
            }
            case "number": {
                return roomDataset.number;
            }
            case "name": {
                return roomDataset.name;
            }
            case "address": {
                return roomDataset.address;
            }
            case "type": {
                return roomDataset.type;
            }
            case "furniture": {
                return roomDataset.furniture;
            }
            case "href": {
                return roomDataset.href;
            }
        }
    }
}

export function findArray(compared: string, comparison: string, value: any, dataset: InsightDataset):
    number[] {
    // By the time this function is reached, value = string for IS, else number
    if (typeof value === "number") {
        let datasetArray: ImKeyEntry[] = getImKeyArray(dataset, compared);
        if (comparison === "GT") {
            return greatHelper(datasetArray, value);
        } else if (comparison === "LT") {
            return lessHelper(datasetArray, value);
        } else if (comparison === "EQ") {
            return equalHelper(datasetArray, value);
        } else {
            throw new InsightError("bad 'comparison' in findArray");
        }
    } else {
        let datasetArray: IsKeyEntry[] = getIsKeyArray(dataset, compared);
        if (comparison === "IS") {
            return isHelper(datasetArray, value);
        } else {
            throw new InsightError("bad 'compared' in findArray");
        }
    }
    return [];
}

function isHelper(comparedArray: IsKeyEntry[], value: string): number[] {
    let result: number[] = [];
    let regex: RegExp;
    // if value is just string
    if (value.replace("*", "") === value) {
        regex = RegExp(value);
    } else {
        regex = RegExp("^" + value.replace(RegExp("[*]", "g"), ".*") + "$");
    }

    for (const s of comparedArray) {
        if (regex.test(s.sKey)) {
            result.push(s.courseIndex);
        }
    }
    return result;
}

function greatHelper(comparedArray: ImKeyEntry[], value: number): number[] {
    let result: number[] = [];
    for (const m of comparedArray) {
 //           if (m.mKey < value) {break; }
            if (m.mKey > value) {
                result.push(m.courseIndex);
            }
        }
    return result;
    }

function lessHelper(comparedArray: ImKeyEntry[], value: number): number[] {
    let result: number[] = [];
    for (let i = comparedArray.length - 1; i > -1; i--) {
 //       if (comparedArray[i].mKey > value) {break; }
        if (comparedArray[i].mKey < value) {
            result.push(comparedArray[i].courseIndex);
        }
    }
    return result;
}

function equalHelper(comparedArray: ImKeyEntry[], value: number): number[] {
    let result: number[] = [];
    // const middle = comparedArray[Math.floor(comparedArray.length / 2)].mKey;
    // if (value > middle) {
    for (const m of comparedArray) {
            /*if (m.mKey < value) {
                break;
            }*/
            if (m.mKey === value) {
                result.push(m.courseIndex);
            }
        }
    /* } else {
        for (let i = comparedArray.length - 1; i > -1; i--) {
            /*if (comparedArray[i].mKey > value) {
                break;
            }
            if (comparedArray[i].mKey === value) {
                result.push(comparedArray[i].courseIndex);
            }
        }
    } */
    return result;
}

// return the an array corresponding to the mKey.courseIndex's of the subset of the input array
// that is greater than 'value'
// assume that input is sorted in descending order.
/*
function sortedArrayGT(input: ImKeyEntry[], value: number): number[] {
    let i = 0;
    let k = input.length - 1;
    while (1) {
        let middle = (k - i) / 2;
        if (middle)
        // middle is either the correct point, too high, or too low:
        if (input[middle].mKey > value && input[middle + 1].mKey <= value) {
            // correct, everything below and including middle is > value
            return input.slice(0, middle).map((m: ImKeyEntry) => m.mKey);
        } else if (input[middle].mKey > value) {
            // incorrect, the point we want is past middle
            i = middle;
        } else {
            // incorrect, the point we want is before middle
            k = middle;
        }
    }
}
*/
