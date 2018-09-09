function doubleBindGS(){
    
}

function component(comp, interface) {
    return { component: comp
           , interface: interface
           , render: function(parent){
                         this.component.component.appendTo(parent);
                         return t.component.interface;
                     }
           };
}

// HTML RENDER LIB FUNCTIONS
// HTML RENDER LIB FUNCTIONS
/*
    Parse indentation tree

    the tree is in the form:
    
    someNode with some kind of tags
        thisNode is a child
        also this node
        i can also {have inline nodes}
    etc is also a node
        I
            can
                have deep nesting

    is json this would look like:
    
    [ { node "someNode", tags : ["with","some","kind"...] , childrens : [
          { node : "thisNode" ... }
        , { node : "also" ... }
        , { node : "i" , tags : ["can","also"] , childrens : [ { node : "have" , tags : ["inline", "nodes"] } ] }
      ] }
      ...
    ]
    
    You can make components with normal functions like this:
    
        function myComponent(param){
            let comp = tmpl`
                span *div = ${param}
            `;
            let refs = comp.obj;
            
            return component(comp,{
                setContent: str => refs.div.innerHTML = str
            });
        }
    
    And use like this:
    
        let refs = tmpl`
            div
                - color: green
                *compRef ${myComponent("one param")}
            table
        `.setTo(document.body);
        
        refs.compRef.setContent("my new text");
    
    The FromLines version support "lines" that are function. It is used with tagged templates.
    With a template like this : `hello ${myFunction} world`
    you will get back ["hello",myFunction,"world"]
    parseIndTreeFromLines will accept this array.
    js values can be used a some places fro example:
    div = ${some big text}
        onclick ${clickHandler}
        stIf ${condition}
            div
        if *ref ${condition}
            div
        stLoop ${listOfElements} ${e=>somethingThatReturnATemplate(e)}
        ! ${someFunctionToBeCalledWithTheParent}
    other things will come later
*/
function parseIndTree(str) {
    return parseIndTreeFromLines(str.split("\n"));
};
function parseIndTreeFromLines(parts){
    var nodes = [{childrens:[]}];
    parts = parts.filter(e=>e!="");
    var indent = 0;
    
    for (var i = 0 ; i < parts.length ; i++){
        var ind = 0;
        var s = parts[i];
        for ( var j = 0 ; j < s.length ; j++ ) {
            if ( s[j] == " " )
                ind += 1;
            else if ( s[j] == "\t" )
                ind += 4;
            else {
                s = s.substr(j,s.length);
                break;
            }
            
            if (j == s.length-1)
                s = "";
        }
        
        if (s == "") continue;
        
        if ( s.indexOf("stIf") == 0 ) {
            var node = { node : "stIf"
                       , tags : []
                       , childrens : []
                       , val : parts[i+1].arg
                       };
            i++;
        }
        else if ( s.indexOf("if") == 0 ) {
            var node = { node : "if"
                       , tags : []
                       , childrens : []
                       , ref : s.split(" ")[1].substr(1)
                       , val : parts[i+1].arg
                       };
            i++;
        }
        else if ( s.indexOf("onclick") == 0 ) {
            var node = { node : "onclick"
                       , tags : []
                       , childrens : []
                       , val : parts[i+1].arg
                       };
            i++;
        }
        else if ( s.indexOf("stLoop") == 0 ) {
            var node = { node : "stLoop"
                       , tags : []
                       , childrens : []
                       , ref : s.split(" ")[1].substr(1)
                       , list : parts[i+1].arg
                       , render : parts[i+3].arg
                       };
            i += 3;
        }
        else if ( s.indexOf("*") == 0 ) {
            var node = { node : "component"
                       , tags : []
                       , childrens : []
                       , ref : s.substr(1).split(" ")[0]
                       , component : parts[i+1].arg
                       };
            i++;
        }
        else if ( s.indexOf("(") == 0 ) {
            var node = { node : "event"
                       , tags : []
                       , childrens : []
                       , eventName : s.substr(1).split(") ")[0]
                       , handler : parts[i+1].arg
                       };
            i++;
        }
        else if ( s.indexOf("!") == 0 ) {
            var node = { node : "!"
                       , tags : []
                       , childrens : []
                       , val : parts[i+1].arg
                       };
            i++;
        }
        else {
            var node = parseDelTree(s);
            
            while ( parts[i+1] && parts[i+1].arg != undefined ) {
                node.tags.push(parts[i+1].arg);
                i++;
                if (parts[i+1] == " ") i++;
            }
        }
        
        if ( ind == indent ) {
            if ( ind != 0 )
                nodes.pop();
        }
        else if ( ind < indent ) {
            nodes.pop();
            for ( var j = 0 ; j < (indent-ind)/4 ; j++ )
                nodes.pop();
        }
        else if ( ind > indent ) {
        }
        nodes[nodes.length-1].childrens.push(node);
        nodes.push(node);
        indent = ind;
    }
    
    return nodes[0];
}
function parseDelTree(str){
    var parts = str.split(" ");
    
    function parseInlineNode(str){
        var name = parts[0];
        if ( parts[0][parts[0].length-1] == "}" ) {
            name = parts[0].substr(0,parts[0].indexOf("}"));
            parts[0] = parts[0].substr(parts[0].indexOf("}"));
        }
        else
            parts.splice(0,1);
        
        var node = { node : name
                   , tags : []
                   , childrens : []
                   };
        
        for (;;) {
            if (parts.length == 0)
                return node;
            else if ( parts[0][0] == "{" ) {
                parts[0] = parts[0].substr(1);
                if ( parts[0] == "" )
                    parts.splice(0,1);
                node.childrens.push(parseInlineNode(parts));
            }
            else if ( parts[0][parts[0].length-1] == "}" ) {
                parts[0] = parts[0].substr(0,parts[0].length-1);
                
                if ( parts[0] == "" )
                    parts.splice(0,1);
                else if ( parts[0][parts[0].length-1] == "}" ) {
                    var name = parts[0].substr(0,parts[0].indexOf("}"));
                    var rest = parts[0].substr(parts[0].indexOf("}"));
                    
                    if (name != "")
                        node.tags.push(name);
                    parts[0] = rest;
                }
                else {
                    let tag = parts.splice(0,1)[0];
                    //                                            v this space
                    if (tag != "") // for end of line space: div = ${asd}
                        node.tags.push(tag);
                }
                return node;
            }
            else {
                let tag = parts.splice(0,1)[0];
                if (tag != "")
                    node.tags.push(tag);
            }
        }
        
        return node;
    }
    
    return parseInlineNode(parts);
}

