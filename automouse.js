var robot = require("robotjs");
var iohook = require("iohook");
var fs = require("fs");
var program = require("commander");
var util = require("util");

var mode; // Mode which determine what to stop
var currentFile; // Current file to create or read
var routine = []; // Json routine to write

var folder = "routines/"; // Routines folder

var start = new Date();

// Record behavior
iohook.on("mouseclick", event => {
  const position = robot.getMousePos();
  const time = { wait: +util.format("%d", new Date() - start) };
  const routineAction = Object.assign({}, time, position);
  console.log(routineAction)
  routine.push(routineAction);
});

// Escape behavior
iohook.on("keydown", event => {
  if (event.keycode === 1) {
    stop();
  }
});

// Commands
program.version("0.0.1").description("Command line automouse application");

program
  .command("record <name>")
  .alias("r")
  .description("Start recording mouse clicks")
  .action(name => record(name));

program
  .command("launch <name>")
  .alias("l")
  .description("Start routine")
  .action(name => launch(name));

// Actions functions
function record(name) {
  mode = "record";
  currentFile = name;
  start = new Date();
  routine = [];
  iohook.start();
};

function launch(name) {
  currentFile = name;
  mode = "launch";
  fs.readFile(folder + name + ".json", 'utf8', (err, data) => iterateRoutine(err, data));
};

async function iterateRoutine(err, data) {
  if (err) {
    console.log(err)
  } else {
    routine = JSON.parse(data);
    for (const routineLine of routine) {
      await sleep(routineLine.wait);
      robot.moveMouseSmooth(routineLine.x, routineLine.y);
      robot.mouseClick();
    }
  }
  quit();
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function stop() {
  if (mode == "record") {
    iohook.stop();
    fs.writeFile(folder + currentFile + ".json", JSON.stringify(routine), "utf8", err => {
      if (err) {
        console.log(err);
      } else {
        console.log("File saved");
      }
      quit();
    });
  } else if (mode == "launch") {
    quit();
  }
};

function quit() {
  process.exit(0);
};

program.parse(process.argv)