let Bugout = require("bugout");
let renderMakeNewPost = require("./shared.js").renderMakeNewPost;
let renderThreads = require("./shared.js").renderThreads;
let randomImg = require("./shared.js").randomImg;
let startServer = require("./server.js").startServer;
let startClient = require("./client.js").startClient;
let getParameterByName = require("./shared.js").getParameterByName;

document.addEventListener("DOMContentLoaded", function(event) {
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
                        
    `.setTo(document.body);
    
    refs.serverData.setAttribute("placeholder", "board data");
    
    refs.landing.style.backgroundImage = randomImg();
    
    refs.startServer.onclick = _ => startServer();
    refs.startClient.onclick = _ => startClient(refs.clientCode.value);
}

exports.renderHomePage = renderHomePage;