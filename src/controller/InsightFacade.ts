import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {ICourseDataset, IDatabase} from "./IDataset";
import {
    deleteDatasetFromDisk, getAddDatasetPromise,
    idListHelper, idsInMemory, loadAllFromDisk, loadFromDiskIfNecessary, validateIDString,
} from "./AddDatasetHelpers";
import {performValidQuery, findDatasetById, formatResults} from "./PerformQueryHelper";
import {validateQuery} from "./ValidateQuery";
import {sortHelperArrays} from "./SortHelperArrays";

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
        return getAddDatasetPromise(content, id, this.database.datasets).then((res) => {
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
            let temp = validateQuery(query);
            if (temp === null) {
                reject(new InsightError("Invalid Query"));
                return;
            }
            const datasetID: string = temp;

            if (this.database.datasets === []) {
                reject(new InsightError("No Dataset added"));
                return;
            }
            loadFromDiskIfNecessary(this, datasetID);
            if (!idsInMemory(this.database).includes(datasetID)) {
                reject(new InsightError("Dataset not found"));
                return;
            }

            let dataset: ICourseDataset = findDatasetById(this.database, datasetID) as ICourseDataset;
            const whereCont = query["WHERE"];   // make sure where only takes 1 FILTER and is the right type
            const optionCont = query["OPTIONS"];
            const columnCont = optionCont["COLUMNS"]
                .map((str: string) => str.replace(datasetID + "_", "")); // should be string[]
            let order = "";
            if ( typeof optionCont["ORDER"] === "string") {
                order = optionCont["ORDER"].replace(datasetID + "_", ""); // should be string
            }
            let array = [];
            if (Array.isArray(Object.keys(whereCont)) && Object.keys(whereCont).length === 0) {
                array = Array.from(Array(dataset.numRows).keys()); // edge case: empty WHERE should just return the
                // whole dataset.
            } else {
                array = performValidQuery(whereCont, dataset); // return array of index
            }

            if (array === []) {
                resolve([]);
                return;
            }

            if (array.length > 5000) {
                reject(new ResultTooLargeError());
                return;
            }

            const finalResultArray = formatResults(dataset, array, columnCont, order);

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
