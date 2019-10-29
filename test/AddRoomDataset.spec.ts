import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import * as fs from "fs-extra";
import {deleteAllFromDisk} from "../src/controller/AddDatasetHelpers";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {expect} from "chai";

describe("Add room dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        rooms: "./test/data/rooms.zip",
        baddirRooms: "./test/data/baddirRooms.zip",
        noIndexRooms: "./test/data/noIndexRoom.zip",
        roomsbadgeo: "./test/data/roomsbadgeo.zip"
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

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a valid dataset and skip buildings with invalid geolocation results", function () {
        const id: string = "roomsbadgeo";
        const expected: string[] = [id];
        const expected2: string[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
            return insightFacade.listDatasets();
        }).then((res: InsightDataset[]) => {
            expect(res).to.deep.equal(expected2);
        }).catch((err: any) => {
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should reject a dataset which does not contain a directory called 'rooms'", function () {
        const id: string = "baddirRooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a dataset which does not contain an index file", function () {
        const id: string = "noIndexRooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });


});
