let Bugout = require("bugout");

document.addEventListener("DOMContentLoaded", function(event) {
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
                   input *clientCode
                       - flexGrow: 1
                       - fontSize: 25px
                   br
                   button *startClient = Join
                       - marginTop: 25px
                
                div :linkButton *startServer = or create your own
                    - textAlign: center
                    - marginTop: 18px
    `.setTo(document.body);
    
    refs.landing.style.backgroundImage = randomImg();
    
    refs.startServer.onclick = startServer;
    refs.startClient.onclick = _ => startClient(refs.clientCode.value);
});

function startServer(){
    var b = new Bugout();
    
    function mkPost(user, content, parent){
        let p = { user: user
                , content: content
                , childrens: []
                , date: new Date().getTime()
                , id: new Date().getTime() + Math.random()
                , parent: parent
                };
        
        posts[p.id] = p;
        
        return p;
    }
    
    function newThread(user, content){
        let post = mkPost(user, content, null);
        threadList.splice(0,0,post);
    }
    
    function newPost(user, content, parent){
        let post = mkPost(user, content, parent);
        if (parent)
            posts[parent].childrens.push(post);
        else
            threadList.push(post);
        return post;
    }
    
    let posts = {};
    let threadList = [];
    
    newThread("faleidel","some random shit");
    newThread("faleidel","some random shit2");
    newThread("faleidel","some random shit3");
    newThread("faleidel","some random shit4");
    
    Object.values(posts).map(p => newPost("faleidel", "22222", p.id));
    Object.values(posts).map(p => newPost("faleidel", Math.random(), p.id));
    
    let boardName        = "Your board name";
    let boardDescription = "Your board description";
    
    let refs = tmpl`
        div :landing *landing
            - minHeight: 100vh
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
                div
                    - fontSize: 25px
                    - marginTop: 15px
                    span = Board address:
                        - marginRight: 5px
                    span = ${b.address()}
                div *threads
                    - paddingTop: 25px
    `.setTo(document.body);
    
    refs.landing.style.backgroundImage = randomImg();
    
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
    
    let updateTimeout = null;
    function sendUpdate(){
        clearTimeout(updateTimeout);
        setTimeout(function(){
            b.send({ type: "infos"
                   , title: boardName
                   , description: boardDescription
                   });
        },5000);
    }
    
    b.register("getThreads", function(address, args, callback) {
        callback(threadList);
    });
    
    b.register("mkPost", function(address, args, cb){
        let post = newPost(args.user, args.content, args.parent);
        cb({});
        b.send({ type: "newPost"
               , post: post
               });
        reRenderThreads();
    });
    
    b.register("getInfos", function(address, args, cb){
        cb({ title: boardName
           , description: boardDescription
           });
    })
}

function startClient(key){
    var b = new Bugout(key);
    
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
                    div :title *title = ${infos.title}
                    div :description *description => ${infos.description}
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

function randomImg(){
    const list = [ "url(imgs/full-bloom.png)"
                 , "url(imgs/seigaiha.png)"
                 , "url(imgs/topography.png)"
                 ];
    
    return list[Math.floor(Math.random()*list.length)];
}

function renderMakeNewPost(post, interface, show){
    let comp = tmpl`
        div *cont
            textarea *input
            button *ok = Send
                (click) ${sendPost}
    `;
    let refs = comp.obj;
    
    if (!show)
        refs.cont.style.display = "none";
    
    function sendPost(){
        interface.mkPost({ user: "blablabla"
                         , content: refs.input.value
                         , parent: post ? post.id : null
                         });
    }
    
    let compInt = { show: function() {refs.cont.style.display = "block"; this.visible = true}
                  , hide: function() {refs.cont.style.display = "none"; this.visible = false}
                  , visible: show
                  };
    
    return component(comp, compInt);
}

function renderThreads(threads, cont, interface) {
    let refs2 = tmpl`
        div = Make a new thread
            - fontSize: 20px
        *newThread ${renderMakeNewPost(null, interface, true)}
        div :main *cont
    `.setTo(cont);
    
    let posts = {};
    
    function renderChild(post, parent){
        let rfs = tmpl`
            div :post *post
                div :user = ${post.user}
                div :date = ${new Date(post.date).toDateString()}
                div :content = ${post.content}
                div :answer *answer = answer
                    (click) ${answer}
                *ans ${renderMakeNewPost(post, {mkPost: p => {rfs.ans.hide(); interface.mkPost(p)}}, false)}
                stIf ${!!interface.deletePost}
                    span :linkButton *delete = delete
                        - marginRight: 5px
                        (click) ${_ => rfs.delete2.style.display = "inline"}
                    span :linkButton *delete2 = delete for real
                        - display: none
                        (click) ${_ => interface.deletePost(post)}
                div :childrens *childrens
        `.appendTo(parent);
        
        post.rfs = rfs;
        posts[post.id] = post;
        
        function answer(){
            if (rfs.ans.visible)
                rfs.ans.hide();
            else
                rfs.ans.show();
        }
        
        
        rfs.post.style.backgroundImage = randomImg();
        
        post.childrens.map(c => renderChild(c, rfs.childrens));
    }
    
    threads.map(thread => {
        renderChild(thread, refs2.cont);
    });
    
    return { newPost: function(post){
                 renderChild(post, posts[post.parent].rfs.childrens);
             }
           };
}