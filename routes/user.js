const { response } = require('express');
var express = require('express');
const res = require('express/lib/response');
const { LoggerLevel, Db } = require('mongodb');
var router = express.Router();
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret':process.env.CLIENT_SECRET
})
const otpConfig = require('../config/otpConfig');
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
const client = require("twilio")(otpConfig.accountSID, otpConfig.authToken)
let userErr = {}
let phone_for_otp
router.use(express.json())
const verifyLogin=(req,res,next)=>{
  
  if(req.session.user.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  
  let user1=req.session.user
  let cartCount=null;
  let todayDate = new Date().toISOString().slice(0, 10)
 // let result2= await productHelpers.startProductOffer(todayDate)
  productHelpers.startProductOffer(todayDate).then((data)=>{
    console.log(data)
  })

   if(req.session.user){

    cartCount=await userHelpers.getCartCount(req.session.user._id) 
    
      
   }  
    let catOff=await productHelpers.startCategoryOffer(todayDate)
             
  productHelpers.getAllProducts().then((products)=>{
    
    res.render('user/view-products',{products,user1,user:true,cartCount})
  })
});

router.get('/login',async (req,res)=>{
  if(req.session.user){
  

    res.redirect('/')
  }else{
 
    res.render('user/login',{"loginErr":req.session.userLoginErr})
    req.session.userLoginErr=false
  }
  
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

//referal
router.get("/signup/:id", (req, res) => {
  console.log(req.params.id)
  referId = req.params.id;
  res.render("user/signup", {  noheader: true,referId });
});

router.post('/signup',(req,res)=>{
  
  console.log(req.body)
userHelpers.emailchecker(req.body.Email).then((mail)=>{
  if(mail){
    let check =true
    res.render("user/signup",{check})
  }

  else{
    userHelpers.doSignup(req.body).then((response)=>{
      console.log(response);
       req.session.loggedIn=true
       req.session.user=response
      
      
      res.render('user/login')
    })
  }
})
})

// router.post('/signup',(req,res)=>{
//   userHelpers.doSignup(req.body).then((response)=>{
//     console.log(response)
//     req.session.user=response.user
//     res.render('user/login')
//   })
//  // res.render('user/login')
// })
router.post('/login',(req,res)=>{
  console.log(req.body);
  
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user
       req.session.user.loggedIn=true
       
      res.redirect('/')
    }else if(! req.session.user){
      req.session.userLoginErr=true
      res.redirect('/login' )
    }
  })
})

router.get('/logout',((req,res)=>{
  req.session.user=null
  // req.session.userLoggedIn=false
  // req.session.destroy()
  res.redirect('/')
}))



router.get('/auth',(req,res)=>{
  res.render('user/auth')
})


router.post('/otp', (req, res, next) => {
  console.log('otp')
  phone_for_otp = req.body.phone
  console.log(phone_for_otp)
  client
    .verify
    .services(otpConfig.serviceID)
    .verifications
    .create({
      to: `+91${req.body.phone}`,
      channel: 'sms'
    })
    .then(data => {
      console.log(data)          
      res.status(200).send(data) 
    })
})


router.post('/verify_otp', (req, res, next) => {
  client
    .verify
    .services(otpConfig.serviceID)
    .verificationChecks
    .create({
      to: `+91${phone_for_otp}`,
      code: req.body.otp
    })
    .then(data => {
      console.log(data)
      if(data.status == 'pending'){
        console.log('wrong otp')
        res.status(200).send(false)
      }
    else if(data.status == 'approved'){
        console.log('user autheticated via otp')
        console.log(phone_for_otp)
        req.session.user = {phone: phone_for_otp}
        
        console.log(req.session)
        userHelpers.otpUserCreation(phone_for_otp).then(data => {       //add to database if number doesn't exists and don't if it does
          console.log('data from db')
          console.log(data)
          console.log(data.insertedId)
          req.session.user._id = data.insertedId
          req.session.user.loggedIn=true
          res.status(200).send(true)
          
        })
      }
      else{
        res.status(400)
      }
    })
  // console.log(req.body)
  // res.status(200).send('yo')
})


