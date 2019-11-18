import {SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {IRoomSchedObj, ISectionObj} from "./ISchedObj";
import {getComparison, IndexableObject, mergeSort} from "../controller/SortResultHelper";

export function sortRoomObj(rooms: IRoomSchedObj[]): IRoomSchedObj[] {
    if (rooms.length === 1) {
        return rooms;
    }
    return mergeSort(rooms, getComparison("maxSeats", "number", "DOWN")) as IRoomSchedObj[];
}

export function sortSectionObjs(secs: ISectionObj[]): ISectionObj[] {
    if (secs.length === 1) {
        return secs;
    }
    return mergeSort(secs, getComparison("enroll", "number", "DOWN")) as ISectionObj[];
}

export function makeRoomObjects(rooms: SchedRoom[]): IRoomSchedObj[] {
    let result: IRoomSchedObj[] = [];
    for (let i = 0; i < rooms.length; i++) {
        let roomObj: IRoomSchedObj = {
            index: i,
            lat : rooms[i].rooms_lat,
            lon: rooms[i].rooms_lon,
            maxSeats: rooms[i].rooms_seats,
            timeSlot: []
        };
        for (let m = 0; m < 15; m++) {
            roomObj.timeSlot.push(true);
        }
        result.push(roomObj);
    }
    return result;
}

export function makeSectionObjects(sections: SchedSection[]): ISectionObj[] {
    let result: ISectionObj[] = [];
    for (let i = 0; i < sections.length; i++) {
        let secObj: ISectionObj = {
            index: i,
            dept: sections[i].courses_dept,
            id: sections[i].courses_id,
            enroll: sections[i].courses_audit + sections[i].courses_fail + sections[i].courses_pass
        };
        result.push(secObj);
    }
    return result;
}

export function fit(sec: ISectionObj, room: IRoomSchedObj): boolean {
    if (sec.enroll > room.maxSeats) {
        return false;
    }
    return true;
}

export function hasFreeSlot(room: IRoomSchedObj): boolean {
    let result: boolean = false;
    for (const slot of room.timeSlot) {
        result = (result || slot);
        if (result) {
            break;
        }
    }
    return result;
}

export function calculateScore(rooms: IRoomSchedObj[], secs: ISectionObj[], totalEnrollment: number) {
    let maxDistanceSoFar: number = 0;
    let schedEnrollment: number = 0;

    let buildLatLons: number[] = [];
    let buildingsOnly: IRoomSchedObj[] = [];
    for (let room of rooms) {
        if (!buildLatLons.includes(room.lat + room.lon)) {
            buildLatLons.push(room.lat + room.lon);
            buildingsOnly.push(room);
        }
    }
    for (let building of buildingsOnly) {
        maxDistanceSoFar = Math.max(maxDistanceSoFar, maxDistance(building, buildingsOnly));
    }
    if (rooms.length === 0) {
        maxDistanceSoFar = Number.POSITIVE_INFINITY;
    }
    for (let section of secs) {
        schedEnrollment += section.enroll;
    }
    let d = clamp((1 - (maxDistanceSoFar / 1372)), 0, 1);
    let e = clamp(schedEnrollment / totalEnrollment, 0, 1);

    return 0.7 * d + 0.3 * e;
}

function clamp(input: number, low: number, high: number) {
    return Math.min(high, Math.max(low, input));
}

export function maxDistance(room: IRoomSchedObj, schedRooms: IRoomSchedObj[]): number {
    let max = 0;
    for (const comparedRoom of schedRooms) {
        let dist = calculateDistance(room, comparedRoom);
        if (dist > max) {
            max = dist;
        }
    }
    return max;
}

export function calculateDistance(room1: IRoomSchedObj, room2: IRoomSchedObj): number {
    let R = 6371e3; // metres                                       // calculate great-circle distance. need to /1372
    let lat1 = room1.lat;
    let lat2 = room2.lat;
    let lon1 = room1.lon;
    let lon2 = room2.lon;

    let a1 = lat1 * Math.PI / 180;
    let a2 = lat2 * Math.PI / 180;
    let deltaP = (lat2 - lat1) * Math.PI / 180;
    let deltaL = (lon2 - lon1) * Math.PI / 180;

    let a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
        Math.cos(a1) * Math.cos(a2) *
        Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
/*
var R = 6371e3; // metres                                       // calculate great-circle distance. need to /1372
var φ1 = lat1.toRadians();
var φ2 = lat2.toRadians();
var Δφ = (lat2-lat1).toRadians();
var Δλ = (lon2-lon1).toRadians();

var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

var d = R * c;
 */

