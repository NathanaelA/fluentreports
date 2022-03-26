/**************************************************************************************
 * (c) 2016-2022, Master Technology
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
let scalingFactor = process.env.SCALING_FACTOR || 1;


// ----------------------------------------------------------------------------------------------
// TODO: Need to populate this with Application paths for other popular PDF readers
// ----------------------------------------------------------------------------------------------
const PDFApplications = [
    // Linux
    "/usr/bin/xreader",
    "/usr/bin/evince",
    
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

    // Add the current working directory to the file so PDF Reader can find it
    let reportNameDir;
    if (reportName.indexOf("/") === -1) {
        reportNameDir = process.cwd() + "/" + reportName;
    } else {
        reportNameDir = reportName;
        reportName = reportName.substring(reportName.lastIndexOf("/")+1);
    }
    const reportNoExt = reportName.replace(".pdf", "");

    if (typeof process.env.TESTING !== "undefined" || testing.force === true ) {
        if (global.skipTesting) {
            console.log("SKIPPED:", reportNoExt);
            process.exit(0);
        }
        let blockParams = [];
        if (testing && testing.blocks) {
            for (let i=0;i<testing.blocks.length;i++) {
                blockParams.push("--block-out");
                if (scalingFactor > 1 && false) {
                    let scaleBlocks = testing.blocks[i].split(",");
                    for (let j=0;j<scaleBlocks.length;j++) {
                        scaleBlocks[j] *= scalingFactor;
                    }
                    console.log(testing.blocks[i], "   - ", scaleBlocks);

                    blockParams.push(scaleBlocks.join(","));
                } else {
                    blockParams.push(testing.blocks[i]);
                }
            }
        }

        // Allow me to see the actual block area that we are going to ignore
        // Normally not needed, but if the area we expect to change has moved
        // drastically; we can enable this to see the actual box we are ignoring.
        const debugging = [];
        if (testing && testing.debugImage === true || true) {
            debugging.push('--debug');
        }

        let count = 1;
        if (testing && testing.images) {
            count = testing.images;
        }

       // console.log([reportNameDir, __dirname + "/Check/"+reportNoExt, "-png", "-freetype", "yes"]);
        
        execFile( "pdftoppm", [reportNameDir, __dirname + "/Check/"+reportNoExt, "-png", "-freetype", "yes", "-aaVector", "yes", "-aa", "yes"]).then(( std ) => {
            if (std.stdout !== '' || std.stderr !== '') { console.log(std); }
            let testGroup = [];
            for (let i=0;i<count;i++) {
                let name = reportNoExt + "-"+(i+1)+".png";
                let outName = __dirname + "/Check/" + reportNoExt + "-" + (i+1)+"c.png";
                //console.log(  [__dirname + "/Originals/" + name, __dirname + "/Check/" + name, "--output", outName, "--no-composition", "--threshold", "0", "--delta", "1"].concat(blockParams, debugging).join(" "));
                testGroup.push(
                    // We are using a Delta difference of 0.00000001, because Font aliasing might be slightly different depending on the OS and OS version.  But the only difference should be a very slight grey difference.
                    execFile("blink-diff",
                        [__dirname + "/Originals/" + name, __dirname + "/Check/" + name, "--output", outName, "--no-composition", "--threshold", "0", "--delta", "0.00000001", "--verbose"].concat(blockParams, debugging)
                    )
                );
            }
            return Promise.all(testGroup);
        }).then(() => {
            console.log("PASSED:", reportNoExt);
            process.exit(0);
        }).catch((err) => {
            console.log("FAILED:", reportNoExt, err && err.code);
            //if (typeof process.env.TESTING === "undefined") {
                console.error("Error Code:", err, err.code);
            //}
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