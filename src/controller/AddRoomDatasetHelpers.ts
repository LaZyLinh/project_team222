
// given an arbitrary JSON object representing an HTML file, find and return all of the table elements within.
// recursively searches
import {IRoom, IRoomDataset} from "./IDataset";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {saveDatasetToDisk} from "./AddDatasetHelpers";

const GEO_URL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team";
const TEAM_NUMBER = 222;

export function getAddRoomDatasetPromise(content: string, id: string, datasets: InsightDataset[]) {
    let zip: JSZip;
    let buildings: IIndexBuildingInfo[];
    return new JSZip().loadAsync(content, {base64: true})
        .then((res: JSZip) => {
            // load html file
            zip = res;
            let roomDir = zip.folder("rooms");
            if (roomDir === null) {
                return Promise.reject(new InsightError("No room directory"));
            }
            let htmlFile = roomDir.file("index.htm");
            if (htmlFile === null) {
                return Promise.reject(new InsightError("No index.htm file"));
            }
            return htmlFile.async("text");
        }).then((res: string) => {
            buildings = parseIndexHTML(res);
            // Now, for each entry in roomsToParse, make a promise to load that file into memory
            let filePromises: Array<Promise<string | void>> = [];
            for (let building of buildings) {
                let courseFile = zip.folder("rooms").file(building.path);
                filePromises.push(courseFile.async("text"));
            }
            return Promise.all(filePromises);
        }).then((res: string[]) => {
            // So now we have an array of strings, where each array corresponds to an entry in buildingsToParse
            let roomPromises: Array<Promise<IRoom>> = [];
            for (let i = 0; i < res.length; i++) {
                roomPromises = [...roomPromises, ...makeRoomPromises(res[i], buildings[i])];
            }
            return Promise.all(roomPromises);
        }).then((res: IRoom[]) => {
            let newDataset = newRoomDatasetHelper(id, InsightDatasetKind.Rooms);
            addRoomsToDataset(res, newDataset);
            if (newDataset.rooms.length !== 0) {
                datasets.push(newDataset);
                // sortHelperArrays(newDataset);
                saveDatasetToDisk(newDataset);
                return Promise.resolve();
            } else {
                return Promise.reject(new InsightError("No valid rooms in zip file."));
            }
        });
}

function findTableBodies(htmlObj: any): any[] {
    if (htmlObj.hasOwnProperty("nodeName") && htmlObj.nodeName === "tbody") {
        return [htmlObj];
    } else if (htmlObj.hasOwnProperty("nodeName") &&
        htmlObj.hasOwnProperty("childNodes") &&
        htmlObj.childNodes !== null) {
        let resultAcc: any[] = [];
        for (let node of htmlObj.childNodes) {
            resultAcc = [...resultAcc, ...findTableBodies(node)];
        }
        return resultAcc;
    }
    return [];
}

interface IIndexBuildingInfo {
    code: string;       // building code
    title: string;      // building title
    address: string;    // building address
    path: string;       // path to data file
}

