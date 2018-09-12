let Bugout = require("bugout");
let getParameterByName = require("./shared.js").getParameterByName;

function startDirectory(){
    var opts = {};
    
    if (getParameterByName("dir") && getParameterByName("dir") != "0")
        opts.seed = getParameterByName("dir");
    
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
        if (   typeof args.name == "string"
            && typeof args.id == "string"
            && args.name.length < 35
           ) {
            boards[args.id] = { id: args.id
                              , name: args.name
                              , date: new Date().getTime()
                              };
            render();
            cb("ok");
        }
        else
           cb("not");
    });
    
    // RENDER
    function render(){
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
    render();
}

function getBoards(key, cb){
    var b = new Bugout(key);
    
    b.on("server", function(){
        b.rpc("getBoards", {}, function(boards) {
            cb(boards);
            b.close();
        });
    });
}

function addBoard(key ,id, name){
    var b = new Bugout(key);
    
    b.on("server", function(){
        b.rpc("addBoard", {id: id, name: name}, function(boards) {
            cb(boards);
            b.close();
        });
    });
}

exports.addBoard = addBoard;
exports.getBoards = getBoards;
exports.startDirectory = startDirectory;
