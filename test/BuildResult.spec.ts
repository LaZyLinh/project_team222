import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import * as fs from "fs-extra";
import {deleteAllFromDisk} from "../src/controller/AddDatasetHelpers";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {expect} from "chai";
import {sortResultHelper} from "../src/controller/SortResultHelper";

describe("Build / Sort result", function () {

    before(function () {
        Log.test(`Before all`);
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

    it("Should sort a result obj by one key", function () {
        let inputObj = [
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
        ];
        let expected: any = [
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
        ];
        sortResultHelper(inputObj, ["courses_avg"], "UP");
        expect(inputObj).to.deep.equal(expected);
    });

    it("Should sort a result obj by two keys", function () {
        let inputObj = [
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
        ];
        let expected: any = [
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
        ];
        sortResultHelper(inputObj, ["courses_instructor", "courses_avg"], "UP");
        expect(inputObj).to.deep.equal(expected);
    });


});
