var express = require('express');
var router = express.Router();

orderCheck = function(obj){  //check all parameter is right, return string for bad params/undefined
    var err = false;
    var firstapp = undefined;
    var errmsg = "";
    if (nov(obj)){
        err = true; return "order";
    }
    if (!checkRegex("id",obj.preorder_id)){
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
    //paid_note, paid_at, paid_checked_at, shipped_at, completed_at, disabled
    let paid_method_ok = false;
    for (let i=0;i<payment_allow.length;i++)
        if (obj.paid_method==payment_allow[i])
            paid_method_ok = true;
    if (!paid_method_ok){
        err = true; errmsg += firstapp+"paid_method"; firstapp = ",";
    }
    if (obj.prize_total<0){
        err = true; errmsg += firstapp+"prize_total"; firstapp = ",";
    }
    if (obj.prize_products<0){
        err = true; errmsg += firstapp+"prize_products"; firstapp = ",";
    }
    if (obj.prize_shipping<0){
        err = true; errmsg += firstapp+"prize_shipping"; firstapp = ",";
    }
    if (err)
        return errmsg;
    else
        return undefined;
};

/* API:
GET /orders/:id/view/:passws 檢視訂單頁面
權限：GUEST
參數：
回傳：res.render('order_show', {order:order, products:matched_products, s2debug:debug});
*/
router.get('/:id/view/:passwd', function(req, res) {
    Order.findById(req.params.id, function(err, order){
        if (err || order==undefined){
            res.render('errormsg', {status:"error", msg:"order not found", imsg:err, redirect:undefined});
            return;
        }else{
            if (order.passwd!=req.params.passwd){
                res.render('errormsg', {status:"error", msg:"bad passwd", imsg:err, redirect:undefined});
                return
            }
            let product_list = [];
            for (let i=0;i<order.product_order.length;i++) //{product_id,count,prize_sum,status,shipped_at}
                product_list.push(order.product_order[i].product_id);
            Product.findById(product_list, function(err, products){
                if (err || products==undefined){
                    res.render('errormsg', {status:"error", msg:"products not found", imsg:err, redirect:undefined});
                }else{
                    let matched_products = [];
                    for (let a=0;a<products.length;a++){
                        for(let b=0;b<order.product_order.length;b++){
                            //loglog("WTFFFF: products[a]._id:"+products[a]._id+" order.product_order[b].product_id:"+order.product_order[b].product_id);
                            if (products[a]._id.toString()===order.product_order[b].product_id.toString()){
                                //loglog("FQ");
                                order.product_order[b].product = products[a];
                                matched_products.push(order.product_order[b]);
                            }
                        }
                    }
                    let debug = false;
                    if (req.query.debug)//, debug:debug
                        debug = true;
                    //loglog("DEBUG: order: "+JSON.stringify(order)+" products: "+JSON.stringify(matched_products));
                    res.render('order_show', {order:order, products:matched_products, s2debug:debug});
                }
            });
        }
    });
});

/* API:
GET /orders/:id/report_ATM/:passwd 轉帳回報
權限：GUEST
參數：
回傳：res.render('report_ATM', {order:order});
*/
router.get('/:id/report_ATM/:passwd', function(req, res) {
    Order.findById(req.params.id, function(err, order){
        if (err || order==undefined){
            res.render('errormsg', {status:"error", msg:"order not found", imsg:err, redirect:undefined});
            return;
        }else{
            if (order.passwd!=req.params.passwd){
                res.render('errormsg', {status:"error", msg:"bad passwd", imsg:err, redirect:undefined});
                return;
            }
            if (order.disabled){
                res.render('errormsg', {status:"error", msg:"這個訂單已經關閉囉，如果有任何疑問請聯絡管理員", imsg:err, redirect:undefined});
                return;
            }
            if (order.completed_at || order.paid_checked_at){
                res.render('errormsg', {status:"error", msg:"這個訂單已經完成無需付款", imsg:err, redirect:undefined});
                return;
            }
            if (order.paid_at){
                res.render('errormsg', {status:"error", msg:"您已經回報過囉，若有誤輸入或其他問題，請聯絡管理員", imsg:err, redirect:undefined});
                return;
            }
            res.render('report_ATM', {order:order});
        }
    });
});
/* API:
POST /orders/:id/report_ATM/:passwd 轉帳回報
權限：GUEST
參數：bank_id account_id total transfer_at_date transfer_at_time note
回傳：res.render('errormsg', {status:"success", msg:"感謝您的付款，待管理員確認後會發信通知您", redirect:siteHost+"/orders/"+order._id+"/view/"+order.passwd});
*/
router.post('/:id/report_ATM/:passwd', function(req, res) {
    Order.findById(req.params.id, function(err, order){
        if (err || order==undefined){
            res.render('errormsg', {status:"error", msg:"order not found", imsg:err, redirect:undefined});
            return;
        }else{
            if (order.passwd!=req.params.passwd){
                res.render('errormsg', {status:"error", msg:"bad passwd", imsg:err, redirect:undefined});
                return;
            }
            if (order.disabled){
                res.render('errormsg', {status:"error", msg:"這個訂單已經關閉囉，如果有任何疑問請聯絡管理員", imsg:err, redirect:undefined});
                return;
            }
            if (order.completed_at || order.paid_checked_at || order.paid_at){
                res.render('errormsg', {status:"error", msg:"這個訂單已經完成無需付款", imsg:err, redirect:undefined});
                return;
            }
            if (order.paid_at){
                loglog("update payment info again!");
            }
            //handle injection!!
            order.paid_note = "ATM轉帳("+req.body.bank_id+") 後五碼："+req.body.account_id+" 總金額："+req.body.total+" 於"+req.body.transfer_at_date+" "+req.body.transfer_at_time+"\n"+
            "附註："+ns(req.body.note);
            order.paid_at = new Date();
            order.status = "pending admin";
            order.save();
            //notify admin
            var mailOptions = {
                from: siteEmail, // sender address
                to: siteEmail, // list of receivers
                subject: "[轉帳通知] 訂單"+order._id+"通知付款，請確認", // Subject line
                text: "訂單："+order._id+" ("+order.status+")\n"+
                "用戶："+order.email+" "+order.cellphone+"\n"+
                "管理者註記："+ns(order.note)+"\n"+
                "應付總金額："+order.prize_total+"\n"+
                "\n"+
                order.paid_note+"\n"+
                "\n"+
                "點此確認訂單轉帳是否有效： "+siteHost+"/orders/"+order._id+"/mgmt\n"
                // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    log2log({function:"report_ATM", params:siteEmail, obj:order._id, action:"notify admin", imsg:error}, LOG_ERR, ERRTYPE_NOTIFY);
                }else{
                };
            });
            res.render('errormsg', {status:"success", msg:"感謝您的付款，待管理員確認後會發信通知您", redirect:siteHost+"/orders/"+order._id+"/view/"+order.passwd});
        }
    });
});


