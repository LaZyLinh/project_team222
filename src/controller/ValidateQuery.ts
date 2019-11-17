import {validateIDString} from "./AddDatasetHelpers";
import {InsightDatasetKind} from "./IInsightFacade";
import {transformationValidation} from "./transValidation";


export function getFirstQueryId(query: any): null | string {
    if (!query.hasOwnProperty("OPTIONS") || query["OPTIONS"] === null ||
        !query["OPTIONS"].hasOwnProperty("COLUMNS") || query["OPTIONS"]["COLUMNS"] === null) {
        return null;
    }
    const columnCont = query["OPTIONS"]["COLUMNS"];
    if (!Array.isArray(columnCont)) {
        return null;
    }
    const firstKey = columnCont[0];
    if (typeof firstKey !== "string") {
        return null;
    }
    let idFinder = typeMatchValidID(firstKey, null);
    if (idFinder !== null) {
        return idFinder[1];
    }
    if (!query.hasOwnProperty("TRANSFORMATIONS") || query["TRANSFORMATIONS"] === null ||
        !query["TRANSFORMATIONS"].hasOwnProperty("APPLY") ||
        query["TRANSFORMATIONS"]["APPLY"] === null || typeof query["TRANSFORMATIONS"]["APPLY"] !== "object") {
        return null;
    }
    const apply = query["TRANSFORMATIONS"]["APPLY"];
    for (const obj of apply) {
        for (const [appKey, entry] of Object.entries(obj)) {
            if (appKey !== firstKey) {
                continue;
            }
            if (typeof entry !== "object" || Object.keys(entry).length > 1) {
                return null;
            }
            for (const [token, key] of Object.entries(entry)) {
                if (typeof key !== "string" || typeMatchValidID(key, null) === null) {
                    return null;
                }
                return typeMatchValidID(key, null)[1];
            }
        }
    }
    return null;
}

export function validateQuery(query: any, id: string, kind: InsightDatasetKind): string | null {
    let dataID: string;
    if (!query.hasOwnProperty("WHERE") || query["WHERE"] === null) {
        return null;
    } else if (!query.hasOwnProperty("OPTIONS") || query["OPTIONS"] === null) {
        return null;
    } else if (!query["OPTIONS"].hasOwnProperty("COLUMNS") || query["OPTIONS"]["COLUMNS"] === null) {
        return null;
    }
    const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
    const optionCont = query["OPTIONS"];
    const columnCont = optionCont["COLUMNS"]; // should be string[]
    // dealing with OPTION section
    let test = correctOption(optionCont, id, kind);
    if (test === null) {
        return null;
    } else {
        dataID = test[0];
    }
    let hasApplyKey = test[1];
    if (hasApplyKey && (!query.hasOwnProperty("TRANSFORMATIONS") || query["TRANSFORMATIONS"] === null)) {
        return null;
    }
    // dealing with WHERE section
    if (Object.keys(whereCont).length !== 0) {            // if WHERE: {}, all good!
        if (this.whereValidation(whereCont, dataID, kind) > 0) {
            return null;
        }
    }
    // deal with Transformation if it exists
    if (query.hasOwnProperty("TRANSFORMATIONS")) {
        if (query["TRANSFORMATIONS"] === null) {
            return null;
        }
        if (transformationValidation(query.TRANSFORMATIONS, columnCont, dataID, kind) > 0) {
            return null;
        }
    }
    return dataID;
}

