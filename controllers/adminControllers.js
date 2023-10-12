const jwt = require("jsonwebtoken");

const adminModel = require("../Models/adminModel");
const { createOtpDocument } = require("../Middleware/authUtilMiddleware");
const {
  sendResponseMail,
  sendPasswordResetMail,
} = require("../Middleware/sendMail");

const otpModel = require("../Models/otpModel");
const userModels = require("../Models/userModels");
const categoryModel = require("../Models/categoryModel");
const forgotPasswordTokensModel = require("../Models/forgotPasswordModel");
const productModel = require("../Models/productModel");
const orderModel = require("../Models/orderModel");

const awaitingOtpStatus = "awaiting_otp";
const loggedStats = "logged";
const associate = "admin";

const twoPFiveSeconds = 2.5 * 60; // seconds
const threeDaysSeconds = 3 * 24 * 60 * 60;

// creates a jwt and
// the parameters are the user details, max age of the token, status(state of user), and id of user
// returns the created token,
function createToken(userDetails, maxAge, status, id) {
  const obj = {
    userDetails,
    status,
    id,
  };
  return jwt.sign(obj, process.env.JWT_ADMIN_KEY, {
    expiresIn: maxAge,
  });
}

// handles admin login post request, checks user credentials and redirect to home if valid.
exports.post_adminLogin = async function (req, res) {
  const { credentials, password } = req.body;
  try {
    if (!credentials.email || !password)
      throw new Error("Provide proper details");
    const user = await adminModel.login(credentials, password);
    // set jwt token
    const { id, response } = await setOtpHelper({ userDetails: user });
    response.then((d) => {
      const token = createToken(user, threeDaysSeconds, awaitingOtpStatus, id);
      res.cookie("aDAO", token);
      res.send({ isSuccess: true });
    });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// render user home page
exports.get_adminHome = async function (req, res) {
  res.render("adminViews/adminDashboard");
};

// render admin login page
exports.get_adminLogin = async function (req, res) {
  // the same login page is used for both admin and normal user
  // so the page variable specifies that it is a login page and the associate specifies that it is admin
  res.render("authViews/signup-login", { page: "login", associate: "admin" });
};

// render otp page
exports.get_otpAuth = async function (req, res) {
  const superSet = req.query.superSet;
  res.render("authViews/signup-login", {
    page: "otpAuth",
    associate: "admin",
    superSet,
  });
};

// sends otp to the email and sends a sucess message
// and also set the jwt token
exports.get_otp = async function (req, res) {
  const { adminDetails } = req;
  try {
    const { id, response } = await setOtpHelper(adminDetails);
    response.then((d) => {
      const jwtToken = createToken(
        adminDetails.userDetails,
        twoPFiveSeconds,
        awaitingOtpStatus,
        id
      );
      res.cookie("aDAO", jwtToken, {
        maxAge: twoPFiveSeconds * 1000,
        httpOnly: true,
      });
      res.send({ isSuccess: true });
    });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// create otp and save that in the collection
// sends the otp to the user
async function setOtpHelper(adminDetails) {
  const { id, otp } = await createOtpDocument(
    adminDetails.userDetails.email,
    "admin"
  );
  const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
  return {
    id,
    response: sendResponseMail(
      message,
      otp,
      adminDetails.userDetails.email,
      adminDetails.userDetails.name
    ),
  };
}

// varify user otp and update cookie
exports.post_verifyOtp = async function (req, res) {
  const { otp } = req.body;
  try {
    const result = req.adminDetails;
    const otpDoc = await otpModel.findDoc(result.id, otp);
    const jwtToken = createToken(
      result.userDetails,
      threeDaysSeconds,
      loggedStats
    );
    res.cookie("aDAO", jwtToken, {
      maxAge: threeDaysSeconds * 1000,
      httpOnly: true,
    });
    res.send({ isSuccess: true });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// USER RELATED CONTROLLERS

// return user list (pagination) along with the total number of users
exports.get_users = async function (req, res) {
  try {
    const pageNumber = req.query.pno;
    const { users, totalUserCount } = await userModels.getAllUsers(pageNumber);
    if (users) {
      res.send({ isSuccess: 1, data: users, totalCount: totalUserCount });
    } else throw new Error("Something went wrong");
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// return complete user details (address etc) to show in the user details modal
exports.get_complete_userDetails = async function (req, res, next) {
  try {
    const id = req.params.id;
    const user = await userModels.complete_userDetails(id);
    res.send({ isSuccess: true, user });
  } catch (error) {
    next(error);
  }
};

// blocks the spcified user.
exports.patch_blockUser = async function (req, res) {
  try {
    if (!req.body.userId)
      throw new Error("Please provide necessary information: ID");
    const status = await userModels.blockUser(req.body.userId);
    if (status) {
      res.send({ isSuccess: true, ...status });
    } else {
      throw new Error("Something went wrong, operation abandoned.");
    }
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// fetch the user with name matches the search key and returs it (pagination)
exports.get_user_serach_result = async function (req, res, next) {
  try {
    const searchKey = req.query.searchKey;
    const page = req.query.pno;
    if (!searchKey) throw new Error("Please provide necessary informations");
    const { user, totalCount } = await userModels.get_search_result(
      searchKey,
      page
    );
    res.send({ isSuccess: true, data: user, totalCount });
  } catch (error) {
    next(error);
  }
};

// CATEGORY RELATED CONTROLLERS
// return category list (pagination)
exports.get_categories = async function (req, res) {
  try {
    const pageNumber = req.query.pno;
    const { categories, totalCount } = await categoryModel.get_categories(
      pageNumber
    );
    res.send({ isSuccess: true, data: [...categories], totalCount });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// return name of all the categories
exports.get_all_categories = async function (req, res) {
  try {
    const categories = await categoryModel.find({}, { category: 1 });
    res.send({ isSuccess: true, data: categories });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

exports.post_createCategory = async function (req, res) {
  const { category, description, parentCategory, offer } = req.body;
  try {
    if (!category || !description)
      throw new Error("Please provide necessary information");
    if (offer && (offer > 100 || offer < 0))
      throw new Error("Please enter a valid offer");
    const createdCategory = await categoryModel.create({
      category,
      description,
      parentCategory,
      offer,
    });
    res.send({ isSuccess: true, createdCategory });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

exports.delete_category = async function (req, res) {
  // delete it from it's subcategories
  const { id } = req.body;
  try {
    if (!id) throw new Error("Please provide necessary information");
    await categoryModel.delete_category(id);
    res.send({ isSuccess: true });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// update category
exports.patch_updateRequest = async function (req, res) {
  const id = req.params.id;
  const fieldsToUpdate = req.body.diff;

  try {
    if (!id) throw new Error("Please provide necessary information");
    const category = await categoryModel.update_category(id, fieldsToUpdate);
    res.send({ isSuccess: true, category });
  } catch (error) {
    res.send({ isSuccess: false, errorMessage: error.message });
  }
};

// return the category which matchs the search key
exports.get_category_serach_result = async function (req, res, next) {
  try {
    const searchKey = req.query.searchKey;
    const page = req.query.pno;
    if (!searchKey) throw new Error("Please provide necessary informations");
    const { user, totalCount } = await categoryModel.get_search_result(
      searchKey,
      page
    );
    res.send({ isSuccess: true, data: user, totalCount });
  } catch (error) {
    next(error);
  }
};

// forgot password and reset password
// render forgot password page where user can enter email
exports.get_forgotPassword = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.render("authViews/signup-login", { page: "forgot-password", associate });
};

// validate the email user provided (checks whether the email exists) sends a reset password link to user email
exports.post_forgotPassword = async (req, res, next) => {
  try {
    const { credentail } = req.body;
    const userName = await adminModel.isValidCredentail(credentail.email);
    const newToken = await forgotPasswordTokensModel.create_new_token(
      credentail.email
    );
    const link = "http://nandhu.shop/admin/reset_password/" + newToken.key;
    sendPasswordResetMail(userName, link, credentail.email);
    res.send({ isSuccess: true });
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

// updates password and sets authentication token, then redirect to admin home
exports.post_resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const key = req.params.key;
    const credentail = await forgotPasswordTokensModel.validate_key(key);
    const user = await adminModel.update_password(credentail, newPassword);
    await forgotPasswordTokensModel.expire_token(credentail);
    const jwtToken = createToken(user, threeDaysSeconds, "logged");
    res.cookie("aDAO", jwtToken, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    res.send({ isSuccess: true });
  } catch (error) {
    next(error);
  }
};

// returns information required to populate dashboard
exports.get_dashboard_details = async function (req, res, next) {
  try {
    const productCount = await productModel.countDocuments();
    const userCount = await userModels.countDocuments();
    const orderCount = await orderModel.countDocuments();

    const order = await orderModel.aggregate([
      {
        $match: {
          status: {
            $nin: [
              "Canceled",
              "Return Request Processing",
              "Return Request Granted",
              "Return Completed",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevinue: { $sum: "$payable" },
        },
      },
    ]);
    res.send({
      isSuccess: true,
      productCount,
      userCount,
      orderCount,
      totalRevinue: order[0].totalRevinue,
    });
  } catch (error) {
    next(error);
  }
};

// return admin dashboard chart data
exports.get_dashboard_monothy = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year);
    let groupQuery, startingDate, endingDate;
    if (!req.query.month) {
      startingDate = new Date(year, 0, 1);
      endingDate = new Date(year, 11, 31);
      groupQuery = {
        $group: {
          _id: { $month: "$orderCreateAt" },
          orderCount: { $sum: 1 },
        },
      };
    } else {
      const monthsWithDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let month = parseInt(req.query.month) - 1;
      let lastDate;
      if (year % 4 == 0 && month + 1 == 2) {
        lastDate = 29;
      } else {
        lastDate = monthsWithDays[month];
      }
      startingDate = new Date(year, month, 1);
      endingDate = new Date(year, month, lastDate);

      groupQuery = {
        $group: {
          _id: { $dayOfMonth: "$orderCreateAt" }, // Group by day of the month
          orderCount: { $sum: 1 }, // Count orders on each day
        },
      };
    }

    const order = await orderModel.aggregate([
      {
        $match: {
          orderCreateAt: {
            $gte: startingDate, // Start of the specified month
            $lt: endingDate, // Start of the next month
          },
        },
      },
      groupQuery,
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    res.send({ isSuccess: 1, order });
  } catch (error) {
    next(error);
  }
};

exports.get_report_data = async (req, res, next) => {
  try {
    let { month, year = 2023 } = req.query;
    console.log(month, year);

    let startingDate, endingDate;
    if (!req.query.month) {
      startingDate = new Date(year, 0, 1);
      endingDate = new Date(year, 11, 31);
    } else {
      month -= 1;
      const monthsWithDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let lastDate;
      if (year % 4 == 0 && month + 1 == 2) {
        lastDate = 29;
      } else {
        lastDate = monthsWithDays[month];
      }
      startingDate = new Date(year, month, 1);
      endingDate = new Date(year, month, lastDate);
    }
    console.log(startingDate, endingDate);
    const order = await orderModel.aggregate([
      {
        $match: {
          orderCreateAt: {
            $gte: startingDate, // Start of the specified month
            $lt: endingDate, // Start of the next month
          },
        },
      },
      {
        $sort: {
          orderCreateAt: 1,
        },
      },
      {
        $project: {
          coupon: 1,
          payable: 1,
          discount: 1,
          totalPrice: 1,
          products: 1,
        },
      },
    ]);

    console.log(order.length);
    res.send({ isSuccess: 1, data: order });
  } catch (error) {}
};
