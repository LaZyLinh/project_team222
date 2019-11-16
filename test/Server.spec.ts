import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs-extra";

describe("Facade D3", function () {
    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        server.start();
        // TODO: start server here once and handle errors properly
    });

    after(function () {
         server.stop();
    });

    beforeEach(function () {
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // TODO: read your courses and rooms datasets here once!


    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        minidata: "./test/data/minidata.zip",
        brkdata: "./test/data/brkdata.zip",
        mtdata: "./test/data/emptydata.zip",
        picdata: "./test/data/picdata.zip",
        gregor: "./test/data/gregor.zip",
        baddir: "./test/data/baddir.zip",
        allbrk: "./test/data/allbrk.zip",
        twodir: "./test/data/twodir.zip",
        onedata: "./test/data/onedata.zip",
    };
    let datasets: { [id: string]: any } = {};

    // Sample on how to format PUT requests

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log("Server::getDatasets(..) - responding 400 - new");
        }
    });

    it("PUT test for meow dataset", function () {
        try {
            return chai.request("localhost:4321")
                .put("/dataset/courses/meow")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(400);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail(err);
                });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log("Server::getDatasets(..) - responding 400 - new");
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