export function correctOption(option: any, dataId: string, kind: InsightDatasetKind): [string, boolean] | null {
    const column = option["COLUMNS"];
    let hasApplykey = false;
    if (!Array.isArray(column) || column.length === 0) {
        return null;
    }
    for (const value of column) {
        if (value === null) {
            return null;
        }
        if (typeMatchValidID(value, kind) === null) {
            if (!/^[^_]+$/.test(value)) { // applyKey
                return null;
            } else {
                hasApplykey = true;
            }
        } else {
            if (typeMatchValidID(value, kind)[1] !== dataId) {
                return null;
            }
        }
    }
    if (Object.entries(option).length > 2) {
        return null;
    } else if (Object.entries(option).length > 1) {
        if (!option.hasOwnProperty("ORDER") || option["ORDER"] === null) {
            return null;
        }
        const order = option["ORDER"];
        if (orderValidation(order, column) > 0) {
            return null;
        }
    }
    return [dataId, hasApplykey];
}
function orderValidation(order: any, columnCont: string[]): number {
    if (order === null) {
        return 1;
    }
    if (Array.isArray(order)) {
        return 1;
    }
    if (typeof order !== "object" && typeof order !== "string") {
        return 1;
    }
    if (typeof order === "string") {
        if (!columnCont.includes(order)) {
            return 1;
        }
    } else {
        if (!order.hasOwnProperty("dir") || !order.hasOwnProperty("keys")) {
            return 1;
        }
        if (order["dir"] !== "UP" && order["dir"] !== "DOWN") {
            return 1;
        }
        if (!Array.isArray(order["keys"]) || order["keys"].length === 0) {
            return 1;
        }
        for (const key of order["keys"]) {
            if (!columnCont.includes(key)) {
                return 1;
            }
        }
    }
    return 0;
}
export function whereValidation(item: any, dataID: string, kind: InsightDatasetKind): number {
    const mult = ["AND", "OR"];
    const mSingle = ["GT", "LT", "EQ"];
    const sSingle = ["IS"];
    const neg = "NOT";
    let anyFalse = 0;
    if (item == null || typeof item !== "object") {
        return 1;
    }
    if (Array.isArray(Object.keys(item))) {
        if (Object.keys(item).length > 1) {
            return 1;
        }
        for (const [key, more] of Object.entries(item)) {
            if (key === null || more === null) {
                return 1;
            }
            if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key) && key !== neg) {
                return 1;
            }
            if (Object.entries(more).length === 0) {
                return 1;
            }
            if (mult.includes(key)) {
                if (!Array.isArray(more)) {
                    return 1;
                }
                for (const clause of more) {
                    anyFalse += this.whereValidation(clause, dataID, kind);
                }
            }
            if (key === neg) {
                if (Object.entries(more).length > 1 || Array.isArray(more)) {
                    return 1;
                }
                anyFalse += this.whereValidation(more, dataID, kind);
            }
            if (mSingle.includes(key) || sSingle.includes(key)) {
                if (Object.entries(more).length > 1 || Array.isArray(more)) {
                    return 1;
                }
                if (anyFalseSingle(item, key, dataID, kind) > 0) {
                    return 1;
                }
            }
        }
    }
    return anyFalse;
}
export function anyFalseSingle(item: any, key: string, dataID: string, kind: InsightDatasetKind): number {
    const mSingle = ["GT", "LT", "EQ"];

    for (const [field, value] of Object.entries(item[key])) {
        if (field === null || value === null) {
            return 1;
        }
        let typeValid = typeMatchValidID(field, kind);
        if (typeValid === null) {
            return 1;
        } else {
            if (typeValid[1] !== dataID) {
                return 1;
            }
        }
        if (mSingle.includes(key)) {
            if (typeValid[0] !== "number" || !valueMatchKey([field, value], kind)) {
                return 1;
            }
        } else {
            if (typeValid[0] !== "string" || !valueMatchKey([field, value], kind)) {
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
export function valueMatchKey([key, value]: [string, any], kind: InsightDatasetKind = InsightDatasetKind.Courses) {
    let typeValid = typeMatchValidID(key, kind);
    if (typeValid === null) {
        return false;
    }

    if (typeMatchValidID(key, kind)[0] === "string") {
        if (value !== null && typeof value === "string") {
            return true;
        }
    }

    if (typeMatchValidID(key, kind)[0] === "number") {
        if (value !== null && typeof value === "number") {
            return true;
        }
    }
    return false;
}
// returns [type, datasetID, field ie year/etc]
export function typeMatchValidID(key: string, kind: InsightDatasetKind | null): string[] | null {
    const coursesMRegex = [/_year$/, /_avg$/, /_pass$/, /_fail$/, /_audit$/];
    const roomsMRegex = [/_lat$/, /_lon$/, /_seats$/];
    const coursesSRegex = [/_dept$/, /_id$/, /_instructor$/, /_title$/, /_uuid$/];
    const roomsSRegex = [/_fullname$/, /_shortname$/, /_number$/, /_name$/, /_address$/,
        /_type$/, /_furniture$/, /_href$/];
    let mUsed: any[];
    let sUsed: any[];
    if (kind === null) {
        mUsed = coursesMRegex.concat(roomsMRegex);
        sUsed = coursesSRegex.concat(roomsSRegex);
    } else if (kind === InsightDatasetKind.Courses) {
        mUsed = coursesMRegex;
        sUsed = coursesSRegex;
    } else {
        mUsed = roomsMRegex;
        sUsed = roomsSRegex;
    }
    for (const rx of mUsed) {
        if (rx.test(key)) {
            let id = validateIDString(key.replace(rx, ""));
            if (typeof id === "string") {
                let comparedKey = key.replace(id + "_", "");
                return ["number", id, comparedKey];
            }
        }
    }
    for (const rx of sUsed) {
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
