const {
  generateOtp,
  createOtpDocument,
} = require("../Middleware/authUtilMiddleware");
const {
  sendResponseMail,
  sendMailWithButton,
  sendPasswordResetMail,
} = require("../Middleware/sendMail");
const sendOtp = require("../Middleware/sendOtp");
const { ObjectId } = require("mongoose").Types;

const addressModel = require("../Models/addressModel");
const otpModel = require("../Models/otpModel");
const userModel = require("../Models/userModels");
const transactionModel = require("../Models/transactionsModel");
const referalModel = require("../Models/referalModel");

const forgotPasswordTokensModel = require("../Models/forgotPasswordModel");
const jwt = require("jsonwebtoken");
const productModel = require("../Models/productModel");
const {
  DomainConfigMessagingServiceContextImpl,
} = require("twilio/lib/rest/messaging/v1/domainConfigMessagingService");
const { createOrder, verify_payment } = require("../Middleware/onlinePayment");

const associate = "user";

// renders the home page
exports.get_home = async function (req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("./authViews/userHome.ejs", { product: {} });
};

const twoPFiveSeconds = 2.5 * 60; // seconds
const threeDaysSeconds = 3 * 24 * 60 * 60;

// create jwt token with user details
// parameters are userdetails, maxAge which is the expiry time for the token, status user current state, and user id
function createToken(userDetails, maxAge, status, id) {
  return jwt.sign(
    {
      userDetails,
      status,
      id,
    },
    process.env.JWT_KEY,
    {
      expiresIn: maxAge,
    }
  );
}

// render login page
exports.get_login = (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("authViews/signup-login", { page: "login", associate });
};

// render signin page
exports.get_signup = async (req, res) => {
  const refCode = req.query.ref;
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("authViews/signup-login", {
    page: "signup",
    associate,
    superSet: "signup",
    refCode,
  });
};

