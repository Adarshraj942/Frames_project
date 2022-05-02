var express = require('express');
const async = require('hbs/lib/async');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')
const fs=require('fs')
const credential={
  email:process.env.ADMINEMAIL,
  password:process.env.ADMINPASSWORD
}

const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next();
  }else{
    res.redirect('/admin/admin-login')
  }
}


/* GET users listing. */
router.get('/',verifyLogin,async function(req, res, next) {
  let admin1=req.body.session
 let products=await productHelper.getAllProducts()
 let totalPro=products.length
 let data=await productHelper.monthlyReport()
 let users=await productHelper.getAllusers()
 
 let totuser=await userHelpers.getUserCount()
 res.render('admin/dashboard',{admin:true,products,user,totalPro,totuser,data,users})
  
  
});

router.get('/view-product',verifyLogin,function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products,user})
  })
  
});
router.get('/admin-login',(req,res)=>{
  if(req.session.adminLoggedIn){
    admin=req.session.adminLoggedIn=true;
    res.redirect('/admin')
  }else{
    res.render('admin/admin-login',{adminheader:true})
  } 
})

router.post('/admin-login',(req,res)=>{
  if(req.body.Email==credential.email&&req.body.Password==credential.password){
     user=req.session.adminLoggedIn=true;
    req.session.admin=req.body.Email
    res.redirect('/admin')
  }else{
    res.render('admin/admin-login',{msg:"login failed"})
  }
})

router.get('/add-product',verifyLogin, async (req, res) => {

    let category = await productHelper.getAllcategory().then();
    res.render('admin/add-product', { admin: true, category });
  })
router.post('/add-product',verifyLogin,(req,res)=>{

 

  productHelpers.addProduct(req.body).then((result)=>{

        
    
    if(req.files?.Image){
      let Image=req.files.Image
     Image.mv('./public/product-images/'+result+'a.jpg',(err,done)=>{
     
    })
  }
  if(req.files?.Image2){
    let Image=req.files.Image2
    Image.mv("./public/product-images/"+result+"b.jpg",(err,done)=>{
   
   })
 }
 if(req.files?.Image3){
   let Image=req.files.Image3
  Image.mv('./public/product-images/'+result+'c.jpg',(err,done)=>{
  
 })
}
if(req.files?.Image4){
  let Image=req.files.Image4

  Image.mv('./public/product-images/'+result+'d.jpg',(err,done)=>{
 
 })
}
   res.redirect("/admin") 

  })
     

  

})



router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{product,admin:true})
})

router.post('/edit-product/:id',verifyLogin,(req,res)=>{
  
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
  
    if(req.files?.Image){

      let image=req.files.Image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
  })
})

router.get('/view-user',verifyLogin,(req,res)=>{
  productHelpers.getAllusers().then((users)=>{
    res.render('admin/view-user',{admin:true,users,users})
  })
});



router.get('/edit-user/:id',verifyLogin,async(req,res)=>{
  let user=await productHelpers.getuserDetails(req.params.id)
    res.render('admin/edit-user',{user,admin:true})
})

router.post('/edit-user/:id',(req,res)=>{
  let userId = req.params.id
  productHelpers.updateUser(userId,req.body).then(()=>{
    res.redirect('/admin/view-user')
  })
})

router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin/admin-login')
})


router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let proId=req.params.id
productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })
})

router.get('/block-user/:id',verifyLogin,(req,res)=>{
  let userdata = req.params.id
  userHelpers.blockUser(userdata).then((response)=>{
    res.redirect('/admin/view-user')
  })
});

router.get('/unblock-user/:id',verifyLogin,(req,res)=>{
  let userdata = req.params.id
  userHelpers.unblockUser(userdata).then((response)=>{
    res.redirect('/admin/view-user')
  })
});


router.get('/add-category',verifyLogin,(req,res)=>{
  res.render('admin/add-category',{admin:true})
})

router.post('/add-category',verifyLogin,(req,res)=>{
  console.log(req.body);
  console.log(req.files.Image);

  productHelpers.addCategory(req.body,(result)=>{
    let image=req.files.Image
    image.mv('./public/category-images/'+result+'.jpg',(err,done)=>{
      if(!err){
        res.redirect("/admin")
      }
    })
    
  })
    
})

router.get('/view-category',verifyLogin,(req,res)=>{ 
  productHelpers.getAllcategory().then(category=>{
    console.log(category)
    res.render('admin/view-category',{admin:true,category})
  })
})


