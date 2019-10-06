import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

/*
export function performQueryHelper(query: any, datasetID: string): number[] {
    const mult = ["AND", "OR"];
    const mSingle = ["GT", "LT", "EQ"];
    const sSingle = ["IS"];
    const neg = "NOT";
    let result: number[];

    if (query !== null && typeof query === "object") {
        if (Array.isArray(Object.keys(query))) {
            for (const[key, more] of Object.entries(query)) {
                if (key === neg) {
                    let fullSet = Array.from(Array(InsightFacade.database.datasets));
                    result.concat(this.performQueryHelper(more, datasetID));
                }
                if (mult.includes(key)) {
                    if (Array.isArray(more)) {
                        for (const clause of more) {
                            result.concat(this.performQueryHelper(clause, datasetID));
                        }
                    } else {result.concat(this.performQueryHelper(more, datasetID)); }
                }
                if (mSingle.includes(key) || sSingle.includes(key)) {
                    for (const [field, value] of Object.entries(query[key])) {
                        if (mSingle.includes(key)) {
                            if (this.typeOfKey(field) !== "number" && !this.valueMatchKey([field, value])) {
                                break;
                            }
                        } else {
                            if (this.typeOfKey(field) !== "string" && !this.valueMatchKey([field, value])) {
                                break;
                            }
                        }
                    }
                }
            }}
    }
    return result;
}
*/

export function validateQuery(query: any): boolean {
    let dataID: string;
    if (!query.hasOwnProperty("WHERE")) {
        return false;
    } else if (!query.hasOwnProperty("OPTIONS")) {
        return false;
    } else if (!query["OPTIONS"].hasOwnProperty("COLUMNS")) {
        return false;
    }
    const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
    const optionCont = query["OPTIONS"];
    const columnCont = optionCont["COLUMNS"]; // should be string[]

    if (whereCont === null || optionCont === null || columnCont === null) {
        return false;
    }
    // dealing with OPTION section
    let test = correctOption(columnCont, optionCont);
    if (test === null) {
        return false;
    } else { dataID = test; }
    // dealing with WHERE section
    if (Object.keys(whereCont).length !== 0) {            // if WHERE: {}, all good!
        if (this.whereHandler(whereCont, dataID) > 0) {
            return false;
        } else {
            return true;
        }
    }
    return true;
}

export function correctOption(columnCont: string[], optionCont: any): null | string {
    if (Array.isArray(columnCont) && columnCont.length === 0) {
        return null;
    }
    let id = null;
    for (const value of columnCont) {
        if (typeMatchValidID(value) === null) {
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

// tslint:disable-next-line:max-func-body-length
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
                    break; }
                if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key) && key !== neg) {
                    anyFalse++;
                    break; }
                if (more === null || Object.entries(more).length === 0) {
                    anyFalse++;
                    break; }
                if (mult.includes(key)) {
                    if (Array.isArray(more)) {
                        for (const clause of more) {anyFalse += this.whereHandler(clause, dataID); }
                    } else {anyFalse += this.whereHandler(more, dataID); }
                }
                if (key === neg) {
                    if (Object.entries(more).length > 1 || Array.isArray(more)) {
                        anyFalse++;
                        break; }
                    anyFalse += this.whereHandler(more, dataID); }
                if (mSingle.includes(key) || sSingle.includes(key)) {
                    if (Object.entries(more).length > 1 || Array.isArray(more)) {
                        anyFalse++;
                        break; }
                    if (anyFalseSingle(item, key, dataID) > 0) {
                        anyFalse++;
                        break;
                    }}}}}
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
                return 1; }
            if (typeof value === "string" && !validateIS(value)) {
                return 1; }
        }
    }
}
export function validateIS(value: string): boolean {
    let match = value.match(/[*]?[^*]*[*]?/);
    if (match === null) {
        return false;
    } else if (match[0] !== value) {
        return false;
    } else {return true; }
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

export function typeMatchValidID(key: string): string[] | null {
    let mRegex = [/_year$/, /_avg$/, /_pass$/, /_fail$/, /_audit$/];
    let sRegex = [/_dept$/, /_id$/, /_instructor$/, /_title$/, /_uuid$/];
    let result = [];
    for (const rx of mRegex) {
        if (rx.test(key)) {
            let id = validateIDString(key.replace(rx, ""));
            if (typeof id === "string") {
                return ["number", id];
            }
        }
    }
    for (const rx of sRegex) {
        if (rx.test(key)) {
            let id = validateIDString(key.replace(rx, ""));
            if (typeof id === "string") {
                return ["string", id];
            }
        }
    }
    return null;
}

export function validateIDString(id: string): string | InsightError {
    if (id === null) {
        return new InsightError("ID String cannot be null");
    } else if (id === undefined) {
        return new InsightError("ID String cannot be undefined");
    } else if (id === "") {
        return new InsightError("ID String cannot be an empty string");
    } else if (/^\s*$/.test(id)) {
        return new InsightError("ID String cannot be all whitespace");
    } else if ( !/^[^_]*$/.test(id)) {
        return new InsightError("ID String cannot contain underscores");
    }
    return id;
}
