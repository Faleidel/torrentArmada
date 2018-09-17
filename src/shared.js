let Bugout = require("bugout");

let directoryAddr = "bPFLSP4gLRN2sfF4RzA4noTmbZrWP1G3fs";
exports.getDirectoryAddr = _ => directoryAddr;

function renderMd(text) {
    var converter = new showdown.Converter(),
        html      = converter.makeHtml(text+"");
    
    return "<div class='md'>"+html+"</div>";
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function renderThreads(threads, user, cont, interface) {
    let refs2 = tmpl`
        div
            - marginBottom: 10px
            div :newThread = Make a new thread
                - fontSize: 20px
            *newThread ${renderMakeNewPost(null, user, interface, true)}
        div :main *cont
            stIf ${threads.length == 0}
                div :noThreads *noThreads = There is no threads right now
                    - padding: 20px 0
    `.setTo(cont);
    
    let posts = {};
    
    function renderChild(post, parent){
        let rfs = tmpl`
            div :post *post
                div :user *user = ${post.user}
                div :date = ${new Date(post.date).toDateString()}
                div :content => ${renderMd(post.content)}
                div :answer *answer = answer
                    (click) ${answer}
                *ans ${renderMakeNewPost(post, user, {mkPost: p => {rfs.ans.hide(); interface.mkPost(p)}}, false)}
                stIf ${!!interface.deletePost}
                    span :linkButton *delete = delete
                        - marginRight: 5px
                        (click) ${_ => rfs.delete2.style.display = "inline"}
                    span :linkButton *delete2 = delete for real
                        - display: none
                        (click) ${_ => interface.deletePost(post)}
                div :childrens *childrens
        `.appendTo(parent);
        
        if (post.admin)
            rfs.user.style.color = "gold";
        
        if (!post.parent)
            rfs.post.classList.add("rootPost");
        
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
                 if (refs.noThreads)
                     refs.noThreads.remove();
                 
                 let parent = posts[post.parent];
                 if (parent) parent = parent.rfs.childrens;
                 else        parent = refs2.cont;
                 renderChild(post, parent);
             }
           };
}

function renderMakeNewPost(post, user, interface, show){
    console.log(user.name);
    
    let comp = tmpl`
        div :newPost *cont
            input *userName = ${user.name}
                - display: block
                (input) ${e => user.name = comp.obj.userName.value}
            textarea *input
                - width: 100%
                - maxWidth: 400px
                - height: 50px
            div
                - marginTop: 10px
                button *ok = Send
                    (click) ${sendPost}
    `;
    let refs = comp.obj;
    
    if (!show)
        refs.cont.style.display = "none";
    
    function sendPost(){
        interface.mkPost({ user: user.name
                         , content: refs.input.value
                         , parent: post ? post.id : null
                         });
        refs.input.value = "";
    }
    
    let compInt = { show: function() {refs.cont.style.display = "block"; this.visible = true}
                  , hide: function() {refs.cont.style.display = "none"; this.visible = false}
                  , visible: show
                  };
    
    return component(comp, compInt);
}

function randomImg(){
    const list = [ "url(client/imgs/full-bloom.png)"
                 , "url(client/imgs/seigaiha.png)"
                 , "url(client/imgs/topography.png)"
                 ];
    
    return list[Math.floor(Math.random()*list.length)];
}

exports.renderMakeNewPost = renderMakeNewPost;
exports.renderThreads = renderThreads;
exports.randomImg = randomImg;
exports.renderMd = renderMd;
exports.getParameterByName = getParameterByName;
