import {InsightDatasetKind} from "./IInsightFacade";
import {typeMatchValidID} from "./ValidateQuery";

export function transformationValidation(trans: any, column: string[], dataID: string,
                                         kind: InsightDatasetKind): number {

    if (!trans.hasOwnProperty("GROUP") && trans.hasOwnProperty("APPLY")) {
        return 1;
    }
    if (trans.hasOwnProperty("GROUP") && !trans.hasOwnProperty("APPLY")) {
        return 1;
    }

    const group = trans["GROUP"];
    const apply = trans["APPLY"];

    if (!Array.isArray(group) || !Array.isArray(apply) || group.length === 0 || apply.length === 0) {
            return 1;
         }

    for (const value of group) {
        if (typeof value !== "string") {
            return 1;
        }

        if (typeMatchValidID(value, kind) === null || typeMatchValidID(value, kind)[1] !== dataID) {
            return 1;
        }
    }
    const applykeys = applyValidation(apply, kind, dataID);
    if (applykeys === null) {
        return 1;
    }
    const all: string[] = group.concat(applykeys);
    for (const key of column) {
        if (!all.includes(key)) {
            return 1;
        }
    }
    return 0;
}

function applyValidation(apply: any[], kind: InsightDatasetKind, dataID: string): null | string[] {
    let applyKeys: string[] = [];
    const applyToken = ["MAX", "MIN", "AVG", "SUM", "COUNT"];
    const numOnlyToken = ["MAX", "MIN", "AVG", "SUM"];
    for (const obj of apply) {
        if (obj === null || typeof obj !== "object") {
            return null;
        }
        for (const [name, entry] of Object.entries(obj)) {
            if (!/^[^_]+$/.test(name) || applyKeys.includes(name)) {
                return null;
            }
            if (typeof entry !== "object" || Object.keys(entry).length > 1) {
                return null;
            }
            for (const [key, value] of Object.entries(entry)) {
                if (!applyToken.includes(key)) {
                    return null;
                }
                if (typeof value !== "string" || typeMatchValidID(value, kind) === null) {
                    return null;
                }
                if (typeMatchValidID(value, kind)[1] !== dataID) {
                    return null;
                }
                if (numOnlyToken.includes(name) && typeMatchValidID(value, kind)[0] !== "number") {
                    return null;
                }
            }
            // here, the clauses are valid, so applykey is a good one
            applyKeys.push(name);
        }
    }
    return applyKeys;
}