/* API:
GET /orders/:id/mgmt 訂單管理
權限：ADMIN
參數：
回傳：res.render('order_mgmt', {});
*/
router.get('/:id/mgmt', function(req, res) {
    //TODO is admin
    Order.findById(req.params.id, function(err, order){
        if (err || order==undefined){
            res.render('errormsg', {status:"error", msg:"order not found", imsg:err, redirect:undefined});
            return;
        }else{
            let product_list = [];
            for (let i=0;i<order.product_order.length;i++) //{product_id,count,prize_sum,status,shipped_at}
                product_list.push(order.product_order[i].product_id);
            Product.findById(product_list, function(err, products){
                if (err || products==undefined){
                    res.render('errormsg', {status:"error", msg:"products not found", imsg:err, redirect:undefined});
                }else{
                    let matched_products = [];
                    for (let a=0;a<products.length;a++){
                        for(let b=0;b<order.product_order.length;b++){
                            //loglog("WTFFFF: products[a]._id:"+products[a]._id+" order.product_order[b].product_id:"+order.product_order[b].product_id);
                            if (products[a]._id.toString()===order.product_order[b].product_id.toString()){
                                //loglog("FQ");
                                order.product_order[b].product = products[a];
                                matched_products.push(order.product_order[b]);
                            }
                        }
                    }
                    let debug = false;
                    if (req.query.debug)//, debug:debug
                        debug = true;
                    //loglog("DEBUG: order: "+JSON.stringify(order)+" products: "+JSON.stringify(matched_products));
                    res.render('order_mgmt', {order:order, products:matched_products, s2debug:debug});
                }
            });
        }
    });
});
/* API:
POST /orders/:id/mgmt 轉帳回報
權限：ADMIN
參數：
回傳：res.render('errormsg', {status:"success", msg:"修改成功", redirect:siteHost+"/orders/"+order._id+"/view/"+order.passwd});
*/
router.post('/:id/mgmt', function(req, res) {
    //TODO is admin
    Order.findById(req.params.id, function(err, order){
        if (err || order==undefined){
            res.render('errormsg', {status:"error", msg:"order not found", imsg:err, redirect:undefined});
            return;
        }else{
            if (order.passwd!=req.params.passwd){
                res.render('errormsg', {status:"error", msg:"bad passwd", imsg:err, redirect:undefined});
                return;
            }
            if (order.disabled){
                res.render('errormsg', {status:"error", msg:"這個訂單已經關閉囉，如果有任何疑問請聯絡管理員", imsg:err, redirect:undefined});
                return;
            }
            if (order.completed_at || order.paid_checked_at || order.paid_at){
                res.render('errormsg', {status:"error", msg:"這個訂單已經完成無需付款", imsg:err, redirect:undefined});
                return;
            }
            if (order.paid_at){
                loglog("update payment info again!");
            }
            //handle injection!!
            order.paid_note = "ATM轉帳("+req.body.bank_id+") 後五碼："+req.body.account_id+" 總金額："+req.body.total+" 於"+req.body.transfer_at_date+" "+req.body.transfer_at_time+"\n"+
            "附註："+ns(req.body.note);
            order.paid_at = new Date();
            order.status = "pending admin";
            order.save();
            //notify admin
            var mailOptions = {
                from: siteEmail, // sender address
                to: siteEmail, // list of receivers
                subject: "[轉帳通知] 訂單"+order._id+"通知付款，請確認", // Subject line
                text: "訂單："+order._id+" ("+order.status+")\n"+
                "用戶："+order.email+" "+order.cellphone+"\n"+
                "管理者註記："+ns(order.note)+"\n"+
                "應付總金額："+order.prize_total+"\n"+
                "\n"+
                order.paid_note+"\n"+
                "\n"+
                "點此確認訂單轉帳是否有效： "+siteHost+"/orders/"+order._id+"/mgmt\n"
                // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
            };
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    log2log({function:"report_ATM", params:siteEmail, obj:order._id, action:"notify admin", imsg:error}, LOG_ERR, ERRTYPE_NOTIFY);
                }else{
                };
            });
            res.render('errormsg', {status:"success", msg:"感謝您的付款，待管理員確認後會發信通知您", redirect:siteHost+"/orders/"+order._id+"/view/"+order.passwd});
        }
    });
});

orderExpire = function(){
    Order.find({status:"pending customer", paid_at:undefined, created_at:{$lt: new Date(Date.now()-expire_days*24*60*60*1000)}, disabled:false, deleted_at: undefined}, function(err, orders){
        if (err || orders==undefined){
            //log error
            //notify admin
            return;
        }
        for(let i=0;i<orders.length;i++){
            //把商品數量加回去
            for(let j=0;j<orders[i].product_order.length;j++){  //{product_id,count,prize_sum,status,shipped_at}
                //TODO merge query
                Product.findOne({_id:orders[i].product_order[j].product_id, deleted_at: undefined}, function(err, product){
                    if (err){
                        //TODO log to admin
                    }
                    else{
                        if (product.remain!=-1){
                            product.remain += orders[i].product_order[j].count;
                            product.save();
                        }
                    }
                });
            }
            orders[i].status = "canceled";
            orders[i].disabled = true;
            //notify user to recreate order if still needed
        }
    });
};


module.exports = router;