// login request handler, checkes the credentails and if valid sets authentication token for otp page
exports.post_login = async (req, res, next) => {
  const { credentials, password } = req.body;
  try {
    if ((!credentials.email && !credentials.mobile) || !password) {
      throw new Error("Please provide necessary informations.");
    }
    const result = await userModel.login(credentials, password);
    const { response, id } = await sentOtpHelper({ userDetails: result });
    response
      .then((d) => {
        const jwtToken = createToken(
          {
            _id: result._id,
            credentials: result.credentials,
            name: result.name,
          },
          twoPFiveSeconds,
          "awaiting-otp",
          id
        );
        res.cookie("uDAO", jwtToken, {
          maxAge: twoPFiveSeconds * 1000,
          httpOnly: true,
        });

        res.send({ isSuccess: true });
      })
      .catch((e) => {
        next(e);
      });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// clears user authentication token and redirects to login page
exports.get_logout = async (req, res, next) => {
  try {
    res.clearCookie("uDAO");
    res.redirect("./login");
  } catch (error) {
    next(error);
  }
};

// render otp page, associate is to specify whether it is admin or user
exports.get_otpAuthPage = async (req, res) => {
  const superSet = req.query.superSet;
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("authViews/signup-login", {
    page: "otpAuth",
    associate,
    superSet,
  });
};

// creates user document, check referal code, and apply authentication token.
exports.post_signin = async (req, res, next) => {
  const userDetails = req.body;
  try {
    const { referalCode } = userDetails;
    if (referalCode) {
      delete userDetails.referalCode;
      let referedByUser = await userModel.findOne({ referalCode });
      if (!referedByUser) {
        throw new Error("Invalid refereal code.");
      }
      userDetails.referedBy = referedByUser._id;
    }
    const user = await userModel.create(userDetails);

    const { response, id } = await sentOtpHelper({ userDetails: user });
    response
      .then((d) => {
        const jwtToken = createToken(
          { _id: user._id, credentials: user.credentials, name: user.name },
          twoPFiveSeconds,
          "awaiting-otp",
          id
        );
        res.cookie("uDAO", jwtToken, {
          maxAge: twoPFiveSeconds * 1000,
          httpOnly: true,
        });
        res.send({ isSuccess: true, jwtToken });
      })
      .catch((e) => {
        next(e);
      });
  } catch (error) {
    next(error);
  }
};

// sends otp to user credential (email or password)
exports.get_otp = async (req, res) => {
  const result = req.userDetails;
  const { response, id } = await sentOtpHelper(result);
  response
    .then((d) => {
      const jwtToken = createToken(
        {
          _id: result.userDetails._id,
          credentials: result.userDetails.credentials,
          name: result.userDetails.name,
        },
        twoPFiveSeconds,
        "awaiting-otp",
        id
      );
      res.cookie("uDAO", jwtToken, {
        maxAge: twoPFiveSeconds * 1000,
        httpOnly: true,
      });
      res.send({ isSuccess: true });
    })
    .catch((error) => {
      res.send({ isSuccess: false, errorMessage: error.message });
    });
};

// based on which credential type user uses to sign in (email or mobile) send the otp to it.
async function sentOtpHelper(result) {
  const { id, otp } = await createOtpDocument(
    result.userDetails.credentials.email
      ? result.userDetails.credentials.email
      : result.userDetails.credentials.mobile.number,
    "user"
  );
  const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
  if (result.userDetails.credentials.email) {
    return {
      id,
      response: sendResponseMail(
        message,
        otp,
        result.userDetails.credentials.email,
        result.userDetails.name
      ),
    };
  } else {
    // return {id, response: sendOtp(message)}
    return {
      id,
      response: new Promise((res, rej) => {
        res();
      }),
    };
  }
}

// verifies the otp user sends and updates the jwt token.
// if the user is signing in then user account status is updated, if referal code is used referal reward is given to refered user.
exports.post_verifyOtp = async (req, res) => {
  // find the doucment using user cookie
  const { otp } = req.body;
  try {
    const result = req.userDetails;

    const otpDoc = await otpModel.findDoc(result.id, otp);
    const { userDetails } = result;
    if (!userDetails.isVerified) {
      let amount = 100;
      const user = await userModel.findById(userDetails._id);
      if (user.referedBy) {
        const referedUserId = user.referedBy;
        const transaction = await transactionModel.create({
          amount: amount,
          timestamp: new Date(),
          receiverID: referedUserId,
          category: "referal",
        });
        let referedUser = await userModel.findById(referedUserId);
        const newBalance = referedUser.wallet.balance + amount;
        const transactionDoc = {
          type: "credit",
          transactionId: transaction._id,
          beforeBalance: referedUser.wallet.balance,
          afterBalance: newBalance,
        };

        referedUser = await userModel.findByIdAndUpdate(referedUserId, {
          $set: { "wallet.balance": newBalance },
          $push: { "wallet.transactions": transactionDoc },
        });
      }
      userModel.verify(userDetails._id);
    }
    const jwtToken = createToken(
      {
        _id: userDetails._id,
        credentials: userDetails.credentials,
        name: userDetails.name,
      },
      threeDaysSeconds,
      "loggedIn"
    );
    res.cookie("uDAO", jwtToken, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.send({ isSuccess: true });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// render forgot password page
exports.get_forgotPassword = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("authViews/signup-login", { page: "forgot-password", associate });
};

// takes the user credential and sends resent otp link if user exists
exports.post_forgotPassword = async (req, res, next) => {
  try {
    const { credentail } = req.body;
    const userName = await userModel.isValidCredentail(credentail);
    const newToken = await forgotPasswordTokensModel.create_new_token(
      credentail.email || credentail.mobile
    );
    if (credentail.email) {
      const link = "http://localhost:3000/reset_password/" + newToken.key;
      sendPasswordResetMail(userName, link, credentail.email);
    }
  } catch (error) {
    next(error);
  }
};

// render reset password page
exports.get_resetPassword = async (req, res, next) => {
  try {
    // take key
    const key = req.params.key;
    const email = await forgotPasswordTokensModel.validate_key(key);
    res.render("authViews/resetPasswordPage", { key, associate });
  } catch (error) {
    next(error);
  }
};

// updates user password
exports.post_resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const key = req.params.key;
    const credentail = await forgotPasswordTokensModel.validate_key(key);
    const user = await userModel.update_password(credentail, newPassword);
    await forgotPasswordTokensModel.expire_token(credentail);
    const jwtToken = createToken(
      { _id: user._id, credentials: user.credentials, name: user.name },
      threeDaysSeconds,
      "loggedIn"
    );
    res.cookie("uDAO", jwtToken, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.send({ isSuccess: true });
  } catch (error) {
    next(error);
  }
};

// render user settings page
exports.get_settings = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    const addresses = await userModel.getAddress(userId);
    res.render("authViews/settings", {
      userDetails: req.userDetails.userDetails,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

exports.post_addAddress = async (req, res, next) => {
  try {
    const { addressDetails } = req.body;
    const userId = req.userDetails.userDetails._id;
    const newAddress = await addressModel.create(addressDetails);
    const updatedUser = await userModel.addAddress(newAddress._id, userId);
    res.send({ isSuccess: true, newAddress, updatedUser });
  } catch (error) {
    next(error);
  }
};

exports.get_allAddress = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    const addresses = await userModel.getAddress(userId);
    res.send({ isSuccess: true, addresses });
  } catch (error) {
    next(error);
  }
};

exports.delete_address = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    const addressId = req.params.id;
    const result = await userModel.deleteAddress(userId, addressId);
    res.send({ isSuccess: true });
  } catch (error) {
    next(error);
  }
};

exports.patch_address = async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const { updatedData } = req.body;
    const result = await addressModel.edit_address(addressId, updatedData);
    res.send({ isSuccess: true, data: result });
  } catch (error) {
    next(error);
  }
};

