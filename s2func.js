// s2共用函數
//=====================Log System========================
//Log系統 緊急程度
LOG_STRING=["DEBUG","INFO","WARN","ERROR","CRITICAL"];
LOG_DEBUG=0;
LOG_INFO=1;
LOG_WARN=2;
LOG_ERR=3;
LOG_CRIT=4;
//Log系統 錯誤位置
ERRTYPE_STRING=["good","notfound","notimplemented","exec","permission","db","fs","parameter","format","internal","notify","duplicate","nologin","connection"];
ERRTYPE_NA=0;           //系統正常，無錯誤
ERRTYPE_NOT_FOUND=1;    //找不到物件
ERRTYPE_NOT_IMPL=2;     //未實做
ERRTYPE_EXEC=3;         //執行失敗
ERRTYPE_PERMISSION=4;   //權限問題
ERRTYPE_DB=5;           //資料庫
ERRTYPE_FS=6;           //檔案系統
ERRTYPE_PARAM=7;        //參數錯誤
ERRTYPE_FORMAT=8;       //格式異常
ERRTYPE_INTERNAL=9;     //內部
ERRTYPE_NOTIFY=10;      //通知系統
ERRTYPE_DUPLICATE=11;   //重複的物件
ERRTYPE_NO_LOGIN=12;    //未登入
ERRTYPE_CONN=13;        //連線失敗

