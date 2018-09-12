let Bugout = require("bugout");
let renderMakeNewPost = require("./shared.js").renderMakeNewPost;
let renderThreads = require("./shared.js").renderThreads;
let randomImg = require("./shared.js").randomImg;

function startClient(key){
    var b = new Bugout(key);
    
    // won't work on local file system
    try { history.pushState({}, "", "/?id=" + key); }
    catch (e){}
    
    b.on("server", function(address) {
        let refs = tmpl`
            div *cont
                - minHeight: 100vh
                div
                    - maxWidth: 900px
                    - margin: auto
                    - paddingTop: 10px
                    div *head
                    div *threads
                        - paddingBottom: 100px
        `.setTo(document.body);
        
        refs.cont.style.backgroundImage = randomImg();
        
        // INFOS
        function renderInfos(infos){
            let refs2 = tmpl`
                div :infos
                    - marginBottom: 50px
                    span => ${"<a href='/'><- connect to an other board</a>"}
                    div :title *title = ${infos.title}
                    div :description *description => ${infos.description}
                    div :visitors *visitors = ${"Users: " + infos.visitors}
                    div
                        span :noselect = ${"Link to this board: "}
                        span => ${"<a href='"+document.location.href + "?id="+key+"'>board</a>"}
            `.setTo(refs.head);
        }
        
        b.rpc("getInfos", {}, function(infos) {
            renderInfos(infos);
        });
        
        // THREADS
        let threadsInterface = null;
        
        b.rpc( "getThreads"
             , {}
             , threads => {
                   threadsInterface = renderThreads(threads, refs.threads, {
                       mkPost: post => b.rpc( "mkPost", post, _ => {})
                   })
               }
             );
        
        // MESSAGES
        b.on("message", (address, message, ddd) => {
            if (message.type == "newPost") {
                threadsInterface.newPost(message.post);
            }
            else if (message.type == "infos") {
                renderInfos(message);
            }
        });
    });
}

exports.startClient = startClient;