// updare user name handler
exports.patch_updateName = async (req, res, next) => {
  try {
    const id = req.userDetails.userDetails._id;
    const newName = req.body.name;
    const user = await userModel.update_name(id, newName);
    const jwtToken = createToken(
      { _id: user._id, credentials: user.credentials, name: user.name },
      threeDaysSeconds,
      "loggedIn"
    );
    res.cookie("uDAO", jwtToken, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.send({ isSuccess: true, user });
  } catch (error) {
    next(error);
  }
};

exports.patch_changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userModel.change_password(
      req.userDetails.userDetails._id,
      currentPassword,
      newPassword
    );
    res.send({ isSuccess: true, result });
  } catch (error) {
    next(error);
  }
};

// WISH LIST
exports.post_addToWishList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    const productId = req.query.productId;

    const product = await productModel.findById(productId);
    if (!product) throw new Error("Invalid product ID");

    const updatedUserDetails = await userModel.updateOne(
      { _id: userId },
      { $addToSet: { wishList: productId } }
    );

    const isAdded = updatedUserDetails.modifiedCount;
    if (!isAdded) {
      await userModel.updateOne(
        { _id: userId },
        { $pull: { wishList: productId } }
      );
    }

    res.send({ isSuccess: true, isAdded });
  } catch (error) {
    next(error);
  }
};

exports.post_removeFromWishList = async (req, res, next) => {
  try {
    const productId = req.query.productId;
    const userId = req.userDetails.userDetails._id;
    if (!productId) throw new Error("Please provide necessary information.");
    const updatedUser = await userModel.findByIdAndUpdate(userId, {
      $pull: { wishList: productId },
    });
    res.send({ isSuccess: true });
  } catch (error) {
    next(error);
  }
};

