var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");
const Razorpay = require("razorpay");
const moment = require("moment");
var instance = new Razorpay({
  key_id: "rzp_test_Ucq2w4umTivUct",
  key_secret: "w3Svn2o1L1OqmagYBYSVl9w2",
});

const { reject, promise } = require("bcrypt/promises");
const { resolve } = require("path");
var objectId = require("mongodb").ObjectId;
module.exports = {
  doSignup: (userData) => {
    userData.auth = true;
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      if (userData.referId) {
        let wallet = 0;
        if (wallet <= 500) {
          userData.wallet = 100;
          db.get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userData)
            .then((data) => {
              db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: objectId(userData.referId) },
                  {
                    $inc: {
                      wallet: 100,
                    },
                  }
                );
              resolve(data.insertedId);
            });
        } else {
        }
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
      }
    });
  },
  substractWallet: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $inc: {
              wallet: -100,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  substractCoupon: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $unset: {
              couponamount: "",
            },
          }
        )
        .then((data) => {
          resolve(data);
        });

      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $unset: {
              amountValid: "",
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;

      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });

      if (user && user.auth) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  otpUserCreation: (phone) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ phone: phone });
      if (user) {
        resolve({ insertedId: user._id });
      } else {
        let data = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .insertOne({
            phone: phone,
          });
        resolve(data);
      }
    });
  },
  emailchecker: (mail) => {
    return new Promise(async (res, rej) => {
      let found = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: mail });
      res(found);
    });
  },
  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, { $unset: { auth: true } })
        .then((response) => {
          resolve(response);
        });
    });
  },
  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(userId) }, { $set: { auth: true } })
        .then((response) => {
          resolve(response);
        });
    });
  },
  showProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ _id: objectId(proId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let UserCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (UserCart) {
        let proExist = UserCart.products.findIndex(
          (product) => product.item == proId
        );
        console.log(proExist);

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },

              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log(cartItems);
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (detials) => {
    detials.count = parseInt(detials.count);
    detials.quantity = parseInt(detials.quantity);

    return new Promise((resolve, reject) => {
      if (detials.count == -1 && detials.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(detials.cart) },
            {
              $pull: { products: { item: objectId(detials.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(detials.cart),
              "products.item": objectId(detials.product),
            },
            {
              $inc: { "products.$.quantity": detials.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  removeFromCart: (detials) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(detials.cart) },
          {
            $pull: { products: { item: objectId(detials.product) } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let Total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    { $toInt: "$quantity" },
                    { $toInt: "$product.Price" },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      console.log(Total);
      resolve(Total[0]?.total);
    });
  },

  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let dateIso = new Date();
      let date = moment(dateIso).format("YYYY/MM/DD");
      let time = moment(dateIso).format("HH:mm:ss");
      console.log(order, products, total);
      let status = order["Payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetials: {
          Name: order.Name,
          Mobile: order.Mobile,
          House: order.House,
          Town: order.Town,

          Email: order.Email,
          PIN: order.PIN,
        },
        userId: objectId(order.userId),
        paymentMethod: order["Payment-method"],
        products: products,
        Date: date,
        Time: time,

        totalAmount: total,
        status: status,
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .remove({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log(cart);
      resolve(cart?.products);
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ $natural: -1 })
        .limit(10)
        .toArray();
      console.log(orders);

      resolve(orders);
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log(orderItems);
      resolve(orderItems);
    });
  },

  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "canceled",
              Cancelled: true,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  orderShipped: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Shipped",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  orderDelivered: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Delivered",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  changePassword: (userId, data) => {
    return new Promise(async (res, rej) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      if (user) {
        let data1 = await bcrypt.hash(data.password1, 10);
        bcrypt.compare(data.current, user.Password).then((status) => {
          if (status) {
            response.status = true;
            console.log("the password matchig success");
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    Password: data1,
                  },
                }
              )
              .then(() => {
                res(response);
              });
          } else {
            response.status = false;
            res(response);
            console.log("current password is invalid");
          }
        });
      }
    });
  },
  generateRazorPay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("hello adarsh ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (detials) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "w3Svn2o1L1OqmagYBYSVl9w2");
      hmac.update(
        detials["payment[razorpay_order_id]"] +
          "|" +
          detials["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == detials["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changeOrderStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  addAddress: (userId, detials) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      if (user.address) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            {
              $push: {
                address: detials,
              },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        addr = [detials];
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            {
              $set: {
                address: addr,
              },
            }
          )
          .then((user) => {
            resolve(user);
          });
      }
    });
  },

  getAddress: (userId) => {
    console.log("helooii" + userId);
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      console.log("haii" + user);
      let address = user.address;
      console.log(address);
      resolve(address);
    });
  },
  getWallet: (userId) => {
    console.log("helooii" + userId);
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      console.log("haii" + user);
      let wallet = user.wallet;
      console.log(wallet);
      resolve(wallet);
    });
  },
  getUserCount: async () => {
    return new Promise((resolve, reject) => {
      let userCount = db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .count();
      resolve(userCount);
    });
  },
};
