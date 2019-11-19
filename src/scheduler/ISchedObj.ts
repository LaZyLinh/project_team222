import {SchedRoom} from "./IScheduler";
import {IndexableObject} from "../controller/SortResultHelper";

export interface IRoomSchedObj extends IndexableObject {
    index: number;
    lat: number;
    lon: number;
    maxSeats: number;
    timeSlot: boolean[];
}

export interface ISectionObj extends IndexableObject {
    index: number;
    dept: string;
    id: string;
    enroll: number;
}
