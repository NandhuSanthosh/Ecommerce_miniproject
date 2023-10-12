const orderModel = require("../Models/orderModel");
const productModel = require("../Models/productModel");
const userCartModel = require("../Models/userCartModel");
const userModels = require("../Models/userModels");
const couponModel = require("../Models/couponModel");
const transactionsModel = require("../Models/transactionsModel");

// handles checkout, caculates prices, create order doc, make sure that the products and in stock
// and returns the checkout page link which can be used in the front end to redirect to checkout page
exports.post_checkout = async function (req, res, next) {
  try {
    let { products } = req.body;
    const userId = req.userDetails.userDetails._id;

    const productIds = products.map((x) => x.product);
    const productDetails = await productModel
      .find(
        { _id: { $in: productIds } },
        {
          name: 1,
          currentPrice: 1,
          actualPrice: 1,
          stock: 1,
          isFreeDelivery: 1,
          discount: 1,
        }
      )
      .populate("category", { offer: 1 });

    let discount = 0,
      totalPrice = 0,
      isFreeDelivery = true;
    const productObjForDB = productDetails.map((product) => {
      let quantity;
      for (let x of products) {
        if (x.product == product._id.toString()) {
          quantity = x.quantity;
        }
      }

      if (quantity > product.stock) {
        throw new Error(
          `${product.name} exceed stock, reduce the product count.`
        );
      }

      let price =
        (product.actualPrice / 100) *
        (100 - ((product.category?.offer || 0) + product.discount));
      price = Math.floor(price);
      if (price < 0) price = 0;

      let obj = {
        product: product._id,
        productName: product.name,
        quantity,
        price: price,
        payable: price,
      };

      totalPrice += product.actualPrice * quantity;
      discount += (product.actualPrice - price) * quantity;
      isFreeDelivery = isFreeDelivery && product.isFreeDelivery;
      return obj;
    });

    const userCredential =
      req.userDetails.userDetails.credentials.email ||
      req.userDetails.userDetails.credentials.mobile.number;

    const orderDoc = await orderModel.create_new_order(
      userId,
      userCredential,
      productObjForDB,
      totalPrice,
      discount,
      isFreeDelivery
    );
    const link = "http://localhost:3000/order/get_checkout_page/" + orderDoc;
    res.send({ isSuccess: true, redirect: link });
  } catch (error) {
    next(error);
  }
};

// render checkout page with all the necessary details (user address, order details)
exports.get_checkout = async function (req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.userDetails.userDetails._id;
    const orderDoc = await orderModel.find_order_details(id);
    if (orderDoc.status != "Order Pending")
      throw new Error("This order checkout is complted.");
    const userAddress = await userModels.getAddress(userId);
    res.render("authViews/checkoutPage", { orderDoc, userAddress });
  } catch (error) {
    next(error);
  }
};

// in the checkout page, the details required for the order is accepted from the user
// and these details and added to the order doc
// if the payment is from the wallet checkes wallet balance and makes the order and then updates the wallet
exports.patch_complete_order = async function (req, res, next) {
  try {
    const orderId = req.params.id;
    const { addressId, paymentMethod } = req.body;

    if (paymentMethod == "wallet") {
      let user = await userModels.findById(req.userDetails.userDetails._id);
      const order = await orderModel.findById(orderId);
      if (user.wallet.balance < order.payable) {
        throw new Error("Insufficient balance in wallet.");
      }
    }

    const orderDoc = await orderModel.complete_order_handler(
      orderId,
      addressId,
      paymentMethod,
      req.userDetails.userDetails._id
    );
    const link = "http://localhost:3000/order/get_orders";
    res.send({ isSuccess: true, redirect: link });
  } catch (error) {
    next(error);
  }
};

// return orders made by a user
exports.get_orders = async function (req, res, next) {
  try {
    const userId = req.userDetails.userDetails._id;
    const userOrders = await orderModel.find_user_orders(userId);
    res.render("authViews/ordersPage", { userOrders });
  } catch (error) {
    next(error);
  }
};

// udpates the status of a order to cancel (conditions applied)
exports.cancel_order_user = async function (req, res, next) {
  try {
    const orderId = req.query.id;
    const reason = req.query.cancelReason;
    const result = await orderModel.cancel_order(orderId, reason);
    res.send({ isSuccess: true, data: result });
  } catch (error) {
    next(error);
  }
};

// handles order return request
exports.return_order_user = async function (req, res, next) {
  try {
    const orderId = req.query.id;
    const reason = req.query.returnReason;
    const result = await orderModel.return_order(orderId, reason);
    res.send({ isSuccess: true, data: result });
  } catch (error) {
    next(error);
  }
};

