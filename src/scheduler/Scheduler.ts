import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {fit, hasFreeSlot, makeRoomObjects, makeSectionObjects, sortRoomObj, sortSectionObjs} from "./SchedulerHelper";

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
        /*for (const secObj of secObjList) {
            let fitFreeRooms = [];
            for (const roomObj of roomObjList) {
                if (fit(secObj, roomObj)) {
                    if (hasFreeSlot(roomObj)) {
                        fitFreeRooms.push(roomObj);
                    }
                } else {
                    break;
                }
            }
        }*/
        return result;
    }
}

