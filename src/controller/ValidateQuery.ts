import {validateIDString} from "./AddDatasetHelpers";

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
        if (this.whereValidation(whereCont, dataID) > 0) {
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

export function whereValidation(item: any, dataID: string): number {
    const mult = ["AND", "OR"];
    const mSingle = ["GT", "LT", "EQ"];
    const sSingle = ["IS"];
    const neg = "NOT";
    let anyFalse = 0;
    if (item == null || typeof item !== "object") {
        return 1;
    }

    if (Array.isArray(Object.keys(item))) {
        for (const [key, more] of Object.entries(item)) {
            if (Object.keys(item).length > 1) {
                return 1;
            }
            if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key) && key !== neg) {
                return 1;
            }
            if (more === null || Object.entries(more).length === 0) {
                return 1;
            }
            if (mult.includes(key)) {
                if (!Array.isArray(more)) {
                    return 1;
                }
                for (const clause of more) {
                    anyFalse += this.whereValidation(clause, dataID);
                }
            }
            if (key === neg) {
                if (Object.entries(more).length > 1 || Array.isArray(more)) {
                    return 1;
                }
                anyFalse += this.whereValidation(more, dataID);
            }
            if (mSingle.includes(key) || sSingle.includes(key)) {
                if (Object.entries(more).length > 1 || Array.isArray(more)) {
                    return 1;
                }
                if (anyFalseSingle(item, key, dataID) > 0) {
                    return 1;
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