router.get('/product-detials/:id', (req,res)=>{
    
 let proId=req.params.id

 productHelpers.getProductDetails(proId).then((products)=>{
   console.log(products)
  res.render('user/product-detials',{products,user:true})
})
  



   
  
    
})


router.get('/category',(req,res)=>{

  productHelpers.getAllcategory().then(category=>{
    console.log(category)
    res.render('user/category',{category,user:true})
  })
  productHelpers.getAllProducts().then(products=>{
    res.render('user/category',{products})
  })

})


router.get('/catdetials/:id',(req,res)=>{
  console.log(req.params.id)
    productHelpers.getCatdetials(req.params.id).then((catproducts)=>{
      console.log("1111111111111"+catproducts);

      res.render('user/catproduct',{catproducts,user:true})
    })
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let user1=req.session.user
   let products=await userHelpers.getCartProducts(req.session.user._id)
   let totalvalue=0;
   if(products.length>0){
     
    totalvalue=await userHelpers.getTotalAmount(req.session.user._id)
   }


   console.log(products);
   console.log(totalvalue)
  res.render('user/cart',{user1,'user':req.session.user._id,products,totalvalue})
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log("api call")
 
   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    
   
    res.json({status:true})
   })
})


router.post('/change-product-quantity',(req,res,next)=>{

  userHelpers.changeProductQuantity(req.body).then(async (response)=>{
    response.total=await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
})

router.post('/remove-product-from-cart',(req,res,next)=>{
  userHelpers.removeFromCart(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/placeOrder',verifyLogin,async (req,res)=>{
  let user1=req.session.user
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  let address=await userHelpers.getAddress(user1._id)
  let wallet=await userHelpers.getWallet(user1._id)
  
   if(total ==null){
     res.redirect('/cart');
   }else{
    res.render('user/place-order',{user:req.session.user,user1,total,address,wallet})
   }
 
 
})

router.post('/place-order',verifyLogin, async (req,res)=>{
 
  
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
 
  let discount = null;

  let user = await productHelpers.getuserDetails(req.body.userId);
  if (user.couponamount && user.amountValid) {
    discount = user.couponamount;
    valid=user.amountValid;
    if(totalPrice<=valid){
      totalPrice = totalPrice - (discount * totalPrice) / 100;
      userHelpers.substractCoupon(req.body.userId).then(()=>{
  
      })
    }
   

  }
 if (req.body.checked) {
    let walletAmount = req.body.checked;
    totalPrice = totalPrice - parseInt(100) ;
    userHelpers.substractWallet(req.body.userId).then(()=>{
       
    })
  }
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
   if(req.body['Payment-method']=="COD"){
    res.json({codSuccess:true})
   }
   else if(req.body['Payment-method']=="Razorpay"){
          userHelpers.generateRazorPay(orderId,totalPrice).then((resp)=>{
           res.json({resp,razorpay:true})
          })
   }else if(req.body['Payment-method']=="Paypal"){
     console.log("this is paypal")
     
     val = totalPrice / 74
     total = val.toFixed(2)
     let totals = total.toString()
     console.log(totals);
     req.session.total = totals

    
     const create_payment_json = {
       "intent": "sale",
       "payer": {
           "payment_method": "paypal"
       },
       "redirect_urls": {
           "return_url": "http://localhost:3000/success",
           "cancel_url": "http://localhost:3000/cancel"
       },
       "transactions": [{
           "item_list": {
               "items": [{
                   "name": "Cart items",
                   "sku": "001",
                   "price": totals,
                   "currency": "USD",
                   "quantity": 1
               }]
           },
           "amount": {
               "currency": "USD",
               "total": totals
           },
           "description": "Hat for the best team ever"
       }]
   };
    
   paypal.payment.create(create_payment_json, function (error, payment) {
     if (error) {
         throw error;
     } else {
         for(let i = 0;i < payment.links.length;i++){
           if(payment.links[i].rel === 'approval_url'){
             let url = payment.links[i].href
             res.json({ url })
           }else{
             console.log("errr");
           }
         }
     }
   });

   }
 })

})

//order succsess
router.get("/success", (req, res) => {
 const payerId = req.query.PayerID;
 const paymentId = req.query.paymentId;
 let total = req.session.total

 
 let totals = total.toString()
 const execute_payment_json = {
   payer_id: payerId,
   transactions: [
     {
       amount: {
         currency: "USD",
         total: totals,
       },
     },
   ],
 };

 paypal.payment.execute(paymentId, execute_payment_json, function (
   error,
   payment
 ) {
   if (error) {
     console.log(error.response);
     throw error;
   } else {
     console.log(JSON.stringify(payment));
     userHelpers.changeOrderStatus(req.session.orderId).then(()=>{
     
       res.redirect('/order-success')
     })
   }
 });
});

router.get("/cancel", (req, res) => res.render('user/order-cancelled'));

//order succsess page
router.get('/order-success',(req,res)=>{
 res.render('user/order-success',{adminlogin:true})
})

router.get('/order-success',(req,res)=>{
  
  res.render('user/order-success')
})

router.get('/orders',verifyLogin,async(req,res)=>{
  user1=req.session.user
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  console.log(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders,user1})
})