// handles cancel order return request
exports.cancel_return_order = async function (req, res, next) {
  try {
    const orderId = req.query.id;
    const result = await orderModel.cancel_return_request(orderId);
    res.send({ isSuccess: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.apply_coupon = async function (req, res, next) {
  try {
    const { couponCode } = req.body;
    const { orderId } = req.query;
    const coupon = await couponModel
      .findOne({ code: couponCode })
      .populate("categories", {
        category: 1,
      });

    const order = await orderModel.findById(orderId).populate({
      path: "products.product", // Specify the path to the product reference
      populate: {
        path: "category",
        select: "category",
      },
    });

    if (!coupon) throw new Error("Invalid coupen code");
    if (!coupon.isActive) throw new Error("This coupon is not active now.");
    if (coupon.usageLimit <= coupon.numberOfCouponsUsed)
      throw new Error("The coupon reached it's limit.");
    for (let usedUser of coupon.usedUsers) {
      if (usedUser.toString() == order.userId.toString()) {
        throw new Error(
          "You have already used this coupon, you can't use the coupon again."
        );
      }
    }
    // check all the restrictions (category, usageLimit)

    if (order.coupon.code)
      throw new Error("There is already a coupon applied in this order.");
    if (new Date(coupon.expiry) < new Date())
      throw new Error("Coupon expired!");

    const products = order.products;
    let expensiveProductInCategory;
    let totalPrice = 0;
    if (coupon.categories.length) {
      const couponCategories = coupon.categories.map((x) => x._id.toString());
      for (let item of order.products) {
        if (couponCategories.includes(item.product.category?._id.toString())) {
          let currPrice = item.price * item.quantity;
          if (!expensiveProductInCategory || currPrice > totalPrice) {
            totalPrice = currPrice;
            expensiveProductInCategory = item;
          }
        }
      }
    } else {
      for (let item of order.products) {
        if (
          !expensiveProductInCategory ||
          item.price > expensiveProductInCategory.price
        ) {
          expensiveProductInCategory = item;
        }
      }
    }

    if (!expensiveProductInCategory) {
      throw new Error(
        "The coupon can't be applied on any of the products in the cart."
      );
    }

    let discount =
      coupon.discount.discountType == "percentage-discount"
        ? (expensiveProductInCategory.payable / 100) *
          coupon.discount.percentage
        : expensiveProductInCategory.price < coupon.discount.amount
        ? 0
        : expensiveProductInCategory.price - coupon.discount.amount;
    discount = Math.ceil(discount);
    expensiveProductInCategory.coupon.discount = discount;
    expensiveProductInCategory.coupon.isApplied = true;
    expensiveProductInCategory.payable =
      expensiveProductInCategory.price - discount;
    discount *= expensiveProductInCategory.quantity;

    order.coupon.code = couponCode;
    order.coupon.discount.discountType = coupon.discount.discountType;
    order.coupon.discount.percentage = coupon.discount.percentage;
    order.coupon.discount.amount = coupon.discount.amount;
    order.coupon.discountAmount = discount;

    order.payable = order.payable - discount;
    await order.save();
    res.send({ isSuccess: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.remove_coupon = async function (req, res, next) {
  try {
    const { orderId } = req.query;

    const order = await orderModel.findById(orderId).populate({
      path: "products.product", // Specify the path to the product reference
      populate: {
        path: "category",
        select: "category",
      },
    });

    if (!order.coupon.code)
      throw new Error("There is no coupon applyed on this purchase.");

    const products = order.products;
    let couponAppliedProduct;
    products.forEach((x) => {
      if (x.coupon.isApplied) {
        couponAppliedProduct = x;
      }
    });

    let discount = couponAppliedProduct.coupon.discount;
    couponAppliedProduct.payable = couponAppliedProduct.payable + discount;
    couponAppliedProduct.coupon.discount = 0;
    couponAppliedProduct.coupon.isApplied = false;

    let couponCode = order.coupon.code;
    order.coupon.code = null;
    order.coupon.discount.discountType = null;
    order.coupon.discount.percentage = 0;
    order.coupon.discount.amount = 0;
    order.coupon.discountAmount = 0;

    discount *= couponAppliedProduct.quantity;

    order.payable = order.payable + discount;
    await order.save();
    res.send({ isSuccess: true, data: order });
  } catch (error) {
    next(error);
  }
};

// return the details of the order which can be used to create the invoice
exports.get_order_invoice = async function (req, res, next) {
  try {
    const { orderId } = req.query;
    if (!orderId) throw new Error("Please provide necessary informations.");

    const order = await orderModel
      .findById(orderId)
      .populate("userAddressId")
      .populate("products.product", {
        brand: 1,
        modelName: 1,
      });
    if (!order) throw new Error("Order Id not valid.");

    const invoiceNumber = order._id.toString().slice(-5);
    res.send({ isSuccess: true, order, invoiceNumber });
  } catch (error) {
    next(error);
  }
};

// ADMIN
// return the different states a order can be, which is used to updated the order state
exports.get_order_stages = async function (req, res, next) {
  try {
    const orderStages = await orderModel.fetch_all_stages();
    res.send({ isSuccess: true, data: orderStages });
  } catch (error) {
    next(error);
  }
};

// retuns all the orders (pagination)
exports.get_all_order = async function (req, res, next) {
  try {
    const p = req.query.pno;
    const { data, totalCount } = await orderModel.find_all_order(p);
    res.send({ isSuccess: true, data, totalCount });
  } catch (error) {
    next(error);
  }
};

// handles order state update
exports.patch_update_status = async function (req, res, next) {
  try {
    const { id, status, cancelReason } = req.query;
    const result = await orderModel.update_order_status(
      id,
      status,
      cancelReason
    );
    res.send({ isSuccess: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.patch_update_estimateDeliveryDate = async function (req, res, next) {
  try {
    const { id, newExtimatedDate } = req.query;
    const updatedOrder = await orderModel.update_extimated_date(
      id,
      newExtimatedDate
    );
    res.send({ isSuccess: true, updatedOrder });
  } catch (error) {
    next(error);
  }
};

// returns the order list based on the search key, matching is done on user credential and product name
exports.get_serach_result = async function (req, res, next) {
  try {
    const searchKey = req.query.searchKey;
    const page = req.query.pno;
    if (!searchKey) throw new Error("Please provide necessary informations");
    const { orders, totalOrders } = await orderModel.get_search_result(
      searchKey,
      page
    );
    res.send({ isSuccess: true, data: orders, totalCount: totalOrders });
  } catch (error) {
    next(error);
  }
};

// returns the complete details of a order (price and discount, address, user details, product details etc)
exports.get_complete_order_details = async function (req, res, next) {
  try {
    const id = req.params.id;
    const order = await orderModel.complete_order_details(id);
    res.send({ isSuccess: true, data: order });
  } catch (error) {
    next(error);
  }
};
