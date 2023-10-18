const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");

const userControllers = require("../controllers/userControllers");
const {
  isNotLogged,
  isRegestered,
  isLogged,
  parser,
} = require("../Middleware/userAutherization");
const {
  get_product_details,
  get_serach_result,
  get_product_searchPage,
  post_filtered_result,
} = require("../controllers/productControllers");
const { errorHandler } = require("../Middleware/errorHandler");
const highlightControllers = require("../controllers/highlightControllers");

router.get("/", userControllers.get_home);

router
  .route("/signin")
  .all(isNotLogged)
  .get(userControllers.get_signup)
  .post(userControllers.post_signin);
router
  .route("/login")
  .all(isNotLogged)
  .get(userControllers.get_login)
  .post(userControllers.post_login);
router.get("/logout", isLogged, userControllers.get_logout);

router.route("/otp-Auth").get(isRegestered, userControllers.get_otpAuthPage);
router.route("/request-otp").get(isRegestered, userControllers.get_otp);
router.post("/verify-otp", isRegestered, userControllers.post_verifyOtp);

router.get("/get_product_search_page/:searchKey", get_product_searchPage);
router.get("/product_details/:id", parser, get_product_details);
router.get("/get_search_result", get_serach_result);

router.post("/fetch_filtered_result", post_filtered_result);

// user settings
router.get("/settings", isLogged, userControllers.get_settings);
router.post("/add_address", isLogged, userControllers.post_addAddress);
router.get("/get_allAddress", isLogged, userControllers.get_allAddress);
router.delete("/delete_address/:id", isLogged, userControllers.delete_address);
router.patch("/edit_address/:id", isLogged, userControllers.patch_address);

router.patch("/update_name", isLogged, userControllers.patch_updateName);
router.patch(
  "/change_password",
  isLogged,
  userControllers.patch_changePassword
);

// forgot password
router
  .route("/forgot_password")
  .get(isNotLogged, userControllers.get_forgotPassword)
  .post(isNotLogged, userControllers.post_forgotPassword);

router
  .route("/reset_password/:key")
  .get(isNotLogged, userControllers.get_resetPassword)
  .patch(isNotLogged, userControllers.post_resetPassword);

// highlights
router.get("/highlights/get_top_section", highlightControllers.firstHighlight);
router.get("/highlights/get_highlights", highlightControllers.get_hightlights);

// wishList
router.get(
  "/wishlist/add_to_wishList",
  isLogged,
  userControllers.post_addToWishList
);
router.delete(
  "/wishlist/remove_from_wishList",
  isLogged,
  userControllers.post_removeFromWishList
);
router.get("/wish_list", isLogged, userControllers.get_wishList);

// wallet management
router.get("/wallet", isLogged, userControllers.get_wallet);
router.get("/wallet/find_user", isLogged, userControllers.get_userWallet);
router.get(
  "/wallet/get_tansaction_history",
  isLogged,
  userControllers.get_transactionHistory
);
router.get("/wallet/get_balance", isLogged, userControllers.get_wallet_balance);
router.post(
  "/wallet/create_payment_order",
  isLogged,
  userControllers.create_paymentOrder
);
router.post("/wallet/verify_payment", isLogged, userControllers.verify_payment);
router.post("/wallet/send-to-user", isLogged, userControllers.post_sentToUser);

// referals
router.get("/get_user_referals", isLogged, userControllers.get_referals);

router.use(errorHandler);

module.exports = router;
