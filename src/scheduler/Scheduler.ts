import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {
    calculateScore, calculateScoreResult,
    findClosestRoom,
    findFitFreeRoom,
    fit,
    hasFreeSlot,
    makeRoomObjects,
    makeSectionObjects,
    sortRoomObj,
    sortSectionObjs
} from "./SchedulerHelper";
import {IRoomSchedObj, ISectionObj} from "./ISchedObj";
import {IndexableObject} from "../controller/SortResultHelper";
import Log from "../Util";

const TSCode: TimeSlot[] = [
    "MWF 0800-0900",
    "MWF 0900-1000",
    "MWF 1000-1100",
    "MWF 1100-1200",
    "MWF 1200-1300",
    "MWF 1300-1400",
    "MWF 1400-1500",
    "MWF 1500-1600",
    "MWF 1600-1700",
    "TR  0800-0930",
    "TR  0930-1100",
    "TR  1100-1230",
    "TR  1230-1400",
    "TR  1400-1530",
    "TR  1530-1700"
];

export default class Scheduler implements IScheduler {


    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        const roomObjList = makeRoomObjects(rooms);
        const secObjList = makeSectionObjects(sections);

        const sRoomObjs = sortRoomObj(roomObjList);         // main list to deal with
        const sSecObjs = sortSectionObjs(secObjList);       // main list to deal with

        if (sSecObjs.length === 1) {
            if (fit(sSecObjs[0], sRoomObjs[0])) {
                result.push([rooms[sRoomObjs[0].index], sections[0], TSCode[0]]);
                return result;
            }
        }
        if (sRoomObjs.length === 1) {
            let counter: number = 0;
            for (const section of sSecObjs) {
                if (fit(section, sRoomObjs[0])) {
                    result.push([rooms[0], sections[section.index], TSCode[counter]]);
                    counter++;
                    if (counter > 14) {
                        break;
                    }
                }
            }
            return result;
        }
        // b4: 1000*e(-0.002x) + 10
        const attempts = Math.ceil(1500 * Math.exp(-0.004 * (sections.length - 250)) + 10);
        let currentMax = 0;
        let currentMaxRes: Array<[SchedRoom, SchedSection, TimeSlot]>;
        let total = totalEnrollment(sSecObjs);
        for (let i = 0; i < attempts; i++) {
            currentMaxRes = multSecRoom(sections, rooms, sSecObjs, sRoomObjs);
            let score = calculateScoreResult(currentMaxRes, total);
            if (score > currentMax) {
                result = currentMaxRes;
                currentMax = score;
            }
        }
        Log.test("Score: " + currentMax.toString());
        // result = multSecRoom(sections, rooms, sSecObjs, sRoomObjs);
        return result;
    }
}

function hasOverlap(potential: IRoomSchedObj, i: number, courseTime: boolean[], keepRoom: boolean,
                    commonTS: IndexableObject) {
    if (potential.timeSlot[i] && courseTime[i]) {
        keepRoom = true;
        if (!commonTS.hasOwnProperty(potential.index)) {
            commonTS[potential.index] = [i];
        } else {
            commonTS[potential.index].push(i);
        }
    }
    return keepRoom;
}

function firstRoom(commonTS: IndexableObject, checkedFitRooms: IRoomSchedObj[],
                   result: Array<[SchedRoom, SchedSection, TimeSlot]>, originRooms: SchedRoom[],
                   originSecs: SchedSection[], secObj: ISectionObj, scheduledRooms: IRoomSchedObj[],
                   scheduledSecs: ISectionObj[], courses: IndexableObject, secName: string) {
    let randomRoom = checkedFitRooms[(Math.floor(Math.random() * checkedFitRooms.length))];
    let randomSlot = commonTS[randomRoom.index][(Math.floor(Math.random() * commonTS[randomRoom.index].length))];
    let timeSlot = TSCode[randomSlot];
    result.push([originRooms[randomRoom.index], originSecs[secObj.index], timeSlot]);
    scheduledRooms.push(randomRoom);
    scheduledSecs.push(secObj);
    courses[secName][randomSlot] = false;
    randomRoom.timeSlot[randomSlot] = false;
    return;
}