// render wishlist page
exports.get_wishList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    const userDetails = await userModel.findById(userId).populate({
      path: "wishList",
      select:
        "name images currentPrice isFreeDelivery warranty actualPrice category discount",
      populate: {
        path: "category",
        select: "offer",
      },
    });
    res.render("./authViews/userHome.ejs", {
      page: "wishList-page",
      product: userDetails.wishList,
    });
  } catch (error) {
    next(error);
  }
};

// WALLET
// render wallet page with wallet balace and credential
exports.get_wallet = async (req, res, next) => {
  try {
    const { userDetails } = req.userDetails;
    let user = await userModel.findById(userDetails._id, {
      credentials: 1,
      wallet: 1,
    });
    res.render("authViews/userHome", {
      page: "wallet",
      balance: user.wallet?.balance || 0,
      credential: user.credentials.email || user.credentials.mobile.number,
    });
  } catch (error) {
    next(error);
  }
};

// find user with credential, used in wallet send money option
exports.get_userWallet = async (req, res, next) => {
  try {
    const credentail = req.query.userCredential;
    const user = await userModel.findOne(
      {
        $or: [
          {
            "credentials.email": credentail,
          },
          {
            "credentials.mobile.number": credentail,
          },
        ],
      },
      {
        name: 1,
      }
    );
    if (user) res.send({ isSuccess: true, data: user });
    else throw new Error("There is no such user.");
  } catch (error) {
    next(error);
  }
};

