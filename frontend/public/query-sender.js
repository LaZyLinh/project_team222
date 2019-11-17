/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        // TODO: test me!
        let xhr = new XMLHttpRequest();
        let baseURL = window.location.origin; // the URL of the server. probably http://localhost:4321
        let sendURL = baseURL + "/query";
        xhr.open("POST", sendURL);
        xhr.onload = () => {
            // responded with success!
            let response = JSON.parse(xhr.responseText);
            fulfill(response);
        };
        xhr.addEventListener("error", () => {
            // responded with error
            // TODO: type of error?
            reject();
        });
        xhr.send(JSON.stringify(query));
    });
};
