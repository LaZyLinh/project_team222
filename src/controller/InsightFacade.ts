import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {groupResults} from "./FormatTransformation";
import {ICourseDataset, IDatabase} from "./IDataset";
import {
    deleteDatasetFromDisk, getAddDatasetPromise,
    idListHelper, idsInMemory, loadAllFromDisk, loadFromDiskIfNecessary, validateIDString,
} from "./AddDatasetHelpers";
import {performValidQuery, findDatasetById, formatResults} from "./PerformQueryHelper";
import {validateQuery, getFirstQueryId} from "./ValidateQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    public database: IDatabase = {
        datasets: [],
    };

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let validatedId: string | InsightError = validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        for (let dataset of this.database.datasets) {
            if (dataset.id === id) {
                return Promise.reject(new InsightError("Invalid ID: id already in database"));
            }
        }
        // by here we know the id string is valid, so add the dataset
        return getAddDatasetPromise(kind, content, id, this.database.datasets).then((res) => {
            // then return a list of the added datasets.
            return idListHelper(this.database);
        }).catch((err) => {
            return Promise.reject(new InsightError(err));
        });
    }

    public removeDataset(id: string): Promise<string> {
        let validatedId: string | InsightError = validateIDString(id);
        if (validatedId instanceof InsightError) {
            return Promise.reject(validatedId);
        }
        let idIndex: number = idsInMemory(this.database).indexOf(id);
        if (idIndex > -1) {
            // remove the dataset
            let foundId: string = this.database.datasets[idIndex].id;
            this.database.datasets.splice(idIndex);
            deleteDatasetFromDisk(id); // because we still need to clear the disk!
            return Promise.resolve(foundId);
            // what if the dataset is on the disk? Just in case...
        } else if (deleteDatasetFromDisk(id)) {
                return Promise.resolve(id);
            } else {
            return Promise.reject(new NotFoundError("dataset id not found"));
        }
    }

    public performQuery(query: any): Promise <any[]> {
        return new Promise((resolve, reject) => {
            if (this.database.datasets === []) {
                reject(new InsightError("No Dataset added"));
                return;
            }
            const datasetID: string = getFirstQueryId(query);
            if (datasetID === null) {
                reject(new InsightError("Invalid Query"));
                return;
            }
            loadFromDiskIfNecessary(this, datasetID);
            if (!idsInMemory(this.database).includes(datasetID)) {
                reject(new InsightError("Dataset not found"));
                return;
            }

            let dataset: ICourseDataset = findDatasetById(this.database, datasetID) as ICourseDataset;
            let datasetType: InsightDatasetKind = dataset.kind;
            let temp = validateQuery(query, datasetType);
            if (temp === null || temp !== datasetID) {
                reject(new InsightError("Invalid Query"));
            }

            const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
            const optionCont = query["OPTIONS"];
            const columnCont = optionCont["COLUMNS"]
                .map((str: string) => str.replace(datasetID + "_", "")); // should be string[]

            const result = performValidQuery(whereCont, dataset); // return result of index

            if (result === []) {
                resolve([]);
                return;
            }

            if (result.length > 5000) {
                reject(new ResultTooLargeError());
                return;
            }
            /*let group = [];
            let apply = [];
            if (query.hasOwnProperty("TRANSFORMATIONS")) {
                group = query["TRANSFORMATIONS"]["GROUP"].map((str: string) => str.replace(datasetID + "_", ""));
              }*/
            let order: string;
            if ( typeof optionCont["ORDER"] === "string") {
                order = optionCont["ORDER"].replace(datasetID + "_", ""); // should be string
            }
            const finalResultArray = formatResults(dataset, result, columnCont, order);
            // const finalResultArray = groupResults(dataset, result, group);

            resolve(finalResultArray);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {
            loadAllFromDisk(this);
            let result: InsightDataset[] = [];
            for (let dataset of this.database.datasets) {
                let newObj: InsightDataset = {
                    id: dataset.id, kind: dataset.kind, numRows: dataset.numRows
                };
                result.push(newObj);
            }
            resolve(result);
        });
    }
}