//參數：
//{function當前所在函數, params使用參數, obj當前處理物件id, action動作意義, msg傳送給使用者的訊息, imsg僅內部紀錄的錯誤訊息, client當前客戶端email, session當前客戶端}
//返回物件 {status:success / error, error_code三位數錯誤代碼，第一碼緊急程度，後兩碼錯誤位置, msg給使用者的訊息}
//usage 
//Log且返回錯誤代碼：
//log2log(logUserTrack(res, {function:"logUserTrack", params:"", obj:user._id, action:"", msg:"bad user object"}), LOG_WARN, ERRTYPE_FORMAT, res);
//客戶端將會返回 {status:"error", error_code:208, msg:"bad user object"}
//若不給訂res, 則僅log
//單純返回錯誤代碼：
//log2client({msg:"user not found"}, LOG_INFO, ERRTYPE_NOT_FOUND, res);
//客戶端將會返回 {status:"error", error_code:301, msg:"user not found"}
logUserTrack = function(req, data){ //協助標記使用者資訊於Log
    if (nov(data))
        data = {};
    if (req && req.session && req.session.me){
        data.client = req.session.me.email;
        data.session = req.sessionID;
    }
    else if (req && req.session){
        data.client = "GUEST";
        data.session = req.sessionID;
    }
    else{
        data.client = "GUEST";
    }
    return data;
};
log2log = function(data, severity, errtype, res){ //寫入Errorlog至node，若log2syslog有設定也會寫入syslog，若給訂res則也會發送錯誤紀錄給客戶端並結束res
    if (severity < logSeverity)
        return;
    if (typeof severity != "number" || severity < 0 || severity >= LOG_STRING.length)
        severity = LOG_INFO;
    if (typeof errtype != "number" || errtype < 0 || errtype >= ERRTYPE_STRING.length)
        errtype = ERRTYPE_NA;
    str = new Date().Format("yyMMdd hh:mm:ss")+": "+ns(logPrefix)+': '+ns(LOG_STRING[severity])+ "("+ns(ERRTYPE_STRING[errtype])+"): "+ns(data.function)+"("+ns(data.obj)+"): "+ns(data.client)+"("+ns(data.session)+"): "+ns(data.action)+":"+ns(data.msg)+" "+ns(data.imsg)+" "+ns(data.params);
    if (!nos(data.imsg))
        str+=" "+data.imsg;
    //return str;
    console.log(str);
    if (log2syslog)
        log2syslog(str);
    if (!nov(res))
        log2client(data, severity, errtype, res);
};
log2client = function(data, severity, errtype, res){  //發送錯誤代碼給用戶
    if (severity < logSeverity)
        return;
    if (typeof severity != "number" || severity < 0 || severity >= LOG_STRING.length)
        severity = LOG_INFO;
    if (typeof errtype != "number" || errtype < 0 || errtype >= ERRTYPE_STRING.length)
        errtype = ERRTYPE_NA;
    error_code = severity*100+errtype;
    status = "";
    if (errtype==ERRTYPE_NA)
        status = "success";
    else
        status = "error";
    let ret = JSON.stringify({status:status, error_code:error_code, msg:ns(data.msg)});
    if (!nov(res))
        res.end(ret);
    return ret;
};
log2syslog = function(str){     //將log寫入syslog
    //TODO: change to native syslog
    const { exec } = require('child_process');
    str = str.replace(/;|'|\|/g,''); //TODO: security check!
    exec('logger \''+str+"'", (err, stdout, stderr) => {
        if (err) {
            console.log('JAICAS: ERROR: failed to write syslog: '+err);
            return;
        }
    });
};
loglog = function(data, level){ //舊設定：直接寫入文字到log，僅用於除錯用途
    //if (typeof level != "number" || level < LOG_DEBUG || level > LOG_CRIT){
    //    level = LOG_INFO;
    level = LOG_DEBUG;
    if (level >= logSeverity){
        console.log(logPrefix+': '+LOG_STRING[level]+ ": " + data);
        if (log2syslog)
            logsyslog(data, level);
    }
};
logsyslog = function(data, level){//同上
    //if (typeof level != "number" || level < LOG_DEBUG || level > LOG_CRIT)
    //    level = LOG_INFO;
    level = LOG_DEBUG;
    const { exec } = require('child_process');
    var message = logPrefix+': '+LOG_STRING[level]+ ": " + data;
    message = message.replace(/;|\||'/g,''); //TODO: security check!
    exec('logger \''+message+"'", (err, stdout, stderr) => {
        if (err) {
            console.log('ERROR: failed to write syslog: '+err);
            return;
        }
    });
};

//=====================String process========================
nov = function(data){  //not a value
    if (typeof data == "undefined" || data==null)
        return true;
    return false;
};
nos = function(data){  //not a valid string
    if (typeof data !== "string" || data.trim()==="")
        return true;
    return false;
};
ns = function(s){   //空物件轉換成空字串
    if (nov(s))
        return "";
    return s;
};

checkRegex = function(type, data){  //字串格式檢查，請把regex集中到此處
    regexArray = {};
    regexArray["hostname"] = new RegExp(/^[a-zA-Z0-9\-_\.]*$/);
    regexArray["url"] = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
    regexArray["filepath"] = new RegExp(/^\/([a-zA-Z0-9\_\-\.]+\/?)*$/);
    regexArray["filename"] = new RegExp(/^[a-zA-Z0-9_\-\.]+$/);
    regexArray["slidename"] = new RegExp(/^\/(\S+)\/(\d+)\.(.*)$/);
    regexArray["slidefilename"] = new RegExp(/^(\d+)\.([a-zA-Z0-9]+)(\.gz)?$/); 

    regexArray["user"] = new RegExp(/^[a-zA-Z0-9\-_\.]*$/);
    regexArray["cellphone"] = new RegExp(/^[0-9\-\*\(\)#]*$/);
    regexArray["email"] = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

    regexArray["num"] = new RegExp(/^[0-9]+$/);
    regexArray["id"] = new RegExp(/^[a-zA-Z0-9\_\-\.]+$/); //MongoDB UUID
    regexArray["csv"] = new RegExp(/^[=\|a-zA-Z0-9\_\-\.,<>'"():\s]+$/);
    regexArray["ip"] = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/);
    regexArray["ipv4"] = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
    regexArray["ipv6"] = new RegExp(/^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/);
    regexArray["passwd"] = new RegExp(/^.+$/);
    regexArray["key"] = new RegExp(/^[a-zA-Z0-9\_\-\.]+$/); //MongoDB UUID
    regexArray["cef"] = new RegExp(/^CEF:\d+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|.*$/); 
    regexArray["cef_inside"] = new RegExp(/^.*CEF:\d+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|.*$/); 

    if (type=="json"){
        try {
            JSON.parse(data);
            return true;
        } catch (e) {
            return false;
        }
    }
    if (regexArray[type]==undefined)
        return false;
    return regexArray[type].test(data);
};
/*各種測試
var type, data;
type="hostname"; data="507f1f77bcf86cd79943-_.9011";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="url"; data="http://www.regexplanet.com/advanced/javascript/index.html";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="filepath"; data="/advanced/javascript/";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="filename"; data="index.html";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="user"; data="507f1f77bcf86cd79943-_.9011";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="email"; data="Cindy.Liu@tw.fujitsu.com";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="num"; data="1234567890";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="id"; data="59b259d1885cea00d9ad9a7e";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="csv"; data="aaa,<bbb>,'ccc'";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="ipv4"; data="212.212.100.110";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="ipv6"; data="0000:0000:0000:0000:0000:0000:0000:0001";
console.log(type+": "+checkRegex(type, data)+" data:"+data);
type="unknown"; data="aaa,bbb,ccc";
console.log(type+": "+checkRegex(type, data)+" data:"+data);*/


// a&b is String of number, if a>b = 1, a==b = 0, a<b = -1, not number = undefined
numStrCmp = function(a, b){         //單純字串比大小
    regex_num = new RegExp(/^[0-9]+$/);
    if (!regex_num.test(a) || !regex_num.test(b))
        return undefined;
    if (a.length > b.length)
        return 1;
    else if (a.length < b.length)
        return -1;
    else if (a===b)
        return 0;
    else if (a>b)
        return 1;
    else
        return -1;
};

numStrGE = function(a, b){          //if a >= b ?
    var res = numStrCmp(a,b);
    if (res==undefined)
        return undefined;
    if (res==-1)
        return false;
    return true;
};

genRandomString = function(length){ //生成指定長度隨機字串
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

escapeJavaString = function(s){     //字串清理：Java
    if (nos(s))
        return "";
    return s.replace(/\\/g,'\\\\');
};
escapeCEFString = function(s){      //字串清理：CEF
    if (nos(s))
        return "";
    return s.replace(/\\/g,'\\\\').
            //replace(/\b/g,'\\b').
            replace(/\f/g,'\\f').
            replace(/\r/g,'\\r').
            replace(/\n/g,'\\n').
            replace(/\t/g,'\\t').
            replace(/=/g,'\\=').
            replace(/\"/g,'\\"');
};
escapeCSVString = function(s){      //字串清理：CSV
    if (nos(s))
        return "";
    if (s.includes(","))
        return '"'+s.replace(/\"/g,'')+'"';
    return s;
};

Date.prototype.Format = function (fmt) { //時間轉格式化字串  author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}; //var time2 = new Date().Format(“yyyy-MM-dd hh:mm:ss”);

csv2array = function(str, split){
    let res = [];
    if (nos(str))
        return res;
    if (split==undefined)
        split=",";
    let ps = str.split(split);
    for(let i=0;i<ps.length;i++)
        res.push(ps[i].trim());
    return res;
};
array2csv = function(titles){
    if (titles==undefined || !Array.isArray(titles))
        return undefined;
    let res = undefined;
    for(let i=0;i<titles.length;i++)
        if (res==undefined)
            res = titles[i];
        else
            res += ","+titles[i];
    return res;
};
json2csv = function(line, titles){ 
    if (line==undefined || titles==undefined || !Array.isArray(titles))
        return undefined;
    let j = JSON.parse(line);
    if (j==undefined)
        return undefined;
    let res=undefined;
    for (let i=0;i<titles.length;i++){
        let d = j[titles[i]];
        if (d==undefined)
            d = "";
        if (res==undefined)
            res=d;
        else
            res+=","+d;
    }
    return res;
};

//....應該搬到fs去
//=====================fs proccess========================
/*getKeyFromFilename = function(s){ //這裡假定檔案名稱為 /store_id/2017010101.csv[.gz] 
    if (!checkRegex("slidename", s))
        return undefined;
    return s.split('/')[1];
};*/
parseSlidename = function(s){       //從slide name中取出timestamp, key, format
    let slidename = new RegExp(/^\/(\S+)\/(\d+)\.(.*)$/); 
    let arr = slidename.exec(s);
    if (arr == undefined)
        return undefined;
    return {timestamp:arr[2], key:arr[1], format:arr[3], filename:s};
};

filenameRangeCheck = function(name, start, end){ //檢查檔名是否符合指定時間範圍內，name= 2017010101.csv.gz
    var q = name.split(".");
    if (!checkRegex("num",q[0])) 
        return undefined;
    if (start!=undefined && end!=undefined)
        return (numStrGE(q[0], start) && numStrGE(end, q[0]));
    else if (start!=undefined)
        return numStrGE(q[0], start);
    else if (end!=undefined)
        return numStrGE(end, q[0]);
    return true;
};

filenameStringMatch = function(start, end){
    if ((!checkRegex("num",start) && start !=undefined) || !checkRegex("num",end) ) 
        return undefined;
    if(start ==undefined){
        return end.substring(0,0);
    }
    for(var i = 1; i <= end.length; i++) {
         if(start.substring(0,i)!= end.substring(0,i)){
            return  end.substring(0,i-1);
         }
    }
    return end;
};

//=====================檔案系統========================
nextFile = function(filepath, callback){    //找到該目錄檔案排序的下一個檔案
    let filename = path.basename(filepath);
    let filepreserent = path.dirname(filepath)+"/";
    let sp = filename.indexOf(".");
    let type=filename.substring(sp+1);
    let fileslide=filename.substring(0,sp);
    fs.readdir(filepreserent, function(err, files){
        let head;
        let currentCloseest = undefined;
        let currentCloseestFile = undefined;
        for (let j=0;j<files.length;j++){
            if (files[j][sp]!='.' || files[j].substring(0,sp).indexOf(".")!=-1)
                continue;
            head = files[j].substring(0,sp);
            if (fileslide >= head)
                continue;
            if (currentCloseest==undefined || currentCloseest > head){
                currentCloseest = head;
                currentCloseestFile = files[j];
            }
        }
        callback(filepreserent+currentCloseestFile);
    });
};

createDir = function(targetDir){        //給訂路徑，遞迴生成該目錄
    if (fs.existsSync(targetDir))
        return;
    const path = require('path');
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      if (!fs.existsSync(curDir)) 
        fs.mkdirSync(curDir);
      return curDir;
    }, initDir);
};

//=====================密碼hash========================
//salted hash format >> salt:hash
sha512salt = function(password, salt){                  //hash
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return value;
};

genSaltedHash = function(userpassword) {                //生成salted hash
    var salt = genRandomString(salt_length);
    var passwordData = sha512salt(userpassword, salt);
    return salt+":"+passwordData;
};
chechSaltedHash = function(userpassword, hash) {        //檢查密碼是否符合hash
    if (nov(userpassword) || nov(hash))
        return false;
    var h = hash.split(":");
    if (h[1]===sha512salt(userpassword, h[0]))
        return true;
    else 
        return false;
};

//=====================登入、權限、擁有確認========================
isLogin = function(req) {
    if (nov(req.session.me))
        return false;
    else
        return true;
};
isAdmin = function(req) {
    if (nov(req.session.me))
        return false;
    else
        return req.session.me.admin;
};
isOwnerAdmin = function(req, obj) {
    if (nov(req.session.me) || nov(obj))
        return false;
    if (req.session.me.admin)
        return true;
    return req.session.me._id === obj.owner_id;
};
/*
02:59 SEFI Promise解：
var urls = ['url1', 'url2', 'url3']
function getData (url) {
  console.log('request from ' + url)
  return new Promise( function(resolve, reject) {
    setTimeout(function(){
      resolve('[DATA from ' + url + ']')
    }, 1000)
  })
}
var promise = urls.reduce(function(prev, cur){
  return prev = !prev ? getData(cur) : prev.then(function(data){
    console.log('received data : ' + data)
    return getData(cur)
  })
}, promise)
promise.then((data) => console.log('received data : ' + data, '>>END'))


03:26 SEFI async await解(ES7+)：
const urls = ['url1', 'url2', 'url3']
function getData(url) {
  console.log(`request from ${url}`)
  return new Promise(resolve => setTimeout(() => resolve(`[DATA from ${url}]`), 1000))
}
async function doRequests() {
  for(let url of urls) console.log(await getData(url))
}
doRequests()


//do stream pipes
var http = require('http'),
    util = require('util'),
    fs   = require('fs');
server = http.createServer(function(req, res){  
    var stream  = fs.createReadStream('/tmp/a'),
        stream2 = fs.createReadStream('/tmp/b');
    stream.on('end', function(){
        stream.unpipe(res);
        stream2.pipe(res, { end:false});
    });
    stream2.on('end', function(){
        stream2.unpipe(res);
        res.end("Thats all!");
    });
    res.writeHead(200, {'Content-Type' : 'text/plain'});
    stream.pipe(res, { end:false});
}).listen(8001);


//do stream urls
var http = require('http'),
    util = require('util'),
    fs   = require('fs'),
    url = require('url'),
    request = require('request');
writeRemoteUrl = function(pack){
    var res = pack.res;
    return new Promise(function (resolve, reject) {
        var rem = request(pack.urls[pack.index]);
          rem.on('data', function(chunk) {
            console.log(chunk);
            res.write(chunk);
          });
          rem.on('end', function() {
            console.log("[part "+pack.index+" end]");
            pack.callback();
            resolve();
          });
          rem.on('error', function() {
            console.log("[part "+pack.index+" end with error]");
            pack.callback();
            resolve();
          });
    });
}
server = http.createServer(function(req, res){  
    var urls = ["http://www.ccsakura-net.com/up/a","http://www.ccsakura-net.com/up/b","http://www.ccsakura-net.com/up/a","http://www.ccsakura-net.com/up/b"];
    res.writeHead(200, {'Content-Type' : 'text/plain'});
    var pack={};
    pack.index=0;
    pack.urls = urls;
    pack.res = res;
    pack.callback = function(){
        this.index++;
        if (this.index < this.urls.length){
            console.log("REC: "+this.index+"/"+(this.urls.length-1));
            writeRemoteUrl(this);
        }
        else{
            console.log("[end of all stream]");
            res.end("END");
        }
    };
    writeRemoteUrl(pack);
    console.log("start piping 0");
}).listen(8001);


//取得表單與檔案上傳
var http = require('http'),
    util = require('util'),
    fs   = require('fs'),
    url = require('url'),
    request = require('request');
var formidable = require('formidable');

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.multiples = true;

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(JSON.stringify({fields: fields, files: files}));
    });

    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="text" name="title2"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(8080);
{ fields: { title: 'werqwe' },
  files: 
   { upload: 
      File {
        domain: null,
        _events: {},
        _eventsCount: 0,
        _maxListeners: undefined,
        size: 248084,
        path: '/tmp/upload_8dc3aa1c7982691a27506a996993c1cb',
        name: '6Eu596mfWmhDpviUnppa.jpg',
        type: 'image/jpeg',
        hash: null,
        lastModifiedDate: 2017-09-19T08:34:16.120Z,
        _writeStream: [Object] } } }
Formatted JSON Data
{  
   "fields":{  
      "title":"aaa",
      "title2":"bbb"
   },
   "files":[  
         {  
            "size":66567,
            "path":"/tmp/upload_5f4a08ee66547de60cc64971cbbdfb50",
            "name":"6D7UZb5aQdQ43McgWAmH.jpg",
            "type":"image/jpeg",
            "mtime":"2017-09-19T08:40:34.472Z"
         },
         {  
            "size":248084,
            "path":"/tmp/upload_fa1de00bb720eda38f650e9cba066fab",
            "name":"6Eu596mfWmhDpviUnppa.jpg",
            "type":"image/jpeg",
            "mtime":"2017-09-19T08:40:34.472Z"
         }
      ]
}
*/
