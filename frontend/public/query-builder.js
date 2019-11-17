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
                result[kind + "_" + label] = String(value);
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
    for (let cond of panel.getElementsByClassName("control-group condition")) {
        let newCond = {};
        newCond[cond.children[2].children[0].selectedOptions[0].label] = matchValueType(
            kind,
            cond.children[1].children[0].selectedOptions[0].value,
            cond.children[3].firstElementChild.value);
        if ((cond.children[0].children[0].checked && conditionType !== "none") ||
            (!cond.children[0].children[0].checked && conditionType === "none") ) {
            // the 'NOT' checkbox is ticked AND conditionType is not "none"
            // OR the 'NOT' checkbox is not ticked AND conditionType is "none"
            let tmpCond = {};
            tmpCond.NOT = newCond;
            newCond = tmpCond;
        }
        conditions.push(newCond);
    }
    if (conditions.length === 1) {
        where = conditions[0];
    } else if (conditions.length === 0) {
        where = {};
    } else if (conditionType === "any") {
        where.OR = conditions;
    } else if (conditionType === "all") {
        where.AND = conditions;
    } else if (conditionType === "none") {
        // this looks the same as all- but that's because when the conditionType is "none" we change the conditions
        // under the loop above as well.
        where.AND = conditions;
    }
    return where;
}

function optionsBuilder(id, panel) {
    let options = {};
    let columns = [];
    let columnsControlGroup = panel.getElementsByClassName("form-group columns")[0];
    for (let element of columnsControlGroup.getElementsByClassName("control field")){
        if (element.children[0].checked) {
            columns.push(id + "_" + element.children[0].value);
        }
    }
    for (let element of columnsControlGroup.getElementsByClassName("control transformation")){
        if (element.children[0].checked) {
            columns.push(element.children[0].value);
        }
    }
    options.COLUMNS = columns;
    let orderControlGroup = panel.getElementsByClassName("form-group order")[0].children[1];
    if (orderControlGroup.children[0].children[0].selectedOptions.length !== 0) {
        // something is selected, so 'order' will be needed
        options.ORDER = {};
        options.ORDER.keys = [];
        for (selected of orderControlGroup.children[0].children[0].selectedOptions){
            if (selected.className === "") {
                // selected is not an apply key
                options.ORDER.keys.push(id + "_" + selected.value);
            } else {
                // selected _is_ an apply key.
                options.ORDER.keys.push(selected.value);
            }
        }
        if (orderControlGroup.children[1].children[0].checked) {
            // the order is 'descending'
            options.ORDER.dir = "DOWN";
        } else {
            options.ORDER.dir = "UP";
        }
        if (options.ORDER.keys.length === 1 && options.ORDER.dir === "UP"){
            options.ORDER = options.ORDER.keys[0];
        }
    }
    return options;
}

function transBuilder(id, panel) {
    let transformations = {};
    let groups = [];
    let groupsControlGroup = panel.getElementsByClassName("form-group groups")[0];
    for (let element of groupsControlGroup.getElementsByClassName("control field")){
        if (element.children[0].checked) {
            groups.push(id + "_" + element.children[0].value);
        }
    }
    if (groups.length === 0) {
        return null;
    }
    transformations.GROUP = groups;
    let applyArray = [];
    for (let cond of panel.getElementsByClassName("control-group transformation")) {
        let newApply = {};
        newApply[cond.children[0].children[0].value] = {
            [cond.children[1].children[0].selectedOptions[0].value]:
            id + "_" + cond.children[2].children[0].selectedOptions[0].value
        };
        applyArray.push(newApply);
    }
    transformations.APPLY = applyArray;
    return transformations;
}
