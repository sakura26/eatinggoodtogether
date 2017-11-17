var express = require('express');
var router = express.Router();

/* 檢查物件格式是否正確
輸入：user物件
回傳：undefined / 錯誤的欄位字串csv
*/
userCheck = function(user){  //check all parameter is right, return string for bad params/undefined 
    var err = false;
    var firstapp = "";
    var errmsg = "";
    if (nov(user)){
        err = true;
        return "user";
    }
    /*if (!checkRegex("user",user.nickname)){
        err = true; errmsg += firstapp+"key"; firstapp = ",";
    } */
    if (err)
        return errmsg;
    else
        return undefined;
};
/* 初始化：找到管理者，如果不存在則建立新的
設定參數：siteAdmin 
*/
initAdmin = function(){
    User.findOne({email:siteEmail, deleted_at:undefined}, function (err, user){
        if (err){
            log2log({function:"initAdmin", params:"", obj:"", action:"find admin", imsg:err}, LOG_ERR, ERRTYPE_DB);
            return;
        }
        if (nov(user)){
            //init admin user
            log2log({function:"initAdmin", params:"", obj:"", action:"", msg:"admin not found, create new admin"}, LOG_WARN, ERRTYPE_NA);
            var user = new User( {
                nickname    : "admin",
                email    : siteEmail,
                email_validated_at: Date.now(),
                sms_validated_at: Date.now(),
                passwd    : genSaltedHash("initiAlAdmin"),
                admin: true,
                disabled    : false,
                created_at : Date.now()
            } );
            user.save(function (err, fluffy) {
                if (err){
                    log2log({function:"initAdmin", params:"", obj:"", action:"add admin", imsg:err}, LOG_ERR, ERRTYPE_DB);
                    return;
                } 
                log2log({function:"initAdmin", params:"", obj:user._id, action:"add admin"}, LOG_WARN, ERRTYPE_NA);
                siteAdmin = user._id;
                //send email validate 
                var mailOptions = {
                    from: siteEmail, // sender address
                    to: user.email, // list of receivers
                    subject: '['+siteTitle+'] Admin inited '+user._id+'!', // Subject line
                    text: '...\n'
                    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        log2log({function:"initAdmin", params:user.email, obj:user._id, action:"notify admin", imsg:error}, LOG_ERR, ERRTYPE_NOTIFY);
                    }else{
                    };
                });
              });
        }
        else{
            siteAdmin = user._id;
            log2log({function:"initAdmin", params:"", obj:siteAdmin, action:"", msg:"site admin"}, LOG_INFO, ERRTYPE_NA);
        }
    });
};
initAdmin();

