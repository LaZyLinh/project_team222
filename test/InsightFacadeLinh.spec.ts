import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        chin: "./test/data/chin.zip",                   // should add
        single: "./test/data/single.zip",               // should add
        coursesWimage: "./test/data/coursesWimage.zip", // should skip image file
        broken111: "./test/data/broken111.zip",         // should skip chin111
        empty: "./test/data/empty.zip",                 // should reject
        imageOnly: "./test/data/imageOnly.zip",         // should reject
        multDirectories: "./test/data/2directories.zip", // should reject
        wrongDirectories: "./test/data/courses2.zip",    // should reject
        brokenOnly: "./test/data/brokenOnly.zip",        // should reject
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
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should add multiple if not duplicate", function () {
        const id: string = "courses";
        const id2: string = "newCourses";
        const resultStr: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((response: string[]) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.equal(resultStr); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Could have whitespace in valid ID", function () {
        const id: string = "UBC courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should reject add null ID", function () {
        const id: string = "courses";
        return insightFacade.addDataset(null, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid null ID");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject add undefined ID", function () {
        const id: string = "courses";
        return insightFacade.addDataset(undefined, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail();
            }).catch((err) => {
                const error = new InsightError("Invalid undefined ID");
                expect(err).to.deep.equal(error);
            });
    });

    it("If add unsuccessful, error should be InsightError", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should reject empty string", function () {
        const id: string = "";
        const existId: string = "courses";
        return insightFacade.addDataset(id, datasets[existId], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with empty string");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject add invalid id with just whitespace", function () {
        const id: string = "   ";
        const existId: string = "courses";
        return insightFacade.addDataset(id, datasets[existId], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with whitespace");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject add invalid id with underscore", function () {
        const id: string = "courses_invalid";
        const existId: string = "courses";
        return insightFacade.addDataset(id, datasets[existId], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with underscore");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject duplicate add", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((response: string[]) => { // Note: response here comes from methodToRunSecond.
            expect.fail(); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            const error = new InsightError("Cannot add duplicated ID");
            expect(err).to.deep.equal(error);
        });
    });
    // Tests with new zips for addDataSet function
    it("Should accept add not duplicate, single file", function () {
        const id: string = "courses";
        const id2: string = "single";
        const expected: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((response: string[]) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.deep.equal(expected); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should accept add not duplicate, multiple file", function () {
        const id: string = "courses";
        const id2: string = "chin";
        const expected: string[] = [id, id2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((response: string[]) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.deep.equal(expected); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should add and skip 1 broken file", function () {
        const id: string = "broken111";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should add and skip 1 invalid file", function () {
        const id: string = "coursesWimage";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject add empty dataset", function () {
        const id: string = "empty";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject add dataset with only invalid files", function () {
        const id: string = "imageOnly";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject add dataset with only broken files", function () {
        const id: string = "brokenOnly";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject dataset with top folder not courses", function () {
        const id: string = "wrongDirectories";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject dataset with nested directories", function () {
        const id: string = "multDirectories";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail();
        }).catch((err) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });
    // Tests for removeDataSet
    it("Should return removed id once added", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response: string) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.deep.equal(id); // Depending if it was supposed to resolve or reject
        }).catch((error: any) => {
            expect.fail(error, id, "Should not have rejected");
        });
    });

    it("Dataset should be properly removed", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response: string) => { // Note: response here comes from methodToRunSecond.
            return insightFacade.listDatasets();
        }).then((array: InsightDataset[]) => {
            expect(array).to.equal([]);
        }).catch((error: any) => {
            expect.fail(error, id, "Should not have rejected");
        });
    });

    it("Double remove should be rejected", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response: string) => { // Note: response here comes from methodToRunSecond.
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect.fail();
        }).catch((error: any) => {
            expect(error).to.be.instanceOf(NotFoundError);
        });
    });

    it("Should reject remove invalid id with just whitespace", function () {
        const id: string = "   ";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with whitespace");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject remove null ID", function () {
        const id: string = null;
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid null ID");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject remove empty string", function () {
        const id: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with empty string");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject remove undefined ID", function () {
        const id: string = undefined;
        return insightFacade.removeDataset(undefined).then((result: string) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid undefined ID");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should reject remove invalid id with underscore", function () {
        const id: string = "courses_invalid";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail();
        }).catch((err) => {
            const error = new InsightError("Invalid ID with underscore");
            expect(err).to.deep.equal(error);
        });
    });

    it("Should give NotFoundError on valid ID", function () {
        const id: string = "courses";
        const fakeId: string = "chin";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(fakeId);
        }).then((response: string) => { // Note: response here comes from methodToRunSecond.
            expect.fail(); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError);
        });
    });

    it("Should give error on invalid id right dataset", function () {
        const id: string = "courses";
        const fakeId: string = "fake_Courses";
        return insightFacade.addDataset(fakeId, datasets[id], InsightDatasetKind.Courses).then((response: string[]) => {
            expect.fail(); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            const error = new InsightError("Invalid ID with underscore");
            expect(err).to.deep.equal(error);
        });
    });

    it("Dataset should be properly removed", function () {
        const id: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.removeDataset(id);
        }).then((response: string) => { // Note: response here comes from methodToRunSecond.
            let newQuery: ITestQuery = {
                filename: "",
                title: "no result query",
                query:
                    "{\r\n        \"WHERE\": {\r\n            \"LT\": {\r\n" +
                    "                \"courses_avg\": 0\r\n            }\r\n        },\r\n" +
                    "        \"OPTIONS\": {\r\n            \"COLUMNS\": [\r\n                " +
                    "\"courses_dept\",\r\n                \"courses_instructor\",\r\n " +
                    "               \"courses_title\",\r\n                \"courses_fail\",\r\n" +
                    "                \"courses_uuid\",\r\n                \"courses_avg\",\r\n" +
                    "                \"courses_pass\",\r\n                \"courses_audit\",\r\n" +
                    "                \"courses_year\"\r\n            ],\r\n            \"ORDER\":" +
                    " \"courses_dept\"\r\n" + "        }\r\n    }",
                isQueryValid: true,
                result: []
            };
            return insightFacade.performQuery(newQuery);
        }).then((array: []) => {
            expect.fail();
        }).catch((error: any) => {
            expect(error).to.be.instanceOf(InsightError);
        });
    });
    // Test for listDataSet
    it("Trivial: List empty if nothing added", function () {
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result).to.deep.equal([]);
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });

    it("Should list with right properties", function () {
        const id: string = "single";
        let set: InsightDataset = {
            id: id,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        const expected: InsightDataset[] = [set];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((response: InsightDataset[]) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.deep.equal(expected); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });

    it("Should list with right properties, multiple add with broken file", function () {
        const id: string = "single";
        const id2: string = "broken111";
        let set: InsightDataset = {
            id: id,
            kind: InsightDatasetKind.Courses,
            numRows: 1
        };
        let set2: InsightDataset = {
            id: id2,
            kind: InsightDatasetKind.Courses,
            numRows: 5
        };
        const expected: InsightDataset[] = [set, set2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((response: InsightDataset[]) => { // Note: response here comes from methodToRunSecond.
            expect(response).to.deep.equal(expected); // Depending if it was supposed to resolve or reject
        }).catch((err: any) => {
            expect.fail(err, "Should not have rejected");
        });
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        newCourses: {id: "newCourses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
