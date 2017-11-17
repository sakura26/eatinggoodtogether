mongodb = require('mongodb');
sanitize = require('mongo-sanitize');
//http://mongoosejs.com/docs/schematypes.html
var UserSchema = mongoose.Schema({
    nickname    : { type: String },		//暱稱（預設email）
    email    : { type: String },		//email, 用於身份驗證與登入（必要）
    passwd    : { type: String },		//密碼salted md5（必要）
    cellphone    : { type: String },	//電話，用於簡訊驗證（必要）
    fb    : { type: String },			//臉書帳號
    desc : { type: String }, 			//使用者自介
    email_validate_string: {type: String},//email驗證用字串
    sms_validate_string: {type: String},//簡訊驗證用字串
    email_validated_at: {type:Date},    //郵件通過驗證時間
    sms_validated_at: {type:Date},      //簡訊通過驗證時間
    shipping_name: String,				//寄送收件者
    shipping_zip: String,				//寄送郵遞區號
    shipping_counrty: String,			//寄送國家
    shipping_address: String,			//寄送地址
    shipping_phone: String,				//寄送電話
    shipping_note: String,				//寄送額外紀錄
    prefer_pickup : { type: String }, 	//偏好取貨點
    note : { type: String }, 			//管理者附註
    balance: { type:Number, default: 0},//帳戶餘額（預設0）
    disable:{type:Boolean, default:false},//是否凍結（預設false）
    admin: {type:Boolean, default:false},//管理權限
    tags    : [String],					//tags（管理者使用）
    created_at : { type: Date, default: Date.now },
    updated_at : { type: Date },
    deleted_at : { type: Date }
});
var PreorderSchema = mongoose.Schema({
    title    : { type: String },		//標題（必要）
    subtitle    : { type: String },		//副標題
    short_desc    : { type: String },	//列出所有活動時的短標題，預設擷取desc前30個字元
    desc : { type: String }, 			//顯示於活動上方的描述
    image_large    : { type: String },	//大圖
    image_small    : { type: String },	//小圖
    owner_id: Schema.Types.ObjectId,	//活動擁有者（必要）
    tags    : [String],					//tags
    products: [Schema.Types.ObjectId],	//本次活動商品（必要）
    pickup_method:  [String], 	        //預設取貨點
    disable:{type:Boolean, default:false},//是否關閉
    start_at : { type: Date },			//活動起始時間（這個時間才顯示/可下單）
    end_at : { type: Date },			//活動結束時間（結單）
    shipping_expect_at: { type: Date },//預定寄送/取貨時間
    created_at : { type: Date, default: Date.now},
    updated_at : { type: Date },		//有任何一個人訂了就不能修改
    deleted_at : { type: Date }			//只有在刪除所有訂單的情況下才可刪除
});
var ProductSchema = mongoose.Schema({	
    tags    : [String],					//tags
    title    : { type: String },		//標題（必要）
    subtitle    : { type: String },		//副標題
    short_desc    : { type: String },	//列出所有活動時的短標題，預設擷取desc前30個字元
    desc : { type: String }, 			//顯示於活動上方的描述（必要）
    image_large    : { type: String },	//大圖
    image_small    : { type: String },	//小圖
    src_country    : { type: String },	//產地
    src_producer    : { type: String },	//生產者
    brend    : { type: String },		//品牌
    package_info    : { type: String },	//包裝方式
    unit    : { type: String },			//銷售單位（必要）
    unit_prize    : { type: Number },	//每單位價格（必要）
    unit_profit    : { type: Number },	//每單位利潤
    max   : {type: Number, default: -1},//團購數量上限, -1=無限制
    min   : {type: Number, default: -1},//團購數量下限, -1=無限制
    max_per_order: {type: Number,default:10},//單一帳號購買上限（必要）
    remain: {type: Number, default: -1},//商品殘量, -1=無限制
    owner_id: Schema.Types.ObjectId,	//產品建立者
    pickup_method: [String], 			//允許取貨方式
    created_at : { type: Date, default: Date.now },
    updated_at : { type: Date },		//有任何一個人訂了就不能修改，自動建立新的
    deleted_at : { type: Date }			//只有在刪除所有訂單的情況下才可刪除
});
var OrderSchema = mongoose.Schema({
    preorder_id: Schema.Types.ObjectId,	//預購id
    tags    : [String],					//tags
    status: {type: String, default:"new"},//訂單狀態
    //（pending customer/pending admin/error/complete/canceled）
    buyer_id: Schema.Types.ObjectId,	//買家
    passwd    : { type: String },       //可以操作訂單的密碼
    desc : { type: String }, 			//買家附註
    note : { type: String }, 			//管理者附註
    email    : { type: String },		//email
    cellphone    : { type: String },	//聯絡電話
    shipping_name: String,				//寄送收件者
    shipping_zip: String,				//寄送郵遞區號
    shipping_counrty: String,			//寄送國家
    shipping_address: String,			//寄送地址
    shipping_phone: String,				//寄送電話
    shipping_note: String,				//寄送額外紀錄
    pickup_at : { type: String }, 		//取貨點
    product_order:[Schema.Types.Mixed],	//商品資訊
    //[{product_id,count,prize_sum,status,shipped_at}]
    //status: ok/queue/canceled 如果為queue不應算入總金額，如果canceled則退款加入user balance
    prize_total : { type: Number }, 	//訂單總金額/應付款項
    // = sum(product_order.prize_sum)+prize_shipping
    prize_products : { type: Number },	//商品總金額
    prize_shipping : { type: Number }, 	//運費 not used
    paid_method: { type: String }, 		//付款方式(ATM/creditcard/paypal/prepaid..)
    paid_note: { type: String }, 		//付款紀錄(銀行/帳號後五碼)(交易id)
    paid_at : { type: Date }, 			//回報付款時間
    paid_checked_at : { type: Date }, 	//確認付款時間
    shipped_at : { type: Date },		//寄送/出貨時間
    completed_at : { type: Date }, 		//訂單結束時間
    disabled: {type: Boolean, default:false},//是否關閉
    created_at : { type: Date, default: Date.now },
    updated_at : { type: Date },
    deleted_at : { type: Date }
});

