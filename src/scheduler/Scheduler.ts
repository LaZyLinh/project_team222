import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {
    calculateScore,
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
        result = multSecRoom(sections, rooms, sSecObjs, sRoomObjs);
        return result;
    }
}

function hasOverlap(potential: IRoomSchedObj, i: number, courseTime: boolean[], keepRoom: boolean,
                    commonTS: IndexableObject) {
    if (potential.timeSlot[i] && courseTime[i]) {
        keepRoom = true;
        if (commonTS[potential.index] === undefined) {
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
    let timeSlot = TSCode[commonTS[checkedFitRooms[0].index][0]];
    result.push([originRooms[checkedFitRooms[0].index], originSecs[secObj.index], timeSlot]);
    scheduledRooms.push(checkedFitRooms[0]);
    scheduledSecs.push(secObj);
    courses[secName][commonTS[checkedFitRooms[0].index][0]] = false;
    checkedFitRooms[0].timeSlot[commonTS[checkedFitRooms[0].index][0]] = false;
    return;
}

function multRoom(scheduledRooms: IRoomSchedObj[], checkedFitRooms: IRoomSchedObj[], commonTS: IndexableObject,
                  scheduledSecs: ISectionObj[], secObj: ISectionObj, total: number,
                  result: Array<[SchedRoom, SchedSection, TimeSlot]>, originRooms: SchedRoom[],
                  originSecs: SchedSection[], courses: IndexableObject, secName: string) {
    let roomChosen = findClosestRoom(scheduledRooms, checkedFitRooms);
    Log.test(scheduledRooms.length);
    let time = TSCode[commonTS[roomChosen.index][0]];

    let currentScore = calculateScore(scheduledRooms, scheduledSecs, total);
    scheduledRooms.push(roomChosen);
    scheduledSecs.push(secObj);
    let newScore = calculateScore(scheduledRooms, scheduledSecs, total);
    if (newScore > currentScore) {
        result.push([originRooms[roomChosen.index], originSecs[secObj.index], time]);
        courses[secName][commonTS[roomChosen.index][0]] = false;
        roomChosen.timeSlot[commonTS[roomChosen.index][0]] = false;
    } else {
        scheduledRooms.pop();
        scheduledSecs.pop();
    }
    return {scheduledRooms, scheduledSecs};
}

function multSecRoom(originSecs: SchedSection[], originRooms: SchedRoom[], secs: ISectionObj[], rooms: IRoomSchedObj[]):
                     Array<[SchedRoom, SchedSection, TimeSlot]> {
    let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
    let courses: IndexableObject = {};
    let courseTime: boolean[];
    let total: number = 0;
    for (const sec of secs) {
        total += sec.enroll;
    }
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
        let checkedFitRooms = [];
        let keepRoom = false;
        let commonTS: IndexableObject = {};
        for (const potential of fitFreeRooms) {
            for (let i = 0; i < 15; i++) {
                keepRoom = hasOverlap(potential, i, courseTime, keepRoom, commonTS);
                if (keepRoom) {
                    checkedFitRooms.push(potential);
                    break;
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