function parseIndexTableEntry(entry: any): IIndexBuildingInfo {
    try {
        let newCode: string = "";
        let newTitle: string = "";
        let newAddress: string = "";
        let newPath: string = "";
        for (let child of entry.childNodes) {
            if (child.nodeName !== "td") {
                continue;
            }
            if (child.attrs[0].value === "views-field views-field-field-building-code") {
                newCode = child.childNodes[0].value.trim();
            }
            if (child.attrs[0].value === "views-field views-field-title") {
                newTitle = child.childNodes[1].childNodes[0].value.trim();
                newPath = child.childNodes[1].attrs[0].value.slice(2);
            }
            if (child.attrs[0].value === "views-field views-field-field-building-address") {
                newAddress = child.childNodes[0].value.trim();
            }
        }
        // TODO: is it necessarily true that all three of these fields MUST be non-empty strings?
        if (newCode !== "" && newTitle !== "" && newAddress !== "" && newPath !== "") {
            return {
                code: newCode,
                title: newTitle,
                address: newAddress,
                path: newPath,
            };
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

function parseIndexTable(table: any): IIndexBuildingInfo[] {
    if (!table.hasOwnProperty("childNodes")) {
        return [];
    }
    let tableEntries: any[] = table.childNodes;
    let res: IIndexBuildingInfo[] = [];
    for (let entry of tableEntries) {
        if (entry.hasOwnProperty("nodeName") && entry.nodeName === "#text") {
            // this is just one of the 'spacing' elements, they just contain newlines
            continue;
        }
        // otherwise, it should be either "odd views-row-first",
        //                                "odd",
        //                                "even",
        //                                "odd views-row-last",
        //                                "even views-row-last"
        let newRes = parseIndexTableEntry(entry);
        if (newRes !== null) {
            res.push(newRes);
        }
    }
    return res;
}

function parseIndexHTML(res: string): IIndexBuildingInfo[] {
    const parse5 = require("parse5");
    let parsed: object = parse5.parse(res);
    let tableBodies: object[] = findTableBodies(parsed);
    for (let table of tableBodies) {
        let result: IIndexBuildingInfo[] = parseIndexTable(table);
        if (result.length !== 0) {
            // we can assume that only one table will have building info
            // so, the rest of the tables must be irrelevant; we can skip them.
            return result;
        }
    }
}

function parseBuildingTableEntry(entry: any, building: IIndexBuildingInfo): IRoom {
    let newNumber: string;
    let newSeats: string;
    let newType: string;
    let newFurniture: string;
    let newHref: string;
    for (let child of entry.childNodes) {
        if (child.nodeName !== "td") {
            continue;
        }
        switch (child.attrs[0].value) {
            case "views-field views-field-field-room-number": {
                newNumber = child.childNodes[1].childNodes[0].value;
                newHref = child.childNodes[1].attrs[0].value;
                break;
            }
            case "views-field views-field-field-room-capacity": {
                newSeats = child.childNodes[0].value.trim();
                break;
            }
            case "views-field views-field-field-room-furniture": {
                newFurniture = child.childNodes[0].value.trim();
                break;
            }
            case "views-field views-field-field-room-type": {
                newType = child.childNodes[0].value.trim();
                break;
            }
        }
    }

    return {
        address: building.address,
        fullname: building.title,
        furniture: newFurniture,
        href: newHref,
        lat: undefined,
        lon: undefined,
        name: building.code + "_" + newNumber,
        number: newNumber,
        seats: parseInt(newSeats, 10),
        shortname: building.code,
        type: newType,
    };
}

function parseBuildingTable(table: any, building: IIndexBuildingInfo): IRoom[] {
    if (!table.hasOwnProperty("childNodes")) {
        return [];
    }
    let tableEntries: any[] = table.childNodes;
    let res: IRoom[] = [];
    for (let entry of tableEntries) {
        if (entry.hasOwnProperty("nodeName") && entry.nodeName === "#text") {
            // this is just one of the 'spacing' elements, they just contain newlines
            continue;
        }
        let newRes = parseBuildingTableEntry(entry, building);
        if (newRes !== null) {
            res.push(newRes);
        }
    }
    return res;
}

function makeGeolocationPromise(room: IRoom): Promise<IRoom> {
    return new Promise((resolve, reject) => {
        const http = require("http");
        let getURL = GEO_URL + TEAM_NUMBER + "/" + encodeURI(room.address);
        http.get(getURL, (res: any) => {
            if (res.statusCode !== 200) {
                reject(new InsightError("failed to connect to geolocation server"));
            }
            let data: any[] = [];
            res.on("data", (chunk: any) => data.push(chunk));
            res.on("end", () => resolve(data.join("")));
        });
    }).then((response: string) => {
        let geo = JSON.parse(response);
        if (geo.hasOwnProperty("error")) {
            return Promise.reject(new InsightError("geolocation returned error"));
        }
        room.lat = geo.lat;
        room.lon = geo.lon;
        return room;
    });
}

function makeRoomPromises(file: string, building: IIndexBuildingInfo):  Array<Promise<IRoom>> {
    const parse5 = require("parse5");
    let parsed: object = parse5.parse(file);
    let tableBodies: object[] = findTableBodies(parsed);
    let rooms: IRoom[] = [];
    for (let table of tableBodies) {
        rooms = parseBuildingTable(table, building);
        if (rooms.length !== 0) {
            // assume there will be only one table with relevant room info in the document
            break;
        }
    }
    // We now have a list of room w lat/lon unset; now we have to use geolocation to do address -> lat,lon
    let promises: Array<Promise<IRoom>> = [];
    for (let room of rooms) {
        promises.push(makeGeolocationPromise(room));
    }
    return promises;
}

export function newRoomDatasetHelper(newID: string, newKind: InsightDatasetKind): IRoomDataset {
    return {
        rooms: [],
        fullname: [],
        shortname: [],
        number: [],
        name: [],
        address: [],
        lat: [],
        lon: [],
        seats: [],
        type: [],
        furniture: [],
        href: [],
        id: newID,
        kind: newKind,
        numRows: 0,
    };
}

export function addRoomsToDataset(rooms: IRoom[], dataset: IRoomDataset) {
    for (let room of rooms) {
        let index = dataset.rooms.push(room) - 1;
        dataset.fullname.push({courseIndex: index, sKey: room.fullname});
        dataset.shortname.push({courseIndex: index, sKey: room.shortname});
        dataset.number.push({courseIndex: index, sKey: room.number});
        dataset.name.push({courseIndex: index, sKey: room.name});
        dataset.address.push({courseIndex: index, sKey: room.address});
        dataset.lat.push({courseIndex: index, mKey: room.lat});
        dataset.lon.push({courseIndex: index, mKey: room.lon});
        dataset.seats.push({courseIndex: index, mKey: room.seats});
        dataset.type.push({courseIndex: index, sKey: room.type});
        dataset.furniture.push({courseIndex: index, sKey: room.furniture});
        dataset.href.push({courseIndex: index, sKey: room.href});
    }
    dataset.numRows += rooms.length;
}
