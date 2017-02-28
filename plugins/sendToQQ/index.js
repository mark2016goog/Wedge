module.exports = function (Ip,Files){
    var fs = this.lib.fs,
        Path = this.lib.Path,
        Random = this.lib.Random,
        request = this.request;

    var post = (file,next)=>{
        try{
            var body = fs.readFileSync(file);
        }catch (err){
            this.log(err.toString());
            return next();
        }
        var boundary = '----WebKitFormBoundary' + Random.uuid(16);
        var filename = Path.basename(file);
        var payload = [];
        var head = '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="newfile"; filename="' + filename + '"\r\n'
            + 'Content-Type: application/octet-stream\r\n'
            + '\r\n';
        var tail = '\r\n--' + boundary + '--';
        payload.push(new Buffer(head));
        payload.push(body);
        payload.push(new Buffer(tail));
        payload = Buffer.concat(payload);
        request.post(Ip)
        .setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary)
        .send(payload)
        .end(()=>{
            console.log(filename + " 上传成功");
            next();
        });
    }

    if (Ip && Files) return this.parallel(Files,post,this.noop,1);

    var self = this;

    var getIP = fn=>{
        return self.terminal(["请输入IP地址："],function (ip){
            var regexp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
            var found = ip.match(regexp);
            if (!found){
                console.log("IP地址不正确");
                return getIP(fn);
            }
            Ip = 'http://' + found[0] + ':5299/upload';
            return fn();
        });
    }

    var sendBook = ()=>{
        return self.terminal(["拖动文件到窗口："],dir=>{
            dir = dir.replace(/^"/,'').replace(/"$/,'');
            if (dir == '') return process.exit();
            var stat = fs.statSync(dir);
            if (stat.isDirectory()){
                try{
                    var files = fs.readdirSync(dir);
                    files = files.map(file=>Path.join(dir,file));
                    return self.parallel(files,post,sendBook,1);
                }
                catch (err){
                    return sendBook();
                }
            }
            if (stat.isFile()){
                return post(dir,sendBook);
            }
            return sendBook();
        });
    }
    return getIP(sendBook);
}