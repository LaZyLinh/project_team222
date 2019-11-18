import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {
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

export default class Scheduler implements IScheduler {
    private TSCode: TimeSlot[] = [
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

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        const roomObjList = makeRoomObjects(rooms);
        const secObjList = makeSectionObjects(sections);

        const sRoomObjs = sortRoomObj(roomObjList);         // main list to deal with
        const sSecObjs = sortSectionObjs(secObjList);       // main list to deal with

        if (sSecObjs.length === 1) {
            if (fit(sSecObjs[0], sRoomObjs[0])) {
                result.push([rooms[sRoomObjs[0].index], sections[0], this.TSCode[0]]);
                return result;
            }
        }
        if (sRoomObjs.length === 1) {
            let counter: number = 0;
            for (const section of sSecObjs) {
                if (fit(section, sRoomObjs[0])) {
                    result.push([rooms[0], sections[section.index], this.TSCode[counter]]);
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

function multSecRoom(originSecs: SchedSection[], originRooms: SchedRoom[], secs: ISectionObj[], rooms: IRoomSchedObj[]):
                     Array<[SchedRoom, SchedSection, TimeSlot]> {
    let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
    let courses: IndexableObject = {};
    let courseTime: boolean[];

    let scheduledRooms: IRoomSchedObj[] = [];
    let scheduledSecs: ISectionObj[] = [];

    for (const secObj of secs) {
        if (addedCourse(secObj, courses)) {
            courseTime = courses[secObj.dept + secObj.id];
        } else {
            let newTime: boolean[] = [];
            for (let i = 0; i < 15; i++) {
                newTime.push(true);
            }
            courses[secObj.dept + secObj.id] = newTime;
        }
        let fitFreeRooms = findFitFreeRoom(secObj, rooms);
        let checkedFitRooms = [];
        let keepRoom = false;
        let commonTS: IndexableObject = {};
        for (const potential of fitFreeRooms) {
            for (let i = 0; i < 15; i++) {
                if (potential.timeSlot[i] && courseTime[i]) {
                    keepRoom = true;
                    if (commonTS[potential.index] === undefined) {
                        commonTS[potential.index] = [i];
                    } else {
                    commonTS[potential.index].push(i);
                    }
                }
            }
            if (keepRoom) {
                checkedFitRooms.push(potential);
            }
        }
        if (scheduledRooms.length === 0) {
            let timeSlot = this.TSCode[commonTS[checkedFitRooms[0].index][0]];
            result.push([originRooms[checkedFitRooms[0].index], originSecs[secObj.index], timeSlot]);
            scheduledRooms.push(checkedFitRooms[0]);
            scheduledSecs.push(secObj);
            continue;
        }
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