/* API:
POST /users/:id 修改使用者（含新增）
權限：GUEST
參數：email(必要), nickname, passwd(必要)
回傳：{status:'success', user:user}
*/
router.post('/:id/update', function(req, res) {
    let debug = req.query.debug;
    Preorder.findById(req.params.id, function(err, obj){
        if (err){
            loglog("user.edit query fail: "+err);
            res.render('errormsg', {status:"error", msg:"user not found", imsg:err, redirect:undefined});
            return;
        }
        if(obj==undefined){ //new
            obj = new User({
                nickname: req.body.nickname,
                email: req.body.email
            });
            email_validate_string = genRandomString(10);
            if (req.body.passwd)
                obj.passwd = genSaltedHash(req.body.passwd);
            else
                obj.passwd = genSaltedHash(genRandomString(6));
            if (req.body.cellphone)
                obj.cellphone = req.body.cellphone;
            if (req.body.fb)
                obj.fb = req.body.fb;
            if (req.body.shipping_name)
                obj.shipping_name = req.body.shipping_name;
            if (req.body.shipping_zip)
                obj.shipping_zip = req.body.shipping_zip;
            if (req.body.shipping_counrty)
                obj.shipping_counrty = req.body.shipping_counrty;
            if (req.body.shipping_address)
                obj.shipping_address = req.body.shipping_address;
            if (req.body.shipping_phone)
                obj.shipping_phone = req.body.shipping_phone;
            if (req.body.shipping_note)
                obj.shipping_note = req.body.shipping_note;
            if (req.body.prefer_pickup)
                obj.prefer_pickup = req.body.prefer_pickup;
            obj.save();
            //send email validate 
            var mailOptions = {
                from: siteEmail, // sender address
                to: req.body.email, // list of receivers
                subject: '['+siteTitle+'] Welcome to join us '+obj.nickname+'! Please comform your Account.', // Subject line
                text: 'Please click this link to conform your account: \n'+ //, // plaintext body
                    siteHost+'/users/'+user._id+'/validate/'+user.email_validate_string+' \n'
                // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    log2log(logUserTrack(req, {function:"user.add", params:user.email, obj:user._id, action:"notify user", msg:"send mail fail", imsg:error}), LOG_ERR, ERRTYPE_NOTIFY);
                }
            });
            req.render("errormsg",{status:"success", msg:"account add success", redirect:"/"});
        }
        else{ //already exist user - validate permission

        }
        // basic parameter
        if (!nos(req.body.title))
            obj.title = req.body.title;
        if (!nos(req.body.subtitle))
            obj.subtitle = req.body.subtitle;
        if (!nos(req.body.short_desc))
            obj.short_desc = req.body.short_desc;
        if (!nos(req.body.desc))
            obj.desc = req.body.desc;
        if (!nos(req.body.tags))
            obj.tags = csv2array(req.body.tags);
        if (!nos(req.body.start_at))
            obj.start_at = req.body.start_at;
        if (!nos(req.body.end_at))
            obj.end_at = req.body.end_at;
        if (!nos(req.body.shipping_expect_at))
            obj.shipping_expect_at = req.body.shipping_expect_at;
        if (!nos(req.body.image_large))
            obj.image_large = req.body.image_large;
        if (!nos(req.body.image_small))
            obj.image_small = req.body.image_small;
        if (!nos(req.body.pickup_method))
            obj.pickup_method = csv2array(req.body.pickup_method);
        //format check
        if (debug)
            loglog("debug req: "+JSON.stringify(req.body));
        let prodListId = [];
        let prodList = [];
        Product.findById(obj.products, function(err, products){  //get all old products
            if (Array.isArray(products) && Array.isArray(req.body.product_exist_id)){ //update old products
                for (let i=0;i<req.body.product_exist_id.length;i++){
                    for (let j=0;j<products;j++){
                        if (products[j]._id==req.body.product_exist_id[i]){
                            if (!nos(req.body.product_exist_tags[i]))
                                products[j].tags = csv2array(req.body.product_exist_tags[i]);
                            if (!nos(req.body.product_exist_title[i]))
                                products[j].title = req.body.product_exist_title[i];
                            if (!nos(req.body.product_exist_subtitle[i]))
                                products[j].subtitle = req.body.product_exist_subtitle[i];
                            if (!nos(req.body.product_exist_short_desc[i]))
                                products[j].short_desc = req.body.product_exist_short_desc[i];
                            if (!nos(req.body.product_exist_desc[i]))
                                products[j].desc = req.body.product_exist_desc[i];
                            if (!nos(req.body.product_exist_image_large[i]))
                                products[j].image_large = req.body.product_exist_image_large[i];
                            if (!nos(req.body.product_exist_unit[i]))
                                products[j].unit = req.body.product_exist_unit[i];
                            if (!nos(req.body.product_exist_unit_prize[i]))
                                products[j].unit_prize = req.body.product_exist_unit_prize[i];
                            if (!nos(req.body.product_exist_max[i]) && Number.isInteger(req.body.product_exist_max[i]))
                                products[j].max = req.body.product_exist_max[i];
                            else
                                products[j].max = -1;
                            if (!nos(req.body.product_exist_min[i]) && Number.isInteger(req.body.product_exist_min[i]))
                                products[j].min = req.body.product_exist_min[i];
                            else
                                products[j].min = -1;
                            if (!nos(req.body.product_exist_max_per_order[i]))
                                products[j].max_per_order = req.body.product_exist_max_per_order[i];
                            if (req.body.product_exist_pickup_method && req.body.product_exist_pickup_method[i])
                                prod.pickup_method = csv2array(req.body.product_exist_pickup_method[i]);
                            if (!nos(req.body.product_exist_image_small[i]))
                                products[j].image_small = req.body.product_exist_image_small[i];
                            if (!nos(req.body.product_exist_src_country[i]))
                                products[j].src_country = req.body.product_exist_src_country[i];
                            if (!nos(req.body.product_exist_src_producer[i]))
                                products[j].src_producer = req.body.product_exist_src_producer[i];
                            if (!nos(req.body.product_exist_brend[i]))
                                products[j].brend = req.body.product_exist_brend[i];
                            if (!nos(req.body.product_exist_unit_profit[i]))
                                products[j].unit_profit = req.body.product_exist_unit_profit[i];
                            if (!nos(req.body.product_exist_package_info[i]))
                                products[j].package_info = req.body.product_exist_package_info[i];
                            //products[j].save();
                            prodListId.push(products[j]._id);
                            prodList.push(products[j]);
                        }
                    }
                }
            }
            if (Array.isArray(req.body.product_title)){ //create new products
                let prod;
                for (let i=0;i<req.body.product_title.length;i++){
                    if (nos(req.body.product_title[i]))
                        continue;
                    //loglog("process product_title[i]: "+req.body.product_title[i]);
                    prod = new Product({
                        title: req.body.product_title[i],
                        subtitle: req.body.product_subtitle[i],
                        short_desc: req.body.product_short_desc[i],
                        desc: req.body.product_desc[i],
                        image_large: req.body.product_image_large[i],
                        unit: req.body.product_unit[i],
                        unit_prize: req.body.product_unit_prize[i],
                        max_per_order: req.body.product_max_per_order[i]/*,
                        pickup_method: req.body.product_pickup_method[i],
                        max: req.body.product_max[i],
                        mix: req.body.product_min[i],
                        remain: req.body.product_max[i],
                        image_small: req.body.product_image_small[i],
                        src_country: req.body.product_src_country[i],
                        src_producer: req.body.product_src_producer[i],
                        brend: req.body.product_brend[i],
                        unit_profit: req.body.product_unit_profit[i],
                        package_info: req.body.product_package_info[i]*/
                    });
                    if (req.body.product_max && req.body.product_max[i] && Number.isInteger(req.body.product_max[i]))
                        prod.max = req.body.product_max[i];
                    else
                        prod.max = -1;
                    prod.remain = prod.max;
                    if (req.body.product_min && req.body.product_min[i] && Number.isInteger(req.body.product_min[i]))
                        prod.min = req.body.product_min[i];
                    else
                        prod.min = -1;
                    if (req.body.product_tags && req.body.product_tags[i])
                        prod.tags = csv2array(req.body.product_tags[i]);
                    if (req.body.product_pickup_method && req.body.product_pickup_method[i])
                        prod.pickup_method = csv2array(req.body.product_pickup_method[i]);
                    if (req.body.product_image_small && req.body.product_image_small[i])
                        prod.image_small = req.body.product_image_small[i];
                    if (req.body.product_src_country && req.body.product_src_country[i])
                        prod.src_country = req.body.product_src_country[i];
                    if (req.body.product_src_producer && req.body.product_src_producer[i])
                        prod.src_producer = req.body.product_src_producer[i];
                    if (req.body.product_brend && req.body.product_brend[i])
                        prod.brend = req.body.product_brend[i];
                    if (req.body.product_unit_profit && req.body.product_unit_profit[i])
                        prod.unit_profit = req.body.product_unit_profit[i];
                    if (req.body.product_package_info && req.body.product_package_info[i])
                        prod.package_info = req.body.product_package_info[i];
                    if (!debug)
                        prod.save();
                    prodListId.push(prod._id);
                    prodList.push(prod);
                }
            }
            obj.products = prodListId;
            if (!debug)
                obj.save();
            let prod_pickup = {}; //所有的商品的取貨方式
            let pickup = [];
            for (let i=0;i<prodList.length;i++){
                for (let j=0;j<prodList[i].pickup_method.length;j++){
                    prod_pickup[prodList[i].pickup_method[j]] = prodList[i].pickup_method[j];
                }
            }
            if (obj.pickup_method && obj.pickup_method.length>0){
                for (let i in prod_pickup){
                    for (let j=0;j<obj.pickup_method.length;j++){  //整理出允許的取貨方式
                        if (i==obj.pickup_method[j]){
                            pickup.push(i);
                        }
                    }
                }
            }
            else
                for (let i in prod_pickup) //或列出所有可能的取貨方式
                    pickup.push(i);
            if (debug){
                loglog("DEBUG: preorder: "+JSON.stringify(obj));
                loglog("DEBUG: products: "+JSON.stringify(prodList));
                loglog("DEBUG: pickup: "+JSON.stringify(pickup));
                res.render('preorder_show', {status:"ok", preorder:obj, products:prodList, pickup:pickup});
            }
            res.redirect('/preorders/'+obj._id+"/view");
        });
    });
});
router.post('/', function(req, res) { //regist
    if (nov(req.body.email) || nov(req.body.passwd) || req.body.email.match(/^[a-zA-Z0-9-_]+@[a-zA-Z0-9-_\.]+[a-zA-Z0-9]+$/g)==null){
        log2client({msg:"bad parameter"}, LOG_ERR, ERRTYPE_PARAM, res);
        return;
    }
    //todo: if user not validate, keep 2 days
    //check is email in use
    User.findOne({email:req.body.email, deleted_at:undefined}, function (err, user){
        if(err || !nov(user)){
            log2client({msg:"email used"}, LOG_ERR, ERRTYPE_DUPLICATE, res);
            return;
        }
        //create new user
        var nickname;
        if (nov(req.body.nickname))
            nickname = req.body.email;
        else
            nickname = req.body.nickname;
        var hash = genSaltedHash(req.body.passwd);
        var user = new User( {
            nickname    : nickname,
            email    : req.body.email,
            email_validate_string: genRandomString(5),
            email_validated: false,
            passwd    : hash,
            level    : 0,
            admin: false,
            //group    : { type: String },
            //external_data    : { type: String },
            disabled    : false,
            created_at : Date.now()
        } );
        var check = userCheck(user);
        if(check!=undefined){
            log2client(logUserTrack(req, {msg:check}), LOG_ERR, ERRTYPE_FORMAT, res);
            return;
        }
        user.save(function (err, fluffy) {
            if (err){
                log2log(logUserTrack(req, {function:"user.add", params:"", obj:"", action:"add", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            } 
            log2log(logUserTrack(req, {function:"user.add", params:req.body.email, obj:user._id, action:"add", msg:"new user added"}), LOG_WARN, ERRTYPE_NA);

            //send email validate 
            var mailOptions = {
                from: siteEmail, // sender address
                to: req.body.email, // list of receivers
                subject: '[JAICAS] Welcome to join us '+req.body.nickname+'! Please comform your Account.', // Subject line
                text: 'Please click this link to conform your account: \n'+ //, // plaintext body
                    siteHost+'/users/'+user._id+'/validate/'+user.email_validate_string+' \n'
                // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    log2log(logUserTrack(req, {function:"user.add", params:user.email, obj:user._id, action:"notify user", msg:"send mail fail", imsg:error}), LOG_ERR, ERRTYPE_NOTIFY);
                }
            });
            //login user
            var t = user.toObject();
            delete t.passwd;
            delete t.email_validate_string;
            req.session.me = t;
            if (user.admin)
                log2log(logUserTrack(req, {function:"user.login", params:"", obj:user._id, action:"login", msg:"admin login"}), LOG_WARN, ERRTYPE_NA);
            else
                log2log(logUserTrack(req, {function:"user.login", params:"", obj:user._id, action:"login", msg:"success"}), LOG_INFO, ERRTYPE_NA);
            res.end(JSON.stringify({status:'success', user:t}));
        });
    });
});
//TODO: resend email conform

/* API:
GET /users/me 取得當前登入之使用者資料
權限：USER
回傳：{status:'success', user:user}

GET /users/:id  取得任意使用者資料
權限：ADMIN
回傳：{status:'success', user:user}

GET /users/logout  使用者登出
權限：USER
回傳：{status:'success'}
*/
router.get('/:id', function(req, res) { //get
    if (req.params.id==='me'){
        if (nov(req.session.me)){
            log2client({msg:"no login"}, LOG_ERR, ERRTYPE_NO_LOGIN, res);
            return;
        }
        res.end(JSON.stringify({status:'success', user:req.session.me}));
        return;
    }
    else if (req.params.id==='logout'){
        logout(req,res);
        return
    }
    else{
        User.findOne({_id:req.params.id, deleted_at:null}, function (err, user){
            if (err){
                log2log(logUserTrack(req, {function:"user.get", params:"", obj:req.params.id, action:"get", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            }
            if (isOwnerAdmin(req, user)){
                t = user.toObject();
                delete t.passwd;
                delete t.email_validate_string;
                res.end(JSON.stringify({status:'success', user:t}));
            }else{
                log2log(logUserTrack(req, {function:"user.get", params:"", obj:req.params.id, action:"get", msg:"no permission"}), LOG_ERR, ERRTYPE_PERMISSION, res);
            }
        });
    }
});

/* API: 
GET /users/  取得使用者列表
權限：ADMIN
回傳：{status:'success', users:[]}
*/
router.get('/', function(req, res) { //list
    if (isAdmin(req)){
        User.find({deleted_at:null}, function (err, users){
            if (err){
                log2log(logUserTrack(req, {function:"user.list", params:"", obj:"", action:"list", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            }
            if (nov(users)){
                log2log(logUserTrack(req, {function:"user.list", params:"", obj:"", action:"list", msg:"user not found"}), LOG_ERR, ERRTYPE_NOT_FOUND, res);
                return;
            }
            for (let i=0;i<users.length;i++){
                delete users[i].email_validate_string;
                delete users[i].passwd;
            }
            res.end(JSON.stringify({status:'success', users:users}));
        });
    }
    else{
        log2log(logUserTrack(req, {function:"user.list", params:"", obj:"", action:"list", msg:""}), LOG_ERR, ERRTYPE_PERMISSION, res);
    }
});

/* API: 
GET /users/:id/validate/:val  使用者帳戶驗證
權限：GUEST
回傳：{status:'success'}
*/
router.get('/:id/validate/:val', function(req, res) { //account validate
    User.findOne({_id:req.params.id, email_validate_string:req.params.val, deleted_at:null}, function (err, user){
        if (err){
            log2log(logUserTrack(req, {function:"user.validate", params:"", obj:req.params.id, action:"validate", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
            return;
        }
        if (nov(user)){
            log2log(logUserTrack(req, {function:"user.validate", params:"", obj:req.params.id, action:"validate", msg:"user not found"}), LOG_ERR, ERRTYPE_NOT_FOUND, res);
            return;
        }
        user.email_validated = true;
        user.email_validate_string = undefined;
        user.save(); //TODO: redirect to message and index
        res.end(JSON.stringify({status:'success'}));
        log2log(logUserTrack(req, {function:"user.validate", params:"", obj:req.params.id, action:"validate", msg:"success"}), LOG_DEBUG, ERRTYPE_NA);
    });
});

/* API: 
POST /users/login 使用者登入
權限：GUEST
參數：email(必要), passwd(必要)
回傳：{status:'success', user:user}

POST /users/me 使用者編輯(當前登入帳戶)
權限：USER
參數：nickname, passwd
回傳：{status:'success', user:user}

POST /users/:id 任一使用者編輯
權限：ADMIN
參數：nickname, passwd, email, email_validated, level, group, external_data, disabled, email_validate_string
回傳：{status:'success', user:user}
*/
router.post('/:id', function(req, res) { //edit
    if (req.params.id==='login'){
        login(req,res);
        return;
    }
    else if (req.params.id==='me'){
        if (nov(req.session.me)){
            log2client({msg:"no login"}, LOG_ERR, ERRTYPE_NO_LOGIN, res);
            return;
        }
        //edit self data
        User.findOne({_id: req.session.me._id, deleted_at:null},function (err, user){
            if (err){
                log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            }
            if (nov(user)){
                log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"user not found"}), LOG_ERR, ERRTYPE_NOT_FOUND, res);
                return;
            }
            if (!nos(req.body.nickname))
                user.nickname = req.body.nickname;
            if (!nos(req.body.passwd))
                user.passwd = genSaltedHash(req.body.passwd);
            user.updated_at = Date.now();
            user.save();
            var t = user.toObject();
            delete t.passwd;
            delete t.email_validate_string;
            req.session.me = t;
            log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"success"}), LOG_INFO, ERRTYPE_NA);
            res.end(JSON.stringify({status:'success', user:t}));
        });
    }
    else{
        //admin edit user!!
        if (!isAdmin(req)){
            log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"no permission"}), LOG_ERR, ERRTYPE_PERMISSION, res);
            return;
        }
        User.findOne({_id: req.params.id},function (err, user){
            if (err){
                log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            }
            if(nov(user)){
                log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"user not found"}), LOG_ERR, ERRTYPE_NOT_FOUND, res);
                return;
            }
            if (!nos(req.body.nickname))
                user.nickname = req.body.nickname;
            if (!nos(req.body.passwd))
                user.passwd = genSaltedHash(req.body.passwd);
            if (!nos(req.body.email))
                user.email = req.body.email;
            if (!nos(req.body.email_validated))
                user.email_validated = req.body.email_validated;
            if (!nos(req.body.level))
                user.level = req.body.level;
            if (!nos(req.body.group))
                user.group = req.body.group;
            if (!nos(req.body.external_data))
                user.external_data = req.body.external_data;
            if (!nos(req.body.disabled))
                user.disabled = req.body.disabled;
            if (!nos(req.body.email_validate_string))
                user.email_validate_string = req.body.email_validate_string;
            user.updated_at = Date.now();
            var check = userCheck(user);
            if(check!=undefined){
                log2client({msg:check}, LOG_ERR, ERRTYPE_PARAM, res);
                return;
            }
            user.save();
            var t = user.toObject();
            delete t.passwd;
            delete t.email_validate_string;
            log2log(logUserTrack(req, {function:"user.edit", params:"", obj:req.params.id, action:"edit", msg:"success"}), LOG_WARN, ERRTYPE_NA);
            res.end(JSON.stringify({status:'success', user:t}));
        });
    }
});

/* API: 
POST /users/:id/del 刪除使用者帳號
權限：ADMIN
回傳：{status:'success'}
*/
router.post('/:id/del', function(req, res) { //del
    if (isAdmin(req)){
        //Store.find({_id:req.params.id}).remove().exec();
        User.findOne({_id:req.params.id, deleted_at:null},function(err, obj){
            if (err){
                log2log(logUserTrack(req, {function:"user.del", params:"", obj:req.params.id, action:"del", msg:"user query fail", imsg:err}), LOG_ERR, ERRTYPE_DB, res);
                return;
            }
            if (obj){
                obj.deleted_at = Date.now();
                obj.save();
                log2log(logUserTrack(req, {function:"user.del", params:"", obj:req.params.id, action:"del", msg:"success"}), LOG_WARN, ERRTYPE_NA);
            }
            res.end(JSON.stringify({status:'success'}));
        });
    }
    else{
        log2log(logUserTrack(req, {function:"user.del", params:"", obj:req.params.id, action:"del", msg:"no permission"}), LOG_ERR, ERRTYPE_PERMISSION, res);
    }
});

module.exports = router;
