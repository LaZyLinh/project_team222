import {SchedRoom, SchedSection} from "../src/scheduler/IScheduler";
import Scheduler from "../src/scheduler/Scheduler";
import {expect} from "chai";

describe("Schedule Test", function () {
    let scheduler: Scheduler;
    let section0: SchedSection = {
        courses_audit: 0,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section1: SchedSection = {
        courses_audit: 10,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section2: SchedSection = {
        courses_audit: 20,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section3: SchedSection = {
        courses_audit: 30,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section4: SchedSection = {
        courses_audit: 40,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section5: SchedSection = {
        courses_audit: 50,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section6: SchedSection = {
        courses_audit: 60,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section7: SchedSection = {
        courses_audit: 70,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section8: SchedSection = {
        courses_audit: 80,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section9: SchedSection = {
        courses_audit: 90,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section10: SchedSection = {
        courses_audit: 100,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section11: SchedSection = {
        courses_audit: 110,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section12: SchedSection = {
        courses_audit: 120,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section13: SchedSection = {
        courses_audit: 130,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section14: SchedSection = {
        courses_audit: 140,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let section15: SchedSection = {
        courses_audit: 150,
        courses_avg: 10,
        courses_dept: "cpsc",
        courses_fail: 10,
        courses_id: "310",
        courses_pass: 10,
        courses_uuid: "43134",
    };
    let room: SchedRoom = {
        rooms_seats: 100,
        rooms_lon: 10,
        rooms_lat: 10,
        rooms_shortname: "ICICS",
        rooms_number: "314"
    };
    beforeEach("set up Scheduler", function () {
        scheduler = new Scheduler();

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
            const actual = scheduler.schedule([section], [room]);
            const expected = [[room, section, "MWF 0800-0900"]];
            expect(actual).to.deep.equal(expected);
        });
        it("Should pass with multiple sections properly ordered", function () {
            section0 = {
                courses_audit: 10,
                courses_avg: 10,
                courses_dept: "cpsc",
                courses_fail: 10,
                courses_id: "310",
                courses_pass: 10,
                courses_uuid: "43134",
            };
            section1 = {
                courses_audit: 20,
                courses_avg: 10,
                courses_dept: "cpsc",
                courses_fail: 10,
                courses_id: "310",
                courses_pass: 10,
                courses_uuid: "43134",
            };
            section2 = {
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
            const actual = scheduler.schedule([section0, section1, section2, section3, section4, section5,
                section6, section7, section8, section9, section10, section11,
                section12, section13, section14, section15], [room]);
            const expected = 15;
            expect(actual.length).to.deep.equal(expected);
        });
    });
});