// return the transaction history of the user
exports.get_transactionHistory = async (req, res, next) => {
  try {
    const pageNo = req.query.pno;
    const currentWindow = req.query.currentWindow;
    const docPerPage = 10;
    const { userDetails } = req.userDetails;

    let windowFilterQuery = {};
    if (currentWindow) {
      windowFilterQuery = {
        "wallet.transactions.transactionId.category": currentWindow,
      };
    }

    const pipeline = [
      {
        $match: { _id: new ObjectId(userDetails._id) },
      },
      {
        $unwind: "$wallet.transactions",
      },
      {
        $lookup: {
          from: "transactions", // Replace with your actual transactions collection name
          localField: "wallet.transactions.transactionId",
          foreignField: "_id",
          as: "wallet.transactions.transactionId",
        },
      },
      {
        $unwind: "$wallet.transactions.transactionId",
      },
      {
        $match: windowFilterQuery,
      },
      {
        $lookup: {
          from: "users",
          localField: "wallet.transactions.transactionId.receiverID",
          foreignField: "_id",
          as: "wallet.transactions.transactionId.receiverID",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "wallet.transactions.transactionId.senderID",
          foreignField: "_id",
          as: "wallet.transactions.transactionId.senderID",
        },
      },
      {
        $sort: {
          "wallet.transactions.transactionId.timestamp": -1,
        },
      },
      {
        $project: {
          wallet: 1,
        },
      },
      {
        $skip: pageNo * docPerPage,
      },
      {
        $limit: docPerPage,
      },
      {
        $group: {
          _id: null,
          transactions: { $push: "$wallet" },
        },
      },
    ];

    const pipeline2 = [
      {
        $match: { _id: new ObjectId(userDetails._id) },
      },
      {
        $unwind: "$wallet.transactions",
      },
      {
        $lookup: {
          from: "transactions", // Replace with your actual transactions collection name
          localField: "wallet.transactions.transactionId",
          foreignField: "_id",
          as: "wallet.transactions.transactionId",
        },
      },
      {
        $unwind: "$wallet.transactions.transactionId",
      },
      {
        $match: windowFilterQuery,
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ];

    const user = await userModel.aggregate(pipeline);
    const totalCount = await userModel.aggregate(pipeline2);
    res.send({ isSuccess: true, data: user[0], totalCount: totalCount[0] });
  } catch (error) {
    next(error);
  }
};

exports.get_wallet_balance = async (req, res, next) => {
  try {
    const { userDetails } = req.userDetails;
    const userId = userDetails._id;
    const user = await userModel.findById(userId, { "wallet.balance": 1 });
    res.send({ isSuccess: true, data: { balance: user.wallet.balance } });
  } catch (error) {}
};

// user can add money to the wallet user razor pay, this controller handlers razorpay payment order creation
exports.create_paymentOrder = async (req, res, next) => {
  try {
    const amount = req.body.amount;
    if (amount <= 0) throw new Error("The amount is not valid");
    const orderId = await createOrder(amount);
    res.send({ isSuccess: true, orderId });
  } catch (error) {
    next(error);
  }
};

// verify payment and add money to wallet and updates transaction history
exports.verify_payment = async (req, res, next) => {
  try {
    if (verify_payment(req.body.response)) {
      const { amount } = req.body;
      const userId = req.userDetails.userDetails._id;
      const transaction = await transactionModel.create({
        amount: amount,
        timestamp: new Date(),
        receiverID: userId,
        category: "addToWallet",
      });
      let user = await userModel.findById(userId);
      const newBalance = user.wallet.balance + amount;
      const transactionDoc = {
        type: "credit",
        transactionId: transaction._id,
        beforeBalance: user.wallet.balance,
        afterBalance: newBalance,
      };
      user.wallet.transactions.push(transactionDoc);

      user = await userModel.findByIdAndUpdate(user._id, {
        $set: { "wallet.balance": newBalance },
        $push: { "wallet.transactions": transactionDoc },
      });
      res.send({ isSuccess: true, data: newBalance });
    } else {
      throw new Error("Payment verification failed.");
    }
  } catch (error) {
    next(error);
  }
};

// send money to user handler, checks whether user has necessary amount in the wallet and if user has
// it is send to the beneficiary wallet and transaction history is updated for both the users
exports.post_sentToUser = async (req, res, next) => {
  try {
    const senderID = req.userDetails.userDetails._id;
    const { receiverID, amount } = req.body;

    if (!receiverID || !amount)
      throw new Error("Please provide necessary details");

    const receiver = await userModel.findById(receiverID);
    if (!receiver) throw new Error("There is no such user.");

    const sender = await userModel.findById(senderID);
    if (sender.wallet.balance < amount) throw new Error("Insuffcient balance.");

    const transaction = await transactionModel.create({
      amount,
      timestamp: new Date(),
      senderID,
      receiverID,
      category: "betweenUsers",
    });

    const senderTransactionDoc = {
      type: "debit",
      transactionId: transaction._id,
      beforeBalance: sender.wallet.balance,
      afterBalance: sender.wallet.balance - amount,
    };
    const receiverTransactionDoc = {
      type: "credit",
      transactionId: transaction._id,
      beforeBalance: receiver.wallet?.balance || 0,
      afterBalance: (receiver.wallet?.balance || 0) + amount,
    };
    const updatedSender = await userModel.findByIdAndUpdate(
      senderID,
      {
        $set: { "wallet.balance": sender.wallet.balance - amount },
        $push: { "wallet.transactions": senderTransactionDoc },
      },
      { new: true }
    );
    const updatedReceiver = await userModel.findByIdAndUpdate(
      receiverID,
      {
        $set: { "wallet.balance": receiver.wallet.balance + amount },
        $push: { "wallet.transactions": receiverTransactionDoc },
      },
      { new: true }
    );

    res.send({ isSuccess: true, data: updatedSender.wallet.balance });
  } catch (error) {
    next(error);
  }
};

// if user has referal code then returns it
// else creates a referal code and returns it
exports.get_referals = async (req, res, next) => {
  try {
    const userId = req.userDetails.userDetails._id;
    let user = await userModel.findById(userId);
    let { referalCode } = user;
    if (!referalCode) {
      referalCode = await referalModel.get_string();
      user = await userModel.findByIdAndUpdate(
        userId,
        { $set: { referalCode } },
        { new: true }
      );
      referalCode = user.referalCode;
    }
    const referalLink = "http://localhost:3000/signin?ref=" + referalCode;
    res.send({ isSuccess: true, referalCode, referalLink });
  } catch (error) {}
};