function multRoom(scheduledRooms: IRoomSchedObj[], checkedFitRooms: IRoomSchedObj[], commonTS: IndexableObject,
                  scheduledSecs: ISectionObj[], secObj: ISectionObj, total: number,
                  result: Array<[SchedRoom, SchedSection, TimeSlot]>, originRooms: SchedRoom[],
                  originSecs: SchedSection[], courses: IndexableObject, secName: string) {
    let roomChosen = findClosestRoom(scheduledRooms, checkedFitRooms);
    // Log.test("schedRooms: " + JSON.stringify(scheduledRooms));
    // Log.test("checkedFitRooms: " + JSON.stringify(checkedFitRooms));
    // Log.test("index: " + roomChosen.index.toString() + " | commonTS length" + JSON.stringify(commonTS));
    let random = commonTS[roomChosen.index][(Math.floor(Math.random() * commonTS[roomChosen.index].length))];
    let time = TSCode[random];

    let currentScore = calculateScore(scheduledRooms, scheduledSecs, total);
    scheduledRooms.push(roomChosen);
    scheduledSecs.push(secObj);
    let newScore = calculateScore(scheduledRooms, scheduledSecs, total);
    if (newScore > currentScore) {
        result.push([originRooms[roomChosen.index], originSecs[secObj.index], time]);
        courses[secName][random] = false;
        roomChosen.timeSlot[random] = false;
    } else {
        scheduledRooms.pop();
        scheduledSecs.pop();
    }
    return {scheduledRooms, scheduledSecs};
}

function totalEnrollment(secs: ISectionObj[]) {
    let total: number = 0;
    for (const sec of secs) {
        total += sec.enroll;
    }
    return total;
}

function multSecRoom(originSecs: SchedSection[], originRooms: SchedRoom[], secs: ISectionObj[], rooms: IRoomSchedObj[]):
                     Array<[SchedRoom, SchedSection, TimeSlot]> {
    let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
    let courses: IndexableObject = {};
    let courseTime: boolean[];
    let total = totalEnrollment(secs);
    let scheduledRooms: IRoomSchedObj[] = [];
    let scheduledSecs: ISectionObj[] = [];
    for (const secObj of secs) {
        let secName: string = secObj.dept + secObj.id;
        if (!addedCourse(secObj, courses)) {
            let newTime: boolean[] = [];
            for (let i = 0; i < 15; i++) {
                newTime.push(true);
            }
            courses[secName] = newTime;
        }
        courseTime = courses[secName];
        let fitFreeRooms = findFitFreeRoom(secObj, rooms);
        let checkedFitRooms: IRoomSchedObj[] = [];
        let commonTS: IndexableObject = {};
        for (const potential of fitFreeRooms) {
            let keepRoom = false; // after
            for (let i = 0; i < 15; i++) {
                keepRoom = hasOverlap(potential, i, courseTime, keepRoom, commonTS);
                if (!keepRoom) {
                    continue;
                }
                if (!checkedFitRooms.includes(potential) && commonTS.hasOwnProperty(potential.index)) {
                    checkedFitRooms.push(potential);
                }
            }
        }
        if (checkedFitRooms.length === 0) {
            continue;
        }
        if (scheduledRooms.length === 0) {
            firstRoom.call(this, commonTS, checkedFitRooms, result, originRooms, originSecs, secObj,
                           scheduledRooms, scheduledSecs, courses, secName);
            continue;
        }
        const ret = multRoom.call(this, scheduledRooms, checkedFitRooms, commonTS, scheduledSecs, secObj, total,
            result, originRooms, originSecs, courses, secName);
        scheduledRooms = ret.scheduledRooms;
        scheduledSecs = ret.scheduledSecs;
    }
    return result;
}

function addedCourse(secObj: ISectionObj, course: IndexableObject): boolean {
    for (const current of Object.keys(course)) {
        if (current === (secObj.dept + secObj.id)) {
            return true;
        }
    }
    return false;
}