UserSchema.statics.findById = function (id, callback) {
    this.findOne({_id:id, deleted_at:undefined}, callback);
};
UserSchema.statics.findByEmail = function (id, callback) {
    this.findOne({email:id, deleted_at:undefined}, callback);
};
UserSchema.statics.login = function (email, pass, callback) {
    this.findOne({email:email, deleted_at:undefined}, function(err, user){
        if(err)
            callback(undefined);
        else if (chechSaltedHash(pass, user.passwd))
            callback(user);
        else
            callback(undefined);
    });
};

PreorderSchema.statics.findById = function (id, callback) {
    this.findOne({_id:id, deleted_at:undefined}, callback);
};
PreorderSchema.statics.findValids = function (callback) {
    this.find({end_at:{$gt: new Date()}, disable:false, deleted_at:undefined}, callback);
};

ProductSchema.statics.findById = function (id, callback) {
    if (Array.isArray(id))
        this.find({_id:{"$in": id}, deleted_at:undefined}, callback);
    else
        this.findOne({_id:id, deleted_at:undefined}, callback);
};

OrderSchema.statics.findById = function (id, callback) {
    this.findOne({_id:id, deleted_at:undefined}, callback);
};
OrderSchema.statics.findByPreorder = function (id, callback) {
    this.find({preorder_id:id, deleted_at:undefined}, callback);
};
OrderSchema.statics.findByUser = function (id, callback) {
    this.find({buyer_id:id, deleted_at:undefined}, callback);
};
OrderSchema.statics.findExpires = function (callback) {
    this.find({created_at:{$gt: new Date(Date.now() - expire_days * 86400000 )}, paid_at:undefined, disabled:false, deleted_at:undefined}, callback);
};

User = mongoose.model( 'User', UserSchema );
Preorder = mongoose.model( 'Preorder', PreorderSchema );
Product = mongoose.model( 'Product', ProductSchema );
Order = mongoose.model( 'Order', OrderSchema );