let Bugout = require("bugout");
let getParameterByName = require("./shared.js").getParameterByName;

let isNode = process.title != "browser";

function startDirectory(){
    var opts = {};
    
    if (!isNode)
        if (getParameterByName("dir") && getParameterByName("dir") != "0")
            opts.seed = getParameterByName("dir");
    else {
        let fs = require("fs");
        opts.seed = fs.readFileSync("../directoryKey.txt", "UTF-8").split("\n")[0];
        console.log("Got seed");
    }
    
    var b = new Bugout(opts);
    
    var boards = {};
    
    // CLEAR OLD BOARDS
    setInterval(function(){
        Object.keys(boards).map(id => {
            let board = boards[id];
            // if more old then 2 hours
            console.log(board);
            if ( new Date().getTime() - board.date > 1000*60*60*2 )
                delete boards[id];
        });
        render();
    }, 1000 * 60 * 30);
    
    // GET BOARDS
    b.register("getBoards", function(address, args, cb) {
        cb(boards);
    });
    
    // MK ADD BOARD
    b.register("addBoard", function(address, args, cb){
        console.log("addBoard",args);
        cb("ok");
        if (   typeof args.name == "string"
            && typeof args.id == "string"
            && args.name.length < 35
           ) {
            boards[args.id] = { id: args.id
                              , name: args.name
                              , date: new Date().getTime()
                              };
            render();
        }
    });
    
    // RENDER
    function render(){
        if (!isNode) {
            let refs = tmpl`
                div = ${"Addr: " + b.address()}
                div = ${document.location.href + "?dir=" + b.seed}
                div *list
            `.setTo(document.body);
            
            Object.keys(boards).map(id => {
                let name = boards[id].name;
                
                let rfs = tmpl`
                    div = ${id + " " + name}
                `.appendTo(refs.list);
            });
        }
        else {
            console.log(boards);
        }
    }
    render();
}

function getBoards(key, cb){
    var b = new Bugout(key);
    
    b.on("server", function(){
        b.rpc("getBoards", {}, function(boards) {
            console.log(boards);
            b.close();
            cb(boards);
        });
    });
}

function addBoard(key ,id, name){
    var b = new Bugout(key);
    
    b.on("server", function(){
        b.rpc("addBoard", {id: id, name: name}, function(boards) {
            b.close();
        });
    });
}

exports.addBoard = addBoard;
exports.getBoards = getBoards;
exports.startDirectory = startDirectory;

if (isNode)
    startDirectory();
