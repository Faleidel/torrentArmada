let Bugout = require("bugout");

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

function randomImg(){
    const list = [ "url(imgs/full-bloom.png)"
                 , "url(imgs/seigaiha.png)"
                 , "url(imgs/topography.png)"
                 ];
    
    return list[Math.floor(Math.random()*list.length)];
}

exports.renderMakeNewPost = renderMakeNewPost;
exports.renderThreads = renderThreads;
exports.randomImg = randomImg;
