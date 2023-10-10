require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const utilityRoutes = require("./routes/utilityRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { errorHandler } = require("./Middleware/errorHandler");

app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static("./public"));

app.use("/", userRoutes);
app.use("/", cartRoutes);
app.use("/order", orderRoutes);
app.use("/admin", adminRoutes);
app.use("/admin/orders", adminOrderRoutes);
app.use("/payment", paymentRoutes);
app.use("/utility", utilityRoutes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URL)
  .then((d) => console.log("Database connection established"))
  .catch((e) =>
    console.log("Couldn't establish database connection: something went wrong")
  );

app.listen(process.env.PORT || process.env.PORT_NUMBER, "0.0.0.0", () => {
  console.log("Server is up on port : ", process.env.PORT || process.env.PORT_NUMBER);
});
