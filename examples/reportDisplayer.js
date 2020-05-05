/**************************************************************************************
 * (c) 2016-2020, Master Technology
 * Licensed under the MIT license or contact me for a support, changes, enhancements.
 *
 * Any questions please feel free to put a issue up on github
 *
 *                                                      Nathan@master-technology.com
 *************************************************************************************/
"use strict";


const fs = require('fs');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const child_process = require('child_process');

// ----------------------------------------------------------------------------------------------
// TODO: Need to populate this with Application paths for other popular PDF readers
// ----------------------------------------------------------------------------------------------
const PDFApplications = [
    // Linux
    "/usr/bin/xreader",
    // Windows
    "C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\Foxit Reader.exe",
    "C:\\Program Files (x86)\\Foxit Software\\Foxit Reader\\FoxitReader.exe",

];

module.exports = function(err, reportName, testing) {
    if (err) {
        console.error("Your report", reportName, "had errors", err);
        return false;
    }
    let found = false;

    // Add the current working directory to the file so Foxit can find it
    const reportNameDir = process.cwd() + "/" + reportName;
    const reportNoExt = reportName.replace(".pdf", "");

    if (typeof process.env.TESTING !== "undefined" || testing.force === true) {
        let blockParams = [];
        if (testing && testing.blocks) {
            for (let i=0;i<testing.blocks.length;i++) {
                blockParams.push("--block-out");
                blockParams.push(testing.blocks[i]);
            }
        }

        // Allow me to see the actual block area that we are going to ignore
        // Normally not needed, but if the area we expect to change has moved
        // drastically; we can enable this to see the actual box we are ignoring.
        const debugging = [];
        if (testing && testing.debugImage === true) {
            debugging.push('--debug');
        }

        let count = 1;
        if (testing && testing.images) {
            count = testing.images;
        }

       // console.log([reportNameDir, __dirname + "/Check/"+reportNoExt, "-png"]);
        execFile( "pdftoppm", [reportNameDir, __dirname + "/Check/"+reportNoExt, "-png"]).then(( std ) => {
            //console.log(std);
            let testGroup = [];
            for (let i=0;i<count;i++) {
                let name = reportNoExt + "-"+(i+1)+".png";
                let outName = __dirname + "/Check/" + reportNoExt + "-" + (i+1)+"c.png";
                testGroup.push(
                    execFile("blink-diff",
                        [__dirname + "/Originals/" + name, __dirname + "/Check/" + name, "--output", outName, "--no-composition", "--threshold", "0", "--delta", "0"].concat(blockParams, debugging)
                    )
                );
            }
            return Promise.all(testGroup);
        }).then(() => {
            console.log("PASSED:", reportNoExt);
            process.exit(0);
        }).catch((err) => {
            console.log("FAILED:", reportNoExt, err && err.code);
            if (typeof process.env.TESTING === "undefined") {
                //console.error("Error Code:", err, err.code);
            }
            process.exit(1);
        });
    } else {
        for (let i = 0; i < PDFApplications.length; i++) {
            if (fs.existsSync(PDFApplications[i])) {
            child_process.execFile(PDFApplications[i], [reportNameDir], function () {  });
                found = true;
                break;
            }
        }
        if (!found) {
            console.log("Your report has been rendered to", reportName);
        }
    }

};