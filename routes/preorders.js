var express = require('express');
var router = express.Router();

/* 檢查物件格式是否正確
輸入：preorder物件
回傳：undefined / 錯誤的欄位字串
*/
preorderCheck = function(obj){  //check all parameter is right, return string for bad params/undefined
    var err = false;
    var firstapp = undefined;
    var errmsg = "";
    if (nov(obj)){
        err = true; return "preorder";
    }
/*    if (!checkRegex("id",obj.preorder_id)){
        err = true; errmsg += firstapp+"preorder_id"; firstapp = ",";
    }
    if (!checkRegex("email",obj.email)){
        err = true; errmsg += firstapp+"email"; firstapp = ",";
    } 
    if (!checkRegex("cellphone",obj.cellphone)){
        err = true; errmsg += firstapp+"cellphone"; firstapp = ",";
    }
    if (nos(obj.buyer_id))
        obj.buyer_id = undefined;
    //passwd, status, desc, note, pickup_at, shipping_name, shipping_zip, shipping_counrty, shipping_address, shipping_phone, shipping_note
    //product_order [{product_id,count,prize_sum,status,shipped_at}]
    //paid_method, paid_note, paid_at, paid_checked_at, shipped_at, completed_at, disabled
    if (obj.prize_total<0){
        err = true; errmsg += firstapp+"prize_total"; firstapp = ",";
    }
    if (obj.prize_products<0){
        err = true; errmsg += firstapp+"prize_products"; firstapp = ",";
    }
    if (obj.prize_shipping<0){
        err = true; errmsg += firstapp+"prize_shipping"; firstapp = ",";
    }*/
    if (err)
        return errmsg;
    else
        return undefined;
};

/* API:
GET /preorders/:id 讀取團購(API)
權限：GUEST
參數：
回傳：obj

GET /preorders/list 列表團購
權限：ADMIN
參數：
回傳：res.render('preorder_list', obj);

GET /preorders/new 建立新團購
權限：USER
參數：
回傳：render('preorder_edit'
*/
router.get('/:id', function(req, res) {
    if (req.params.id=="new"){
        res.render('preorder_edit', {preorder:new Preorder(), products:[]});
        return;
    }
    if (req.params.id=="list"){
        Preorder.find({deleted_at: undefined}, function(err, objs){
            res.render('preorder_list', {preorders:objs});
            return;
        });
        return;
    }
    Preorder.findById(req.params.id, function(err, obj){
        if (err || obj==undefined){
            res.end(JSON.stringify({status:"error", msg:"preorder not found"}));
        }else{
            res.end(JSON.stringify({status:"success", obj:obj}));
        }
    });
});
/* API:
GET /preorders/:id/view 檢視團購頁面
權限：GUEST
參數：
回傳：res.render('preorder_show', {status:"ok", preorder:obj, products:products, pickup:pickup});
*/
router.get('/:id/view', function(req, res) {
    Preorder.findById(req.params.id, function(err, obj){
        if (err || obj==undefined){
            res.render('errormsg', {status:"error", msg:"preorder not found", imsg:err, redirect:undefined});
        }else{
            Product.findById(obj.products, function(err, products){
                if (err || products==undefined){
                    res.render('errormsg', {status:"error", msg:"products not found", imsg:err, redirect:undefined});
                }else{
                    //loglog("WTF preorders: "+JSON.stringify(obj));
                    //loglog("WTF products: "+JSON.stringify(products));
                    let prod_pickup = {}; //所有的商品的取貨方式
                    let pickup = [];
                    for (let i=0;i<products.length;i++)
                        for (let j=0;j<products[i].pickup_method.length;j++)
                            prod_pickup[products[i].pickup_method[j]] = products[i].pickup_method[j];
                    //loglog("WTF prod_pickup: "+JSON.stringify(prod_pickup));
                    //loglog("WTF obj.pickup_method: "+JSON.stringify(obj.pickup_method)+"("+obj.pickup_method.length);
                    if (obj.pickup_method && obj.pickup_method.length>0){ //整理出允許的取貨方式
                        for (let i in prod_pickup)
                            for (let j=0;j<obj.pickup_method.length;j++)
                                if (i==obj.pickup_method[j])
                                    pickup.push(i);
                    }
                    else{
                        for (let i in prod_pickup){ //或列出所有可能的取貨方式
                            //loglog("WTF i: "+JSON.stringify(i));
                            pickup.push(i);
                        }
                    }
                    //loglog("WTF pickup: "+JSON.stringify(pickup));
                    let debug = false;
                    if (req.query.debug)//, debug:debug
                        debug = true;
                    res.render('preorder_show', {status:"ok", preorder:obj, products:products, pickup:pickup, s2debug:debug});
                }
            });
        }
    });
});
/* API:
GET /preorders/:id/edit 修改團購頁面
權限：OWNER
參數：
回傳：res.render('preorder_show', obj);
*/
router.get('/:id/edit', function(req, res) {
    Preorder.findById(req.params.id, function(err, obj){
        if (err || obj==undefined){
            res.render('errormsg', {status:"error", msg:"preorder not found", imsg:err, redirect:undefined});
        }else{
            Product.findById(obj.products, function(err, products){
                if (err){
                    res.render('errormsg', {status:"error", msg:"products not found", imsg:err, redirect:undefined});
                }else{
                    if (products==undefined)
                        products = [];
                    res.render('preorder_edit', {preorder:obj, products:products});
                }
            });
        }
    });
});