router.get('/delete-image/:id',verifyLogin,(req,res)=>{
  let imgId=req.params.id
  const path1=`./public/product-images/${imgId}.jpg`
  if (fs.existsSync(path1)) {
    fs.unlink(path1, (err) => {
        if (err) {
            console.log(err);
        }
        console.log('deleted');
        res.redirect('/admin')
    })
    
}
 

})

router.get('/view-orders',verifyLogin,(req,res)=>{
      productHelper.getAllOrders().then((orders)=>{
           res.render('admin/view-orders',{admin:true,orders})
      })
})

router.get('/cancel-order-admin/:id',verifyLogin,(req,res)=>{
  orderId=req.params.id
  
  userHelpers.cancelOrder(orderId).then(()=>{
    res.redirect('/admin/view-orders')
  })
  
  
  })


  router.get('/order-shipped/:id',verifyLogin,(req,res)=>{
    orderId=req.params.id
    
    userHelpers.orderShipped(orderId).then(()=>{
      res.redirect('/admin/view-orders')
    })
    
    
    })


    router.get('/order-delivered/:id',verifyLogin,(req,res)=>{
      orderId=req.params.id
      
      userHelpers.orderDelivered(orderId).then(()=>{
        res.redirect('/admin/view-orders')
      })
      
      
      })
  



router.get('/sales-report',verifyLogin,async (req,res)=>{
   
productHelper.monthlyReport().then((data)=>{
  console.log(data)
  res.render("admin/sales-report",{admin:true,data})
})

})

router.post('/sales-report',verifyLogin,(req,res)=>{
  console.log(req.body)
 let sDate=  req.body.StartDate
 let eDate=req.body.EndDate
  productHelper.Report(req.body).then((data)=>{
    console.log(data)
    res.render('admin/sales-report',{admin:true,data,sDate,eDate})
  })
})


router.get('/product-offers',verifyLogin,async(req,res)=>{
   let products=await productHelper.getAllProducts()
   let proOffers= await productHelper.getAllProOffers()
   res.render('admin/product-offer',{admin:true,products,proOffers,"proOfferExist": req.session.proOfferExist })
   req.session.proOfferExist=false;
 
 
})

router.post('/product-offers',(req,res)=>{
productHelper.addProductOffer(req.body).then((response)=>{
    if(response.exist){
      req.session.proOfferExist = true
      res.redirect("/admin/product-offers") 
    }else{
    res.redirect("/admin/product-offers")    
    }
   })
})

router.get('/delete-proOffer/:id',(req,res)=>{
  productHelper.deleteProOffer(req.params.id).then(()=>{
    res.redirect("/admin/product-offers")

  })
})
router.get('/edit-proOffer/:id',(req,res)=>{
  console.log(req.params.id);
  productHelper.getProOffersDetails(req.params.id).then(async(proOffer)=>{

    let products = await productHelpers.getAllProducts()
    console.log(products);
    
    res.render('admin/edit-proOffer',({admin:true,proOffer,products}))
  })

  router.post('/edit-proOffer/:id',(req,res)=>{

    console.log(req.params.id);

    productHelper.updateProOffer(req.params.id,req.body).then((response)=>{
      res.redirect("/admin/product-offers")

    })
  })
  
})

router.get('/admin-coupon',verifyLogin,async (req,res)=>{
  let coupons=await productHelper.displayCoupon()
  res.render('admin/admin-coupon',{admin:true,coupons})
})
router.get('/add-coupons',verifyLogin,(req,res)=>{
  res.render('admin/add-coupons',{admin:true})
})

router.post('/add-coupons',(req,res)=>{
  console.log(req.body)
   productHelper.addCoupon(req.body).then(()=>{
    res.redirect("/admin/admin-coupon");
   })
})

router.get('/delete-coupon/:id',(req,res)=>{
couponId=req.params.id
  productHelper.deleteCoupon(couponId).then((response)=>{
    res.redirect('/admin/admin-coupon')
  })
})

router.get('/category-offer', verifyLogin, async (req, res) => {
  let category= await productHelper.getAllcategory()
  console.log(category);
  let catOffers= await productHelper.getAllCatOffers();
  res.render('admin/category-offer',{admin:true,category,catOffers
  })
})

router.post('/category-offers',(req,res)=>{
  productHelper.addCategoryOffer(req.body).then((response)=>{
    
  
    if(response.catOffr){
      req.session.proOfferExist = true
      res.redirect("/admin/category-offer") 
    }else{
    res.redirect("/admin/category-offer")    
    }   
  })
})

//delete category
router.get('/delete-catOffer/:id',(req,res)=>{
 productHelper.deleteCatOffer(req.params.id).then(()=>{
    res.redirect('/admin/category-offer')
  })

})


module.exports = router;
