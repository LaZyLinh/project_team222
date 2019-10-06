import {InsightError} from "./IInsightFacade";

export default class PerformQuery {
    public validateQuery(query: any): boolean {
        const mField = ["year", "avg", "pass", "fail", "audit"];
        const sField = ["dept", "id", "instructor", "title", "uuid"];

        if (!query.hasOwnProperty("WHERE")) {
            return false;
        } else if (!query.hasOwnProperty("OPTIONS")) {
            return false;
        } else if (!query["OPTIONS"].hasOwnProperty("COLUMNS")) {
            return false;
        }

        const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
        const optionCont = query["OPTIONS"];
        const columnCont = optionCont["COLUMNS"];   // should be string[]

        if (whereCont === null || optionCont === null || columnCont === null) {
            return false; }

        // dealing with OPTION section
        if (Array.isArray(columnCont) && columnCont.length === 0) {
            return false;
        }
        for (const value of columnCont) {
            if (this.typeOfKey(value) !== "string" && this.typeOfKey(value) !== "number") {
                return false;
            }
        }
        if (optionCont.hasOwnProperty("ORDER")) {
            if (Array.isArray(optionCont["ORDER"])) {
                return false;
            }
            if (this.typeOfKey(optionCont["ORDER"]) !== "string"
                && this.typeOfKey(optionCont["ORDER"]) !== "number") {
                return false;
            }
        }

        // dealing with WHERE section
        if (Object.keys(whereCont).length !== 0) {            // if WHERE: {}, all good!
            if (this.whereHandler(whereCont) > 0) {
                return false;
            } else {return true; }
        }
        return true;

    }

    public whereHandler(item: any): number {
        const mult = ["AND", "OR"];
        const mSingle = ["GT", "LT", "EQ"];
        const sSingle = ["IS"];
        const neg = "NOT";
        let anyFalse = 0;
        if (item !== null && typeof item === "object") {
            if (Array.isArray(Object.keys(item))) {
                for (const[key, more] of Object.entries(item)) {
                    if (!mSingle.includes(key) && !sSingle.includes(key) && !mult.includes(key) && key !== neg) {
                        anyFalse++;
                        break;
                    }
                    if (more === null || Object.entries(more).length === 0) {
                        anyFalse++;
                        break;
                    }
                    if (key === neg) {
                        if (Array.isArray(more)) {
                            anyFalse++;
                            break;
                        }
                        anyFalse += this.whereHandler(more);
                    }
                    if (mult.includes(key)) {
                        if (Array.isArray(more)) {
                            for (const clause of more) {
                                anyFalse += this.whereHandler(clause);
                            }
                        } else {anyFalse += this.whereHandler(more); }
                    }
                    if (mSingle.includes(key) || sSingle.includes(key)) {
                        for (const [field, value] of Object.entries(item[key])) {
                            if (mSingle.includes(key)) {
                                if (this.typeOfKey(field) !== "number" && !this.valueMatchKey([field, value])) {
                                    anyFalse++;
                                    break;
                                }
                            } else {
                                if (this.typeOfKey(field) !== "string" && !this.valueMatchKey([field, value])) {
                                    anyFalse++;
                                    break;
                                }
                            }
                        }
                    }
                }}
        }
        return anyFalse;
    }

    public valueMatchKey([key, value]: [string, any]) {
        if (this.typeOfKey(key) === "string") {
            if (value !== null && typeof value === "string") {
                return true;
            }
        }

        if (this.typeOfKey(key) === "number") {
            if (value !== null && typeof value === "number") {
                return true;
            }
        }
        return false;
    }

    public typeOfKey(key: string): string | null {
        let mRegex = [/_year$/, /_avg$/, /_pass$/, /_fail$/, /_audit$/];
        let sRegex = [/_dept$/, /_id$/, /_instructor$/, /_title$/, /_uuid$/];

        if (mRegex.some(function (rx) { return rx.test(key); })) {
            return "number";
        } else if (sRegex.some(function (rx) { return rx.test(key); })) {
            return "string";
        } else {
            return null;
        }

    }
}
