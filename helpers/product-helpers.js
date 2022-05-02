var db=require('../config/connection')
var collection=require('../config/collections')
const async = require('hbs/lib/async')
var objectId=require('mongodb').ObjectId
var moment=require('moment')
const { reject } = require('bcrypt/promises')
const { response } = require('express')
module.exports={
    addProduct:(product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('product').insertOne(product).then((data)=>{
                resolve(data.insertedId)
            })

        })
       
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({$natural:-1}).toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{$set:{
                Name:proDetails.Name,
                Category:proDetails.Category,
                Price:proDetails.Price,
                Description:proDetails.Description

            }}).then((response)=>{
                resolve()
            })
        })
    },
    getAllusers:()=>{
        return new Promise(async(resolve,reject)=>{
          let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
          resolve(users)
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)}).then((response)=>{
                resolve(response)
            })
        })

    },
    getuserDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    updateUser:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{
                Name:userDetails.Name,
                Email:userDetails.Email,
                phone:userDetails.phone,
                house:userDetails.house,
                street:userDetails.street,
                town:userDetails.town,
                pincode:userDetails.pincode
            }}).then((response)=>{
                resolve()
            })
        })
    }, 
    addCategory:(category,callback)=>{
        
        db.get().collection('category').insertOne(category).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllcategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },

    getCatdetials:(prodId)=>{
        return new Promise(async(res,rej)=>{
            let catproducts=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:prodId}).toArray()
            console.log(catproducts);
            res(catproducts)
        })
    },

    
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().sort({$natural:-1}).toArray()

            console.log(orders)
            resolve(orders)
        })
    },


    monthlyReport:()=>{
        return new Promise(async(resolve,reject)=>{
              let today=new Date()  
              let end = moment(today).format('YYYY/MM/DD')
              let start=moment(end).subtract(30,'days').format('YYYY/MM/DD')
              let orderSUccess=await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end},status: {$ne:"canceled"}}).toArray()
             console.log(orderSUccess)
                let totalOrders=await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end}}).toArray()
             // console.log(totalOrders.length);
              console.log("tttt",orderSUccess[0].totalAmount)
             let orderSUccessLength=orderSUccess.length
             let totalOrdersLength=totalOrders.length 
             let orderfailLength=totalOrdersLength-orderSUccessLength

             let total=0;
             let Razorpay=0
             let Paypal=0
             let COD=0
             for(let i=0;i<orderSUccessLength;i++){
                 total=total+orderSUccess[i].totalAmount
                 //console.log(total)
                 if(orderSUccess[i].paymentMethod=="Razorpay"){
                     Razorpay++

                 }else if(orderSUccess[i].paymentMethod=="Paypal"){
                     Paypal++
                 }else{
                     COD++
                 }
             }
             var data = {
                start: start,
                end: end,
                totalOrders: totalOrdersLength,
                successOrders: orderSUccessLength,
                faildOrders: orderfailLength,
                totalSales: total,
                cod: COD,
                paypal: Paypal,
                razorpay: Razorpay,
                
                currentOrders: orderSUccess
            }
             resolve(data)
             




            })

    },
    Report:(result)=>{
        return new Promise(async(resolve,reject)=>{
               
              let end = moment(result.EndDate).format('YYYY/MM/DD')
              let start=moment(result.StartDate).format('YYYY/MM/DD')
              let orderSUccess=await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end},status: {$ne:"canceled"}}).toArray()
             console.log(orderSUccess)
                let totalOrders=await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:start,$lte:end}}).toArray()
             // console.log(totalOrders.length);
              
             let orderSUccessLength=orderSUccess.length
             let totalOrdersLength=totalOrders.length 
             let orderfailLength=totalOrdersLength-orderSUccessLength

             let total=0;
             let Razorpay=0
             let Paypal=0
             let COD=0
             for(let i=0;i<orderSUccessLength;i++){
                 total=total+orderSUccess[i].totalAmount
                 //console.log(total)
                 if(orderSUccess[i].paymentMethod=="Razorpay"){
                     Razorpay++

                 }else if(orderSUccess[i].paymentMethod=="Paypal"){
                     Paypal++
                 }else{
                     COD++
                 }
             }
             var data = {
                start: start,
                end: end,
                totalOrders: totalOrdersLength,
                successOrders: orderSUccessLength,
                faildOrders: orderfailLength,
                totalSales: total,
                cod: COD,
                paypal: Paypal,
                razorpay: Razorpay,
                
                currentOrders: orderSUccess
            }
             resolve(data)
             




            })

    },
  

    addProductOffer: (data) => {
        return new Promise(async(res,rej)=>{
           data.startDateIso = new Date(data.Starting)
           data.endDateIso = new Date(data.Expiry)
           let response={}
           let exist= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:data.Product,offer: { $exists: true }});
           if(exist){
               response.exist=true
               res(response)
           }else{
            db.get().collection(collection.PRODUCT_OFFERS).insertOne(data).then( (response) => {
                res(response)
            }).catch((err)=>{
                rej(err)
            })
           }
        })

    },
    startProductOffer:(todayDate)=>{
       let proStartDateIso = new Date(todayDate);
       return new Promise(async(res,rej)=>{
           let data= await db.get().collection(collection.PRODUCT_OFFERS).find({startDateIso:{$lte:proStartDateIso}}).toArray();
           if(data){
               await data.map(async(onedata)=>{
                   let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:onedata.Product, offer: { $exists: false }})
                   if(product){
                       let actualPrice =product.Price
                       let newP =(((product.Price) * (onedata.proOfferPercentage))/100)
                       let newPrice=actualPrice-newP
                       newPrice=newPrice.toFixed()
                       console.log(actualPrice,newPrice,onedata.proOfferPercentage);
                       console.log("hellow");
                       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product._id)},{
                           $set:{
                               actualPrice: actualPrice,
                               Price:newPrice,
                               offer:true,
                               proOfferPercentage:onedata.proOfferPercentage
                           }
                       })
                       res()
                   }else{
                       res()
                   }

               })

           }else{
               res()
           }
       })
    },



    getAllProOffers:()=>{
        return new Promise((res,rej)=>{
           let prooff=db.get().collection(collection.PRODUCT_OFFERS).find().toArray()
           res(prooff)
        })
    },

    getProOffersDetails:(Id)=>{
        return new Promise(async(res,rej)=>{
            let proOffer=db.get().collection(collection.PRODUCT_OFFERS).findOne({_id:objectId(Id)})
            res(proOffer)
        })
        
    },

    //delete the product offer
    deleteProOffer:(Id)=>{
        return new Promise(async(res,rej)=>{
            let productoff=await db.get().collection(collection.PRODUCT_OFFERS).findOne({_id:objectId(Id)})
            let proname=productoff?.Product;
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({Name:proname})
            db.get().collection(collection.PRODUCT_OFFERS).deleteOne({_id:objectId(Id)})
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({Name:proname},{
                $set:{
                    Price:product?.actualPrice
                },
                $unset:{
                   actualPrice:"",
                   offer:"",
                   proOfferPercentage:""
                }
            }).then(()=>{
                res()
            }).catch((err)=>{
                res(err)
            })
        })

        },

        updateProOffer:(Id,Details)=>{
            return new Promise((res,rej)=>{
                db.get().collection(collection.PRODUCT_OFFERS).updateOne({_id:objectId(Id)},{
                    $set:{
                        Product:Details.Product,
                        Starting:Details.Starting,
                        Expiry:Details.Expiry,
                       proOfferPercentage:Details.offerPercentage,
                        startDateIso:new Date(Details.Starting),
                        endDateIso:new Date(Details.endDateIso)
                    }
                }).then((response)=>{
                    res()
                }).catch((err)=>{
                    res(err)
                })
            })

        },

        addCoupon:(couponDetials)=>{
            let date=new Date()
            let NewDate=date

            let coupon={
                couponcode:couponDetials.couponcode,
                discount:parseFloat(couponDetials.discount),
                valid:parseInt(couponDetials.valid),
                description:couponDetials.description,
                expiry:new Date(couponDetials.expiry),
                createdAt:NewDate
            };
            return new Promise(async(resolve,reject)=>{
              await db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response)=>{
                  resolve();
              })
            })
        }
        ,
        displayCoupon:async()=>{
            let coupons=await db.get().collection(collection.COUPON_COLLECTION).find().toArray();
            return coupons
           
        },

        deleteCoupon:(coupenId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(coupenId)}).then((response)=>{
                    resolve(response)
                })
            })
        },
        checkCoupon: (AppliedCoupon, UserID) => {
            let date = new Date();
            let dateStart = Date.parse(date);
            let Coupon = AppliedCoupon;
            var UseriD = {
              userID: UserID ,
            };
            return new Promise(async (resolve, reject) => {
              Couponapplied = await db
                .get()
                .collection(collection.USER_COLLECTION)
                .findOne({ _id: objectId(UserID) });
        
              if (Couponapplied.couponamount) {
                resolve({ OneCouponUsed: true });
              } else {
                CouponOffer = await db
                  .get()
                  .collection(collection.COUPON_COLLECTION)
                  .findOne({ couponcode: Coupon }, { expiry: Coupon });
                let dateFinal = Date.parse(CouponOffer?.expiry);
                if (CouponOffer) {
                  if (dateFinal < dateStart) {
                    resolve({ timeout: true });
                  }
                  
                  
                  else if (CouponOffer.users) {
                    var CoupenExist = CouponOffer.users.findIndex(
                      (users) => users.userID == UserID
                    );
                    if (CoupenExist != -1) {
                      resolve({ CoupenUsed: true });
                    } else if (dateFinal < dateStart) {
                      resolve({ timeout: true });
                    } else {
                      await db
                        .get()
                        .collection(collection.USER_COLLECTION)
                        .updateOne(
                          { _id: objectId(UserID) },
                          { $set: { couponamount: CouponOffer.discount,amountValid:CouponOffer.valid } }
                        );
                        await db
                        .get()
                        .collection(collection.USER_COLLECTION)
                        .updateOne(
                          { _id: objectId(UserID) },
                          { $set: { amountValid:CouponOffer.valid } }
                        );
                      await db
                        .get()
                        .collection(collection.COUPON_COLLECTION)
                        .updateOne(
                          { _id: CouponOffer._id },
                          { $push: { users: UseriD } }
                        )
                        .then((response) => {
                          CoupDiscount = CouponOffer.discount;
                          resolve({ Coupon: true, CoupDiscount });
                        });
                    }
                  } else {
                    await db
                      .get()
                      .collection(collection.USER_COLLECTION)
                      .updateOne(
                        { _id: objectId(UserID) },
                        { $set: { couponamount: CouponOffer.discount } }
                      );
                    await db
                      .get()
                      .collection(collection.COUPON_COLLECTION)
                      .updateOne({ _id: CouponOffer._id }, { $push: { users: UseriD } })
                      .then((response) => {
                        CoupDiscount = CouponOffer.discount;
                        resolve({ Coupon: true, CoupDiscount });
                      });
                  }
                } else {
                  resolve({ NoCoupon: true });
                }
              }
            });
          },
         
          addCategoryOffer: (data) => {
            return new Promise((res,rej)=>{
                data.startDateIso=new Date(data.Starting)
               data.endDateIso=new Date(data.Expiry)
               db.get().collection(collection.CATEGORYOFFER_COLLECTION).insertOne(data).then(async (response) => {
                   res(response)
               }).catch((err) => {
                   rej(err)
               })
       
           })
           },
       
           getAllCatOffers: () => {
               return new Promise((res,rej)=>{
                   let categoryOffer=db.get().collection(collection.CATEGORYOFFER_COLLECTION).find().toArray()
                   res(categoryOffer)
               })
           },
       
           //set the catoffer
           startCategoryOffer:(date)=>{
               let catStartDateIso = new Date(date);
               console.log('this is a category offer.................... ',date);
               return new Promise(async(res,rej)=>{
                   let data= await db.get().collection(collection.CATEGORYOFFER_COLLECTION).find({startDateIso:{$lte:catStartDateIso}}).toArray();
                   if (data.length > 0) {
                       await data.map(async (onedata) => {
       
                           let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: onedata.Category, offer: { $exists: false } }).toArray();
       
                           await products.map(async (product) => {
                               let actualPrice = product.Price
                               let newPrice = (((product.Price) * (onedata.catOfferPercentage)) / 100)
                               newPrice = newPrice.toFixed()
                               console.log(actualPrice, newPrice, onedata.catOfferPercentage);
                               db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                                   {
                                       $set: {
                                           actualPrice: actualPrice,
                                           Price: (actualPrice - newPrice),
                                           offer: true,
                                           catOfferPercentage: onedata.catOfferPercentage
                                       }
                                   })
                           })
                       })
                       res();
                   }else{
                       res()
                   }
       
               })
       
           },    

    
       
           deleteCatOffer:(id)=>{
               return new Promise(async(res,rej)=>{
                   let categoryOffer= await db.get().collection(collection.CATEGORYOFFER_COLLECTION).findOne({_id:objectId(id)})
                   let catName=categoryOffer?.Category
                   let product=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:catName},{offer:{$exists:true}}).toArray()
                   if(product){
                       db.get().collection(collection.CATEGORYOFFER_COLLECTION).deleteOne({_id:objectId(id)}).then(async()=>{
                           await product.map((product)=>{
       
                               db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product._id)},{
                                   $set:{
                                       Price: product.actualPrice
                                   },
                                   $unset:{
                                       offer:"",
                                       catOfferPercentage:'',
                                       actualPrice:''
                                   }
                               }).then(()=>{
                                   res()
                               })
                           })
                       })
                   }else{
                       res()
                   }
       
               })
       
           },
}