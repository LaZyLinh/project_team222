import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import * as fs from "fs-extra";
import {deleteAllFromDisk} from "../src/controller/AddDatasetHelpers";
import {InsightDataset, InsightDatasetKind} from "../src/controller/IInsightFacade";
import {expect} from "chai";

describe("InsightFacade test disk persistence", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        deleteAllFromDisk();
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Added course datasets should be accessible from other instances of InsightFacade", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const expected2: InsightDataset[] = [{
            id: id,
            kind: InsightDatasetKind.Courses,
            numRows: 64612,
        }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            let insightFacade2: InsightFacade = new InsightFacade();
            return insightFacade2.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected2);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Added room datasets should be accessible from other instances of InsightFacade", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const expected2: InsightDataset[] = [{
            id: id,
            kind: InsightDatasetKind.Rooms,
            numRows: 364,
        }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            let insightFacade2: InsightFacade = new InsightFacade();
            return insightFacade2.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected2);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

});
