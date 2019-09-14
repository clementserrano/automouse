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
  if (mode === "record") {
    const position = robot.getMousePos();
    const time = { wait: +util.format("%d", new Date() - start) };
    start = new Date();
    const routineAction = Object.assign({}, time, position);
    console.log(routineAction)
    routine.push(routineAction);
  }
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
  .option('-r, --repeat <number>', 'Number of repetitions')
  .action((name, options) => launch(name, options.repeat ? +options.repeat : 1));

// Actions functions
function record(name) {
  console.log('Start recording')
  mode = "record";
  currentFile = name;
  start = new Date();
  routine = [];
  iohook.start();
};

function launch(name, repeat) {
  currentFile = name;
  mode = "launch";
  fs.readFile(folder + name + ".json", 'utf8', (err, data) => iterateRoutine(err, data, repeat));
};

async function iterateRoutine(err, data, repeat) {
  if (err) {
    console.log(err)
  } else {
    routine = JSON.parse(data);
    iohook.start();
    console.log('Launch routine ' + repeat + ' times')
    for (var i = 0; i < repeat; i++) {
      console.log('Start routine ' + (i + 1))
      for (const routineLine of routine) {
        console.log(routineLine)
        console.log('Wait ' + routineLine.wait + 'ms')
        await sleep(routineLine.wait);
        console.log('Move to x=' + routineLine.x + '    y=' + routineLine.y)
        robot.moveMouseSmooth(routineLine.x, routineLine.y);
        robot.mouseClick();
      }
    }
    iohook.stop();
  }
  quit();
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function stop() {
  if (mode === "record") {
    iohook.stop();
    fs.writeFile(folder + currentFile + ".json", JSON.stringify(routine), "utf8", err => {
      if (err) {
        console.log(err);
      } else {
        console.log("File saved");
      }
      quit();
    });
  } else if (mode === "launch") {
    iohook.stop();
    quit();
  }
};

function quit() {
  console.log("Bye-bye...")
  process.exit(0);
};

program.parse(process.argv)