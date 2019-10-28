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

    it("Should sort a result obj by one key (numerical)", function () {
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
        let res = sortResultHelper(inputObj, ["courses_avg"], "UP");
        expect(res).to.deep.equal(expected);
    });

    it("Should sort a result obj by one key (numerical, reverse order)", function () {
        let inputObj = [
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
        ];
        let expected: any = [
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
        ];
        let res = sortResultHelper(inputObj, ["courses_avg"], "DOWN");
        expect(res).to.deep.equal(expected);
    });

    it("Should sort a result obj by one key (alphabetical)", function () {
        let inputObj = [
            { courses_uuid: "1", courses_instructor: "Dean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Casey",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Beatrice", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Albert", courses_avg: 85, courses_title : "310"},
        ];
        let expected: any = [
            { courses_uuid: "4", courses_instructor: "Albert", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Beatrice", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Casey",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "1", courses_instructor: "Dean",  courses_avg: 90, courses_title : "310"},
        ];
        let res = sortResultHelper(inputObj, ["courses_instructor"], "UP");
        expect(res).to.deep.equal(expected);
    });

    it("Should sort a result obj by two keys", function () {
        let inputObj = [
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "5", courses_instructor: "Casey", courses_avg: 60, courses_title : "310"},
        ];
        let expected: any = [
            { courses_uuid: "5", courses_instructor: "Casey", courses_avg: 60, courses_title : "310"},
            { courses_uuid: "4", courses_instructor: "Casey", courses_avg: 85, courses_title : "310"},
            { courses_uuid: "3", courses_instructor: "Casey", courses_avg: 95, courses_title : "310"},
            { courses_uuid: "2", courses_instructor: "Jean",  courses_avg: 80, courses_title : "310"},
            { courses_uuid: "1", courses_instructor: "Jean",  courses_avg: 90, courses_title : "310"},
        ];
        let res = sortResultHelper(inputObj, ["courses_instructor", "courses_avg"], "UP");
        expect(res).to.deep.equal(expected);
    });

    it ("Should be a stable sort", function () {
        let inputObj = [
            { name: "Choco",   rating: 12 },
            { name: "Devlin",  rating: 13 },
            { name: "Eagle",   rating: 13 },
            { name: "Jenny",   rating: 13 },
            { name: "Kona",    rating: 13 },
            { name: "Leila",   rating: 13 },
            { name: "Milly",   rating: 14 },
            { name: "Molly",   rating: 12 },
            { name: "Nova",    rating: 12 },
            { name: "Oliver",  rating: 13 },
            { name: "Patches", rating: 14 },
        ];
        let expected = [
            { name: "Milly",   rating: 14 },
            { name: "Patches", rating: 14 },
            { name: "Devlin",  rating: 13 },
            { name: "Eagle",   rating: 13 },
            { name: "Jenny",   rating: 13 },
            { name: "Kona",    rating: 13 },
            { name: "Leila",   rating: 13 },
            { name: "Oliver",  rating: 13 },
            { name: "Choco",   rating: 12 },
            { name: "Molly",   rating: 12 },
            { name: "Nova",    rating: 12 }
        ];
        let res = sortResultHelper(inputObj, ["rating"], "DOWN");
        expect(res).to.deep.equal(expected);

    });
});
