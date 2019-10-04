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
        minidata: "./test/data/minidata.zip",
        brkdata: "./test/data/brkdata.zip",
        mtdata: "./test/data/emptydata.zip",
        picdata: "./test/data/picdata.zip",
        gregor: "./test/data/gregor.zip",
        baddir: "./test/data/baddir.zip",
        allbrk: "./test/data/allbrk.zip",
        twodir: "./test/data/twodir.zip",
        onedata: "./test/data/onedata.zip",
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
            Log.error(err);
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should not add the same dataset twice", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result2: string[]) => {
                expect.fail("", expected, "should've failed to add");
            }).catch((err: any) => {
                expect(result).to.deep.equal(expected);
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should allow adding the same dataset twice, with different ids", function () {
        const id1: string = "courses";
        const id2: string = "ubcvcourses";
        const expected: string[] = [id1, id2];
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.addDataset(id2, datasets[id1], InsightDatasetKind.Courses).then((result2: string[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should reject adding id's with underscores", function () {
        const id: string = "courses";
        const testId: string = "ubc_courses";
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should reject adding id's with only spaces", function () {
        const id: string = "courses";
        const testId: string = "    ";
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should reject adding id's which are empty strings", function () {
        const id: string = "courses";
        const testId: string = "";
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should reject adding null id", function () {
        const id: string = "courses";
        const testId: string = null;
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should reject adding undefined id", function () {
        const id: string = "courses";
        const testId: string = undefined;
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });

    });

    it("Should add a dataset with spaces if there's other chars", function () {
        const id: string = "courses";
        const testId: string = "ubc courses";
        const expected: string[] = [testId];
        return insightFacade.addDataset(testId, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a valid dataset, even if it contains file with broken json", function () {
        const id: string = "brkdata";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should add a valid dataset, even if it contains a non-text file", function () {
        const id: string = "picdata";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });
    it("Should add a valid dataset which contains exactly 1 valid file", function () {
        const id: string = "onedata";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    it("Should reject a dataset which does not contain a directory called 'courses'", function () {
        const id: string = "baddir";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a dataset which has no files under /courses", function () {
        const id: string = "mtdata";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a dataset which is not a zip file", function () {
        const id: string = "gregor";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a dataset which has two directories", function () {
        const id: string = "twodir";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a dataset which contains only broken json", function () {
        const id: string = "allbrk";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, expected, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing id's with underscores", function () {
        const id: string = "_courses_";
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing null id", function () {
        const id: string = null;
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing undefined id", function () {
        const id: string = undefined;
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing id's with empty strings", function () {
        const id: string = "";
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing id's with only whitespace", function () {
        const id: string = "    ";
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject removing valid id's which haven't been added yet", function () {
        const id: string = "courses";
        const expected: string = "";
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, expected, "should have rejected.");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError);
        });
    });

    it("Should allow removing a valid id which has been added already", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.removeDataset(id).then((result2: string) => {
                expect(result2).to.equal(id);
                insightFacade.listDatasets().then((result3: InsightDataset[]) => {
                    expect(result3).to.be.empty("array");
                }).catch((err: any) => {
                    expect.fail(err, expected, "should not have rejected.");
                });
            }).catch((err: any) => {
                expect.fail(err, expected, "should not have rejected.");
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "should not have rejected.");
        });
    });

    it("Should allow removing a valid id which has been added already, " +
        "even if some spaces (not all) are present", function () {
        const actualID: string = "courses";
        const id: string = "ubc courses";
        const expected: string = "ubc courses";
        return insightFacade.addDataset(id, datasets[actualID], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.removeDataset(id).then((result2: string) => {
                expect(result2).to.equal(id);
                insightFacade.listDatasets().then((result3: InsightDataset[]) => {
                    expect(result3).to.equal([]);
                });
            }).catch((err: any) => {
                expect.fail(err, expected, "should not have rejected.");
            });
        }).catch((err: any) => {
            expect.fail(err, expected, "should not have rejected.");
        });
    });

    it("removing a dataset should stop queries on it from working", function () {
        const id: string = "courses";
        const expected: string = "courses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            insightFacade.removeDataset(id).then((result2: string) => {
                let query: ITestQuery = {
                    title: "short test query",
                    query: "{\r\n        \"WHERE\": {\r\n            \"LT\": {\r\n                \"courses_avg\":0" +
                        "\r\n            }\r\n        },\r\n        \"OPTIONS\": {\r\n            \"COLUMNS\": [\r" +
                        "\n                \"courses_dept\",\r\n                \"courses_avg\"\r\n            ],\r" +
                        "\n            \"ORDER\": \"courses_avg\"\r\n        }\r\n    }",
                    isQueryValid: true,
                    filename: "",
                    result: "[]"
                };
                insightFacade.performQuery(query).then((result3: string[]) => {
                    expect.fail(result3, "should've failed", "");
                }).catch((err: any) => {
                    expect(err).to.be.instanceOf(InsightError);
                });
            }).catch((err: any) => {
                expect.fail(err, expected, "should not have rejected removal.");
            });
        }).catch((err: any) => {
            expect.fail(err, "", "should not have rejected.");
        });
    });

    // left under this 'describe' for convenience.
    it("Should correctly list the currently added datasets when one is added", function () {
        const id: string = "minidata";
        const expected: InsightDataset[] = [{
            id: id,
            kind: InsightDatasetKind.Courses,
            numRows: 75,
        }];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    it("Should correctly list the currently added datasets when more than one is added.", function () {
        const id1: string = "minidata";
        const id2: string = "brkdata";
        const expected: InsightDataset[] = [{
                id: id1,
                kind: InsightDatasetKind.Courses,
                numRows: 75,
            },
            {
                id: id2,
                kind: InsightDatasetKind.Courses,
                numRows: 52,
            }];
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses).then((result: string[]) => {
            return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            return insightFacade.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
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
        coursesduplicate: {id: "coursesduplicate", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
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
