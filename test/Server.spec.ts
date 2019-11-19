import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs-extra";
import Log from "../src/Util";

describe("Facade D3", function () {
    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        // TODO: start server here once and handle errors properly
        facade = new InsightFacade();
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }
        server = new Server(21);
        // server.stop();
        server.start().then((result: boolean) => {
            return;
        }).catch(function (err) {
            Log.error(err);
        });
    });

    after(function () {
        server.stop().then().catch( function (err) {
            Log.error(err);
        });
    });

    beforeEach(function () {
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

    let testQuery = {
        WHERE: {
            GT: {
                courses_avg: 97
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };

    let fakeQuery = {
        WHERE: {
            GT: {
                courses_avg: 97
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept"
            ],
            ORDER: "courses_avg"
        }
    };

    // Sample on how to format PUT requests

    it("PUT test for courses dataset", function () {
        try {
            return chai.request("localhost:21")
                .put("/dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.error(err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("PUT test for meow dataset", function () {
        try {
            return chai.request("localhost:21")
                .put("/dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("GET test for list", function () {
        try {
            return chai.request("localhost:21")
                .get("/datasets")
                .then(function (res: Response) {
                    expect(res.status).to.equal(200);
                    expect(res.body.result[0].id).to.equal("courses");
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error(err);
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("DELETE test", function () {
        try {
            return chai.request("localhost:21")
                .del("/dataset/courses")
                .then(function (res: Response) {
                    expect(res.body.result).to.equal("courses");
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("DELETE test", function () {
        try {
            return chai.request("localhost:21")
                .del("/dataset/cou_blah")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.equal(400);
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("DELETE test", function () {
        try {
            return chai.request("localhost:21")
                .del("/dataset/minordata")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.equal(404);
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("GET test for list after del", function () {
        try {
            return chai.request("localhost:21")
                .get("/datasets")
                .then(function (res: Response) {
                    expect(res.status).to.equal(200);
                    expect(res.body.result).to.deep.equal([]);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error(err);
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("PUT test after del", function () {
        try {
            return chai.request("localhost:21")
                .put("/dataset/courses/courses")
                .send(datasets["courses"])
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.error(err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });


    it("POST test for courses dataset", function () {
        try {
            return chai.request("localhost:21")
                .post("/query")
                .send(JSON.stringify(testQuery))
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result.length).to.equal(49);
                })
                .catch(function (err) {
                    Log.error(err);
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("POST test for failed dataset", function () {
        try {
            return chai.request("localhost:21")
                .post("/query")
                .send(JSON.stringify(fakeQuery))
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.deep.equal(400);
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("test for getStatic", function () {
        try {
            return chai.request("localhost:21")
                .get("/index.html")
                .then(function (res: Response) {
                    expect(res.status).to.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error(err);
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    it("test for echo", function () {
        try {
            return chai.request("localhost:21")
                .get("/echo/aloha")
                .then(function (res: Response) {
                    expect(res.status).to.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.error(err);
                    expect.fail();
                });
        } catch (err) {
            Log.error(err);
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