function parseTemplate(str, vars) {
    if (!vars) vars = {};
    
    var tree = parseIndTree(str);
    
    return parseTemplateFromTree(tree, vars);
}

function parseTemplateFromLines(lines, vars) {
    if (!vars) vars = {};
    
    var tree = parseIndTreeFromLines(lines);
    
    return parseTemplateFromTree(tree, vars);
}

function parseTemplateFromTree(tree,vars){
    
    function traverseElement(e){
        e.classes = "";
        e.style = {};
        
        var line = e.tags;
        
        for ( var i in line ) {
            if ( line[i][0] == ":" )
                e.classes += " " + line[i].substr(1);
            else if ( line[i].substr(0,5) == "text:" ) {
                var name = line[i].substr(5);
                e.text = vars[name];
            }
            else if ( line[i].substr(0,3) == "id:" )
                e.id = line[i].substr(3);
            else if ( line[i][0] == "*" )
                e.ref = line[i].substr(1);
            else if ( line[i] == "=" || line[i] == "=>" ) {
                var s = [];
                for ( var j = ~~i+1 ; j < line.length ; j++ )
                    s.push(line[j]);
                s = s.join(" ");
                e[ line[i] == "=" ? "text" : "html" ] = s;
                break;
            }
        }
        
        for ( var i = 0 ; i < e.childrens.length ; i++ ) {
            var children = e.childrens[i];
            
            if ( children.node[0] == ">" ) {
                e.text = children.tags.join(" ");
                e.childrens.splice(i,1);
                i--;
            }
            else if ( children.node == "-" ) {
                var line = children.node.substr(2).split(": ");
                
                var t0 = children.tags.splice(0,1)[0];
                var name = t0.substr(0, t0.length-1);
                var value = children.tags.join(" ");
                
                e.style[name] = value;
                e.childrens.splice(i,1);
                i--;
            }
            else
                traverseElement(children);
        }
    }
    
    for ( var i in tree.childrens )
        traverseElement(tree.childrens[i]);
    
    return tree;
}

