import {ICourse, ImKeyEntry, IsKeyEntry} from "../../src/controller/IDataset";

/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let activeTabPanel = document.getElementsByClassName("tab-panel active")[0];
    let id = activeTabPanel.getAttribute("data-type");

    query.WHERE = whereBuilder(id, activeTabPanel.children[0]);
    query.OPTIONS = optionsBuilder(id, activeTabPanel.children[0]);
    let TRANSFORMATIONS = transBuilder(id, activeTabPanel.children[0]);
    if (TRANSFORMATIONS !== null) {
        query.TRANSFORMATIONS = TRANSFORMATIONS;
    }
    return query;
};

// TODO: there's probably a better place for these constants?
const coursesTypes = [
    {key: "year",       type: "number"},
    {key: "avg",        type: "number"},
    {key: "pass",       type: "number"},
    {key: "fail",       type: "number"},
    {key: "audit",      type: "number"},
    {key: "dept",       type: "string"},
    {key: "id",         type: "string"},
    {key: "instructor", type: "string"},
    {key: "title",      type: "string"},
    {key: "uuid",       type: "string"},
];

const roomsTypes = [
    {key: "fullname",   type: "string"},
    {key: "shortname",  type: "string"},
    {key: "number",     type: "string"},
    {key: "name",       type: "string"},
    {key: "address",    type: "string"},
    {key: "lat",        type: "number"},
    {key: "lon",        type: "number"},
    {key: "seats",      type: "number"},
    {key: "type",       type: "string"},
    {key: "furniture",  type: "string"},
    {key: "href",       type: "string"},
];

// return an object of the form {kind_label: value}, with value converted to the relevant type based on the label
// i.e, if we call this with "courses", "avg", and "95", then return {courses_avg: 95}
function matchValueType(kind, label, value) {
    label = label.toLowerCase();
    let checkArray = roomsTypes;
    if (kind === "courses"){
        checkArray = coursesTypes;
    }
    let result = {};
    for (let pair of checkArray) {
        if (pair.key === label) {
            if (pair.type === "string") {
                result[kind + "_" + label] = value;
                return result;
            } else {
                // it's a number
                result[kind + "_" + label] = Number(value);
                return result;
            }
        }
    }
}

function whereBuilder(kind, panel) {
    let where = {};
    let conditionType = "";
    if (panel.getElementsByClassName("control conditions-any-radio")[0].children[0].checked) {
        conditionType = "any";
    } else if (panel.getElementsByClassName("control conditions-all-radio")[0].children[0].checked) {
        conditionType = "all";
    } else if (panel.getElementsByClassName("control conditions-none-radio")[0].children[0].checked) {
        conditionType = "none";
    }
    let conditions = [];
    for (cond of activeTabPanel.getElementsByClassName("control-group condition")) {
        let newCond = {};
        newCond[cond.children[2].children[0].selectedOptions[0].label] = matchValueType(
            kind,
            cond.children[1].children[0].selectedOptions[0].label,
            cond.children[3].firstElementChild.value);

        conditions.push(newCond);
    }

    return undefined;
}

function optionsBuilder(id, panel) {
    return undefined;
}

function transBuilder(id, panel) {
    return undefined;
}


