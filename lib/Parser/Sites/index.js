const URL = require("url");
const path = require("path");
const fs = require("fs");
const auto = require("./auto");

function encode(selector,name){
    if (typeof selector !== "function"){
        var fn = "try{return " + (selector ? '(' + selector + ')' : '') + "}catch(e){console.log('warning: A error occur in " + name + "')}";
        return new Function("$",fn);
    }else {
        return function ($){
            var self=this;
            try{
                return selector.call(self,$);
            }catch (e){
                console.log('warning: A error occur in '+name);
            }
        }
    }
}

function compile(options){
    var parsed = {};
    for (var x in options){
        var v = options[x];
        if (typeof v == "object"){
            var sub = compile(v);
            parsed[x] = sub;
        }else {
            try{
                parsed[x] = encode(v,x).bind(parsed);
            }catch (e){
                console.log("warning: A error is found when compile of " + x)
            }
        }
    }
    return parsed;
}

var Sites = [];

var files = fs.readdirSync(path.join(__dirname,'defaut'));
files.forEach(function (file){
    try{
        var site = require("./defaut/"+file);
        site.selector = compile(site.selector);
        Sites.push(site);
    }catch (error){
        console.log("warning:"+error)
    }
});
files = fs.readdirSync(path.join(__dirname,'plugins'));
files.forEach(function (file){
    try{
        var site = require("./plugins/"+file);
        site.selector = compile(site.selector);
        Sites.push(site);
    }catch (error){
        console.log("warning:"+error)
    }
});

module.exports = {
    search:function (url){
        var host = URL.parse(url).hostname;
        for (var i=0;i<Sites.length ;i++ ){
            var site = Sites[i];
            if (site.host === host){
                return site;
            }
        }
        for (var i=0;i<Sites.length ;i++ ){
            var site = Sites[i];
            if (site.match.indexOf(host) >= 0){
                return site;
            }
        }
        return auto;
    }
}