// return {frag,obj}
// the fragment can be added with appendChild as HTML
// the obj contains the references to your objects
function renderTemplate(t){
    var frag = document.createDocumentFragment();
    var r = {};
    
    function createNode(t, parent, context){
        if (t.node == "stIf") {
            if (t.val) {
                return t.childrens.map(n => createNode(n, parent, context));
            }
            else
                return false;
        }
        else if (t.node == "if") {
            var nodes = [];
            context[t.ref] = { refs : {}
                             , set : function(val){
                                         if (val) {
                                             if (nodes.length != 0)
                                                 return;
                                             
                                             t.childrens.map(data=>{
                                                 var n = createNode(data, parent, context[t.ref].refs);
                                                 nodes.push(n);
                                                 parent.appendChild(n);
                                             });
                                         }
                                         else {
                                             nodes.map(n=>n.remove());
                                             nodes = [];
                                         }
                                     }
                       };
            
            if ((typeof t.val == "function" && t.val()) || (typeof t.val != "function" && t.val)) {
                return t.childrens.map(data=>{
                    var n = createNode(data, parent, context[t.ref].refs);
                    nodes.push(n);
                    return n;
                });
            }
        }
        else if (t.node == "component") {
            context[t.ref] = t.component.interface
            t.component.component.appendTo(parent);
        }
        else if (t.node == "event") {
            parent["on"+t.eventName] = t.handler;
        }
        else if (t.node == "!") {
            t.val(parent);
        }
        else if (t.node == "stLoop") {
            context[t.ref] = [];
            
            t.list.map((e,i)=>{
                var r = t.render(e);
                parent.appendChild(r.frag);
                context[t.ref][i] = r.obj;
            });
        }
        else if ( t.node == "onclick" ) {
            parent[t.node] = t.val;
            return false;
        }
        else {
            var n = document.createElement(t.node);
            
            n.className = t.classes;
            if (t.text){
                if (t.node == "input" || t.node == "textarea")
                    n.value = t.text;
                else
                    n.textContent = t.text;
            }
            if (t.html) n.innerHTML = t.html;
            if (t.ref) context[t.ref] = n;
            if (t.id) n.id = t.id;
            for ( var k in t.style ) {
                n.style[k] = t.style[k];
            }
            
            for ( var i in t.childrens ) {
                var c = createNode(t.childrens[i], n, context);
                if (c) {
                    if (c.nodeName)
                        n.appendChild(c);
                    else
                        c.map(e=>n.appendChild(e));
                }
            }
            
            return n;
        }
    }
    
    for ( var n in t.childrens ) {
        var c = createNode(t.childrens[n], frag, r);
        if (c) {
            if (c.nodeName)
                frag.appendChild(c);
            else
                c.map(e=>frag.appendChild(e));
        }
    }
    
    return { frag:frag
           , obj:r
           , appendTo:function(e){ e.appendChild(frag) ; return r; }
           , setTo   :function(e){ e.innerHTML = "" ; e.appendChild(frag) ; return r; }
           };
}

function tmpl(){
    var args = Array.from(arguments);
    
    var strings = args.splice(0,1)[0];
    
    var rsl = [];
    
    for ( var i in strings ) {
        rsl.push(strings[i]);
        if ( args.length > i )
            rsl.push({arg:args[i]});
    }
    
    var rsl2 = [];
    
    rsl.map(e=>{
        if (e.arg != undefined)
            rsl2.push(e);
        else {
            var lines = e.split("\n");
            lines.map(l=>rsl2.push(l));
        }
    });
    
    return renderTemplate(parseTemplateFromLines(rsl2));
}

function withTemplate(t){
    return renderTemplate(parseTemplate(t));
}
