import {SchedRoom, SchedSection} from "../src/scheduler/IScheduler";
import Scheduler from "../src/scheduler/Scheduler";
import {expect} from "chai";

describe("Schedule Test", function () {
    let scheduler: Scheduler;
    beforeEach("set up Scheduler", function () {
        scheduler = new Scheduler();
    });
    it("Should pass with one course", function () {
        const section: SchedSection = {
            courses_audit: 10,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const room: SchedRoom = {
            rooms_seats: 100,
            rooms_lon: 10,
            rooms_lat: 10,
            rooms_shortname: "ICICS",
            rooms_number: "314"
        };
        const actual = scheduler.schedule([section], [room]);
        const expected = [[room, section, "MWF 0800-0900"]];
        expect(actual).to.deep.equal(expected);
    });
    it("Should pass with multiple sections properly ordered", function () {
        const section0: SchedSection = {
            courses_audit: 10,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section1: SchedSection = {
            courses_audit: 20,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section2: SchedSection = {
            courses_audit: 30,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section3: SchedSection = {
            courses_audit: 40,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const room: SchedRoom = {
            rooms_seats: 100,
            rooms_lon: 10,
            rooms_lat: 10,
            rooms_shortname: "ICICS",
            rooms_number: "314"
        };
        const actual = scheduler.schedule([section0, section1, section2, section3], [room]);
        const expected = [[room, section3, "MWF 0800-0900"], [room, section2, "MWF 0900-1000"],
            [room, section1, "MWF 1000-1100"], [room, section0, "MWF 1100-1200"]];
        expect(actual).to.deep.equal(expected);
    });
    it("Should pass with multiple sections properly ordered", function () {
        const section0: SchedSection = {
            courses_audit: 10,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section1: SchedSection = {
            courses_audit: 20,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section2: SchedSection = {
            courses_audit: 30,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const section3: SchedSection = {
            courses_audit: 140,
            courses_avg: 10,
            courses_dept: "cpsc",
            courses_fail: 10,
            courses_id: "310",
            courses_pass: 10,
            courses_uuid: "43134",
        };
        const room: SchedRoom = {
            rooms_seats: 100,
            rooms_lon: 10,
            rooms_lat: 10,
            rooms_shortname: "ICICS",
            rooms_number: "314"
        };
        const actual = scheduler.schedule([section0, section1, section2, section3], [room]);
        const expected = [[room, section2, "MWF 0800-0900"], [room, section1, "MWF 0900-1000"],
            [room, section0, "MWF 1000-1100"]];
        expect(actual).to.deep.equal(expected);
    });
});