router.get('/view-order-products/:id',async(req,res)=>{
  user1=req.session.user
let products=await userHelpers.getOrderProducts(req.params.id)
res.render('user/view-order-products',{user1,user:req.session.user,products})
console.log(products)

})

router.get('/profile',verifyLogin,async (req,res)=>{
  userId=req.session.user._id
  let wallet=await userHelpers.getWallet(userId)
  productHelpers.getuserDetails(userId).then((user2)=>{
 
   console.log(wallet);
    let url=`http://localhost:3000/signup/${userId}`
    res.render('user/profile',{user1:req.session.user,user:true,user2,url,wallet})
     
  })    
     
})

router.post('/update-user/:id',(req,res)=>{
  let userId = req.params.id
  console.log(userId)
  console.log(req.body)
  productHelpers.updateUser(userId,req.body).then(()=>{
    res.redirect('/profile')
  })
})
router.get('/change-password/:id',verifyLogin,(req,res)=>{
  
      res.render('user/change-password')
})

router.post('/change-password',verifyLogin,(req,res)=>{
  let userId=req.session.user._id
  let pass1=req.body.password1
  let pass2=req.body.password2

  if(pass1==pass2){
    userHelpers.changePassword(userId,req.body).then((response)=>{
      if(response.status){
        req.session.loggedIn = false
        req.session.user = null
        res.redirect('/login')
      }else{
         req.session.invalidpswd = true
        res.render('user/change-password',{msg:'invalid password'})
      }
    })
  }else{
    req.session.pswdNotSame = true
    res.render('user/change-password',{notSame:'Password dosent match'}) 
  }
})

router.get('/cancel-order/:id',(req,res)=>{
    orderId=req.params.id

    userHelpers.cancelOrder(orderId)
    .then(()=>{
      res.redirect('/orders')
    })
})


router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment successful');
      res.json({status:true})
    })

  }).catch((err)=>[
    res.json({status:false,errMsg:''})
  ])
})


router.get('/add-address',verifyLogin,(req,res)=>{
  user1=req.session.user
  res.render('user/add-address',{user1,user:req.session.user})
})

router.post('/add-address/:id',(req,res)=>{
  let userId = req.params.id
  console.log(userId)
  console.log(req.body)
   userHelpers.addAddress(userId,req.body).then(()=>{
    res.redirect('/profile')
  })
})

router.get("/applyCoupon", verifyLogin, (req, res) => {
  console.log('haiiiii')
  let userId = req.session.user._id;
  productHelpers.checkCoupon(req.query.coupon, userId).then((response) => {
    res.json(response);
  });
});
router.get('/wallet',verifyLogin,(req,res)=>{
  user1=req.session.user
  res.render("user/wallet",{user1,user:true})
})


module.exports = router;
