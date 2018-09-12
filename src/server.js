let Bugout = require("bugout");
let renderMakeNewPost = require("./shared.js").renderMakeNewPost;
let renderThreads = require("./shared.js").renderThreads;
let randomImg = require("./shared.js").randomImg;
let addBoard = require("./directory").addBoard;
let getDirectoryAddr = require("./shared.js").getDirectoryAddr;

function startServer(opts){
    
    var b = opts ? new Bugout({seed: opts.seed}) : new Bugout();
    
    // NEW POST
    function newPost(user, content, parent){
        let post = { user: user
                   , content: content
                   , childrens: []
                   , date: new Date().getTime()
                   , id: new Date().getTime() + Math.random()
                   , parent: parent
                   };
        
        posts[post.id] = post;
        
        if (parent)
            posts[parent].childrens.push(post);
        else
            threadList.push(post);
        
        return post;
    }
    
    // POSTS AND THREADS
    let posts = {};
    let threadList = [];
    
    if (opts && opts.threads) {
        threadList = opts.threads;
        function doPost(p){
            posts[p.id] = p;
            p.childrens.map(doPost);
        };
        threadList.map(doPost);
    }
    
    // RANDOM DATA FOR TESTS
    if (!opts) {
        newPost("faleidel","some random shit", null);
        newPost("faleidel","some random shit2", null);
        newPost("faleidel","some random shit3", null);
        newPost("faleidel","some random shit4", null);
        Object.values(posts).map(p => newPost("faleidel", "22222", p.id));
        Object.values(posts).map(p => newPost("faleidel", Math.random(), p.id));
    }
    
    // INFOS
    let boardName        = "Your board name";
    let boardDescription = "Your board description";
    let visitors         = 0;
    
    if (opts) {
        if (opts.infos.boardName)
            boardName = opts.infos.boardName;
        if (opts.infos.boardDescription)
            boardDescription = opts.infos.boardDescription;
        if (opts.infos.visitors)
            visitors = opts.infos.visitors;
    }
    
    addBoard(getDirectoryAddr(), b.address(), boardName);
    
    // HTML
    let refs = tmpl`
        div :landing *landing
            - minHeight: 100vh
            div :topInfos *topInfos
                - paddingBottom: 35px
                - borderBottom: 1px solid black
                div
                    - maxWidth: 900px
                    - margin: auto
                    - paddingTop: 50px
                    div
                        div = Board name:
                            - fontSize: 25px
                        input *boardName :boardNameInput = ${boardName}
                            - fontSize: 40px
                            (input) ${_ => {boardName = refs.boardName.value; sendUpdate()}}
                    div
                        div = Board description:
                            - fontSize: 25px
                            - marginTop: 25px
                        textarea *boardDescription :boardDescriptionInput = ${boardDescription}
                            - fontSize: 25px
                            - width: 50%
                            (input) ${_ => {boardDescription = refs.boardDescription.value; sendUpdate()}}
                        div *visitors = ${"Visitors:" + visitors}
                            - marginTop: 5px
                        div :loadAndSave
                            - paddingTop: 15px
                            button *save = Save board datas
                                (click) ${showSave}
                            div *saveDataCont
                                - display: none
                                button *hideSave = Hide 
                                    (click) ${hideSave}
                                div = Copy this data to your clipboard
                                    - marginTop: 15px
                                textarea *dataInput
                                    - width: 100%
                                    - height: 100px
                    div
                        - fontSize: 25px
                        - marginTop: 15px
                        span = Board address:
                            - marginRight: 5px
                        span = ${b.address()}
                        div
                            span :noselect = ${"Link: "}
                            span = ${document.location.href + "?id="+b.address()}
            div
                - maxWidth: 900px
                - margin: auto
                div *threads
                    - paddingTop: 25px
    `.setTo(document.body);
    
    refs.landing.style.backgroundImage = randomImg();
    do {
        refs.topInfos.style.backgroundImage = randomImg();
    }
    while (refs.landing.style.backgroundImage == refs.topInfos.style.backgroundImage)
    
    function showSave(){
        refs.dataInput.value = JSON.stringify({ threads: threadList
                                              , seed: b.seed
                                              , infos: { boardName: boardName
                                                       , boardDescription: boardDescription
                                                       , visitors: visitors
                                                       }
                                              });
        refs.saveDataCont.style.display = "block";
        refs.save.style.display = "none";
    }
    function hideSave(){
        refs.saveDataCont.style.display = "none";
        refs.save.style.display = "block";
        refs.dataInput.value = "";
    }
    
    // RENDER THREADS
    function reRenderThreads(){
        renderThreads(threadList, refs.threads, {
            mkPost: postData => {
                let post = newPost(postData.user, postData.content, postData.parent);
                b.send({ type: "newPost"
                       , post: post
                       });
                reRenderThreads();
            },
            deletePost: post => {
                let parent = posts[post.parent];
                if (!parent) { // this is a thread, it has no parent
                    for (let i = 0 ; i < threadList.length ; i++){
                        if (threadList[i] == post) {
                            threadList.splice(i,1);
                            break;
                        }
                    }
                }
                else {
                    delete posts[post.id];
                    for (let i = 0 ; i < parent.childrens.length ; i++){
                        if (post == parent.childrens[i]) {
                            parent.childrens.splice(i,1);
                            break;
                        }
                    }
                }
                reRenderThreads();
            }
        });
    }
    reRenderThreads();
    
    // SEND INFO UPDATE
    let updateTimeout = null;
    function sendUpdate(){
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(function(){
            b.send({ type: "infos"
                   , title: boardName
                   , description: boardDescription
                   , visitors: visitors
                   });
            addBoard(getDirectoryAddr(), b.address(), boardName);
        },5000);
    }
    
    setInterval(function(){
        addBoard(getDirectoryAddr(), b.address(), boardName);
    }, 1000*60*60);
    
    // ON SEEN
    b.on("seen", _ => {
        visitors++;
        refs.visitors.textContent = "Visitors: " + visitors;
        sendUpdate();
    });
    
    
    // GET THREADS MSG
    b.register("getThreads", function(address, args, callback) {
        callback(threadList);
    });
    
    // MK POST MSG
    b.register("mkPost", function(address, args, cb){
        let post = newPost(args.user, args.content, args.parent);
        cb({});
        b.send({ type: "newPost"
               , post: post
               });
        reRenderThreads();
    });
    
    // GET INFOS MSG
    b.register("getInfos", function(address, args, cb){
        cb({ title: boardName
           , description: boardDescription
           , visitors: visitors
           });
    })
}

exports.startServer = startServer;
