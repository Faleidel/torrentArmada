let Bugout = require("bugout");
let renderMakeNewPost = require("./shared.js").renderMakeNewPost;
let renderThreads = require("./shared.js").renderThreads;
let randomImg = require("./shared.js").randomImg;
let startServer = require("./server.js").startServer;
let startClient = require("./client.js").startClient;
let getParameterByName = require("./shared.js").getParameterByName;
let startDirectory = require("./directory.js").startDirectory;
let getBoards = require("./directory.js").getBoards;
let getDirectoryAddr = require("./shared.js").getDirectoryAddr;

document.addEventListener("DOMContentLoaded", function(event) {
    if (getParameterByName("dir")) {
        startDirectory();
    }
    else
        renderHomePage();
});

function renderHomePage(){
    let refs = tmpl`
        div :landing *landing
            - minHeight: 100vh
            div
                - maxWidth: 900px
                - margin: auto
                - paddingTop: 50px
                div = Join a board
                    - fontSize: 70px
                    - textAlign: center
                    - marginBottom: 50px
                div
                   - maxWidth: 540px
                   - margin: auto
                   - textAlign: center
                   input *clientCode = ${getParameterByName("id") || ""}
                       - flexGrow: 1
                       - fontSize: 25px
                   br
                   button *startClient = Join
                       - marginTop: 25px
                
                div *boards = Loading boards...
                    - maxWidth: 450px
                    - margin: auto
                    - marginTop: 20px
                    - padding: 10px
                    - textAlign: center
                
                div :linkButton *startServer = or create your own
                    - textAlign: center
                    - marginTop: 18px
                div :linkButton *loadServer = or restore one
                    - textAlign: center
                    - marginTop: 18px
                    (click) ${_ => refs.loadServerInputs.style.display = "block"}
                div *loadServerInputs
                    - display: none
                    - textAlign: center
                    - marginTop: 15px
                    textarea *serverData
                        - fontSize: 31px
                        - height: 31px
                    button *doLoadServer = load
                        - position: relative
                        - bottom: 3px
                        - marginLeft: 10px
                        (click) ${_ => startServer(JSON.parse(refs.serverData.value))}
                div => ${` <div class="about">
                               <h2>Whats is this?</h2>
                               <p> This is a peer to peer message board with reddit like comments base on WebRTC and web torrents technologie.
                                   It uses <a href="https://github.com/chr15m/bugout">bugout</a> for the WebRTC and web torrents.
                               </p>
                               <p> Each board is hosted on the client browser tab that created it.
                                   The board list is made using a hardcoded bugout address that simply register board names.
                                   This project is open source and can be found <a href="https://github.com/Faleidel/torrentArmada">here on github</a>
                               </p>
                           </div>
                         `}
                        
    `.setTo(document.body);
    
    refs.serverData.setAttribute("placeholder", "board data");
    
    refs.landing.style.backgroundImage = randomImg();
    
    refs.startServer.onclick = _ => startServer();
    refs.startClient.onclick = _ => startClient(refs.clientCode.value);
    
    getBoards(getDirectoryAddr(), function(boards){
        refs.boards.innerHTML = "";
        
        Object.keys(boards).map(id => {
            let name = boards[id].name;
            let date = boards[id].date;
            
            let rfs = tmpl`
                div :board
                    button = Join
                        (click) ${_ => startClient(id)}
                    span :name = ${name}
                    span :date = ${Math.floor((new Date().getTime() - date)/1000/60) + "m ago"}
            `.appendTo(refs.boards);
        });
    });
}

exports.renderHomePage = renderHomePage;