/* API:
POST /preorder/:id 修改團購
權限：OWNER
參數：title, subtitle, short_desc, desc, tags, start_at, end_at, shipping_expect_at 
TODO: image_large, image_small, pickup_method
參數（product[]）：product_title, product_subtitle, product_short_desc, product_desc, product_image_large, product_unit, product_unit_prize, product_max, product_min, product_max_per_order, product_pickup_method
TODO: image_small, rc_country, src_producer, brend, unit_profit, package_info
回傳：res.render('errormsg', {msg:"團購修改成功", redirect:"/preorders/id/view"});
*/
router.post('/:id/update', function(req, res) {
    let debug = req.query.debug;
    Preorder.findById(req.params.id, function(err, obj){
        if (err){
            loglog("preorder.edit query fail: "+err);
            res.render('errormsg', {status:"error", msg:"preorder not found", imsg:err, redirect:undefined});
            return;
        }
        if(obj==undefined){ //new
            obj = new Preorder();
            obj._id = req.params.id;
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

/* API:
POST /preorders/:id/order   使用者下單
權限：GUEST
參數：
回傳：res.render('preorder_show', obj);
*/
router.post('/:id/order', function(req, res) {
    let debug = false;
    if (req.body.debug){
        debug = true;
        loglog("req.body: "+JSON.stringify(req.body));
    }
    Preorder.findById(req.params.id, function(err, preorder){
        if (err || preorder==undefined){
            res.render('errormsg', {status:"error", msg:"preorder not found", imsg:err, redirect:undefined});
        }else{
            Product.findById(preorder.products, function(err, products){
                if (err){
                    res.render('errormsg', {status:"error", msg:"products not found", imsg:err, redirect:undefined});
                }else{
                    if (products==undefined)
                        products = [];
                    // product parameter
                    let order_item = [];
                    let order_item_obj = [];
                    let prize_total = 0;
                    let valid_item = false; //至少要一個有效的產品
                    //product_order[Schema.Types.Mixed] //[{product_id,count,prize_sum,status,shipped_at}]
                    //status: ok/queue/canceled 如果為queue不應算入總金額，如果canceled則退款加入user balance
                    for (let i=0;i<products.length;i++){
                        //loglog("products[i]._id:"+products[i]._id+" req.body[products[i]._id]:"+req.body[products[i]._id]);
                        
                        if (req.body[products[i]._id]!=undefined){
                            let c = parseInt(req.body[products[i]._id]);
                            if (!Number.isInteger(c)){
                                loglog("bad request req.body[products[i]._id] not int: "+req.body[products[i]._id]);
                                continue;
                            }
                            if (c<1)
                                continue;
                            //loglog("matched: "+products[i]._id);
                            //loglog("products: "+JSON.stringify(products[i]));
                            let p = products[i].unit_prize*req.body[products[i]._id];
                            if (products[i].remain >= req.body[products[i]._id]){
                                order_item.push({product_id:products[i]._id, count:req.body[products[i]._id], prize_sum:p, status:"ok", shipped_at:undefined});
                                products[i].remain -= req.body[products[i]._id];
                                order_item_obj.push(products[i]);
                                if (!debug)
                                    products[i].save();
                                prize_total += p;
                                valid_item = true;
                            }else if(products[i].remain==-1){
                                order_item.push({product_id:products[i]._id, count:req.body[products[i]._id], prize_sum:p, status:"ok", shipped_at:undefined});
                                order_item_obj.push(products[i]);
                                prize_total += p;
                                valid_item = true;
                            }
                            else{
                                order_item.push({product_id:products[i]._id, count:req.body[products[i]._id], prize_sum:p, status:"queue", shipped_at:undefined});
                                order_item_obj.push(products[i]);
                            }
                        }
                    }
                    loglog("order_item: "+JSON.stringify(order_item));
                    //if logined
                    //check user exist
                    //TODO: create user account
                    /*let user = new User({
                        nickname: req.body.nickname,
                        email: req.body.email,
                        cellphone: req.body.cellphone,
                        passwd: genSaltedHash(genRandomString(6)),
                        desc: "auto generate",
                        valided: false,
                        shipping_name: req.body.shipping_name,
                        shipping_zip: req.body.shipping_zip,
                        shipping_counrty: req.body.shipping_counrty,
                        shipping_address: req.body.shipping_address,
                        shipping_phone: req.body.shipping_phone,
                        shipping_note:req.body.shipping_note,
                        prefer_pickup: 
                        balance: 0,
                        disable: false
                    });*/
                    let order = new Order({
                        preorder_id: preorder._id,
                        status: "pending customer",
                        buyer_id: undefined,
                        passwd: genRandomString(6),
                        email: req.body.email,
                        cellphone: req.body.cellphone,
                        pickup_at: req.body.pickup_at
                    });
                    if (req.body.desc)
                        order.desc = req.body.desc;
                    if (req.body.shipping_name)
                        order.shipping_name = req.body.shipping_name;
                    if (req.body.shipping_zip)
                        order.shipping_zip = req.body.shipping_zip;
                    if (req.body.shipping_counrty)
                        order.shipping_counrty = req.body.shipping_counrty;
                    if (req.body.shipping_address)
                        order.shipping_address = req.body.shipping_address;
                    if (req.body.shipping_phone)
                        order.shipping_phone = req.body.shipping_phone;
                    if (req.body.shipping_note)
                        order.shipping_note = req.body.shipping_note;
                    if (req.body.disabled)
                        order.disabled = req.body.disabled;
                    if (req.body.paid_method)
                        order.paid_method = req.body.paid_method;
                    order.pickup_at = pickup_at;
                    order.product_order = order_item;
                    order.prize_products = prize_total;
                    order.prize_shipping = 0; //TODO
                    order.prize_total = order.prize_products + order.prize_shipping;
                    if (!valid_item){
                        loglog("no valid items in cart",LOG_ERR);
                        res.render("errormsg",{status:"error", msg:"您預定的產品已被搶購一空 O_Q", redirect:undefined});
                        return;
                    }
                    let err = orderCheck(order);
                    if (err){
                        loglog("failed to create order: "+err,LOG_ERR);
                        res.render("errormsg",{status:"error", msg:"訂單格式錯誤，請洽系統管理員", imsg:err, redirect:undefined});
                        return;
                    }
                    if (!debug)
                        order.save();

                    //生成郵件內文
                    let subject="["+siteTitle+"] 您的團購預訂與付款資訊 "+order._id;
                    if (debug)
                        subject = "[DEBUG][not valid order]"+subject;
                    let msg = '感謝您的預定，以下是您的預定資料\n'+
                    "原團購網址： "+siteHost+"/preorders/"+preorder._id+"/view\n"+
                    "檢視修改預定： "+siteHost+"/orders/"+order._id+"/view/"+order.passwd+"\n"+
                    "聯絡我們： "+siteEmail+"\n"+
                    "\n";
                    for(let i=0;i<order_item.length;i++){//[{product_id,count,prize_sum,status,shipped_at}]
                        if (order_item[i].status=="ok")
                            msg+="["+order_item_obj[i].title+"] "+order_item[i].count+" "+order_item_obj[i].unit+" = "+order_item[i].prize_sum+"\n";
                    }
                    msg+="--------------------------------------------\n"+ //TODO shipping
                    " 共 "+order.prize_total+" NTD\n"+
                    "\n"+
                    "請於 "+expire_days+"日內（"+new Date(Date.now()+expire_days*24*60*60*1000).Format("yyyy-MM-dd hh:mm")+"）完成付款與回報，若未付款本預購單將作廢，請重新上網預定\n"+
                    "請留意：此為團購預定商品，有可能因為團購數量不足或其他因素而部分取消，不保證出貨。若有任何異動會透過Email與您聯繫與退款。\n"+
                    "倘若您對此有疑慮，請先聯絡我們再決定是否付款，感謝您的配合\n"+
                    "\n\n";
                    //output bad products
                    let bad_prods = undefined;
                    for(let i=0;i<order_item.length;i++){//[{product_id,count,prize_sum,status,shipped_at}]
                        if (order_item[i].status!="ok")
                            if (bad_prods==undefined)
                                bad_prods="["+order_item_obj[i].title+"]";
                            else
                                bad_prods+=",["+order_item_obj[i].title+"]";
                    }
                    if (bad_prods!=undefined){
                        msg+="預購失敗（被訂完了）的商品，這些商品沒有算進總金額中："+bad_prods+"\n\n";
                    }
                    //付款資訊
                    let m = payment_msg[order.paid_method];
                    if (m==undefined){
                        //BAD CONFIG: payment_msg not set for payment
                        //TODO: notify admin
                        m = "Oops, 付款資訊有點問題，請與我們聯絡由我們為您處理！\n";
                    }
                    m = m.replace("<order_id>",order._id);
                    m = m.replace("<order_passwd>",order.passwd);
                    msg += m;

                    var mailOptions = {
                        from: siteEmail, // sender address
                        to: order.email, // list of receivers
                        subject: subject, // Subject line
                        text: msg
                        // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            log2log({function:"initAdmin", params:order.email, obj:order._id, action:"notify user", imsg:error}, LOG_ERR, ERRTYPE_NOTIFY);
                        }else{
                        };
                    });
                    res.render('errormsg', {status:"success", msg:"已經收到您的預約，感謝您。檢視訂單與訂單管理請至Email", redirect:siteHost+"/orders/"+order._id+"/view/"+order.passwd}); //TODO redirect to order view
                }
            });
        }
    });
});

module.exports = router;
