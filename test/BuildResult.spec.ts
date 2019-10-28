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

    it("Should sort a result obj by numeric order (big)", function () {
        let inputObj = [
            { numField: 9 },
            { numField: 4 },
            { numField: 26 },
            { numField: 50 },
            { numField: 7 },
            { numField: 14 },
            { numField: 13 },
            { numField: 34 },
            { numField: 100 },
            { numField: 55 },
            { numField: 14 },
            { numField: 40 },
            { numField: 53 },
            { numField: 59 },
            { numField: 22 },
            { numField: 90 },
            { numField: 45 },
            { numField: 31 },
            { numField: 89 },
            { numField: 11 },
            { numField: 8 },
            { numField: 21 },
            { numField: 12 },
            { numField: 63 },
            { numField: 37 }
        ];
        let expected: any = [
            { numField: 4 },
            { numField: 7 },
            { numField: 8 },
            { numField: 9 },
            { numField: 11 },
            { numField: 12 },
            { numField: 13 },
            { numField: 14 },
            { numField: 14 },
            { numField: 21 },
            { numField: 22 },
            { numField: 26 },
            { numField: 31 },
            { numField: 34 },
            { numField: 37 },
            { numField: 40 },
            { numField: 45 },
            { numField: 50 },
            { numField: 53 },
            { numField: 55 },
            { numField: 59 },
            { numField: 63 },
            { numField: 89 },
            { numField: 90 },
            { numField: 100 }

        ];
        let res = sortResultHelper(inputObj, ["numField"], "UP");
        expect(res).to.deep.equal(expected);
    });

    it("Should sort a result obj by two keys (alpha and numeric)", function () {
        let inputObj = [
            { numField: 1, strField: "B" },
            { numField: 2, strField: "B" },
            { numField: 3, strField: "B" },
            { numField: 1, strField: "C" },
            { numField: 3, strField: "C" },
            { numField: 2, strField: "C" },
            { numField: 3, strField: "A" },
            { numField: 1, strField: "A" },
            { numField: 2, strField: "A" },
        ];
        let expected: any = [
            { numField: 1, strField: "C" },
            { numField: 1, strField: "B" },
            { numField: 1, strField: "A" },
            { numField: 2, strField: "C" },
            { numField: 2, strField: "B" },
            { numField: 2, strField: "A" },
            { numField: 3, strField: "C" },
            { numField: 3, strField: "B" },
            { numField: 3, strField: "A" },
        ];
        let res = sortResultHelper(inputObj, ["numField", "strField"], "UP");
        expect(res).to.deep.equal(expected);
    });

    it("Should sort a result obj by numeric order (big)", function () {
        let inputObj = [
            { numField: 2, strField: "B", numField2: 10 },
            { numField: 2, strField: "A", numField2: 20 },
            { numField: 2, strField: "B", numField2: 20 },
            { numField: 1, strField: "A", numField2: 10 },
            { numField: 2, strField: "A", numField2: 10 },
            { numField: 1, strField: "A", numField2: 20 },
            { numField: 1, strField: "B", numField2: 10 },
            { numField: 1, strField: "B", numField2: 20 },
        ];
        let expected: any = [
            { numField: 1, strField: "B", numField2: 10 },
            { numField: 1, strField: "B", numField2: 20 },
            { numField: 1, strField: "A", numField2: 10 },
            { numField: 1, strField: "A", numField2: 20 },
            { numField: 2, strField: "B", numField2: 10 },
            { numField: 2, strField: "B", numField2: 20 },
            { numField: 2, strField: "A", numField2: 10 },
            { numField: 2, strField: "A", numField2: 20 },
        ];
        let res = sortResultHelper(inputObj, ["numField", "strField", "numField2"], "UP");
        expect(res).to.deep.equal(expected);
    });


});
