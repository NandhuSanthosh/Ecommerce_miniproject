const productModel = require("../Models/productModel");
const errorHandler = require("../Middleware/errorHandler");
const {
  upload_single_image,
  upload_multiple_image,
} = require("../Middleware/uploadImages");
const userModels = require("../Models/userModels");

// returns product list (pagination)
exports.get_products = async function (req, res, next) {
  try {
    const pageCount = req.query.pno || 0;
    const { products, totalProducts } = await productModel.get_products(
      pageCount
    );
    res.send({ isSuccess: true, data: products, totalCount: totalProducts });
  } catch (error) {
    next(error);
  }
};

// create product
exports.post_product = async function (req, res, next) {
  let { productDetails } = req.body;
  productDetails = JSON.parse(productDetails);
  try {
    const result = await upload_multiple_image(req.files);
    const image = getImagesArray(result);
    productDetails.images = image;
    const newProduct = await productModel.create_product(productDetails);
    res.send({ isSuccess: true, newProduct });
  } catch (error) {
    next(error);
  }
};

// return the array of urls of product images when creating a order
function getImagesArray(result) {
  return result.map((imageDetails) => {
    return imageDetails.secure_url;
  });
}

// soft deletes product
exports.delete_product = async function (req, res, next) {
  const id = req.params.id;
  try {
    const deletedProduct = await productModel.delete_product(id);
    res.send({ isSuccess: true, data: deletedProduct });
  } catch (error) {
    next(error);
  }
};

// delete product image
exports.delete_image = async function (req, res, next) {
  const id = req.params.id;
  const { src } = req.body;
  try {
    await productModel.delete_image(id, src);
    res.send({ isSuccess: true });
  } catch (error) {
    next(error);
  }
};

exports.patch_updateProduct = async function (req, res, next) {
  const { id, updateObject } = req.body;
  try {
    const updatedObject = await productModel.update_product(id, updateObject);
    res.send({ isSuccess: true, data: updatedObject });
  } catch (error) {
    next(error);
  }
};

// handles adding images to product details
exports.patch_addImage = async function (req, res, next) {
  try {
    const id = req.params.id;
    const { secure_url } = await upload_single_image(req.file, req.body.id);
    // update in db
    const result = await productModel.add_image(id, secure_url);
    res.send({ isSuccess: true, data: secure_url });
  } catch (error) {
    next(error);
  }
};

// user side

// return all the details of a product, for product page
// and also checks whether the product is in the user wishlist and returns the data
exports.get_product_details = async function (req, res, next) {
  const id = req.params.id;
  try {
    if (!id) throw new Error("Please provide all the necessary details");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    const product = await productModel.get_single_product_details(id);
    const userId = req.userDetails?.userDetails._id;
    let isInWishList = false;
    if (userId) {
      const userDetails = await userModels.findById(userId);
      isInWishList = userDetails.wishList.includes(product._id);
    }

    res.render("./authViews/userHome.ejs", {
      page: "product-details",
      product,
      isInWishList,
    });
  } catch (error) {
    next(error);
  }
};

// match products based on search key and render the search page
exports.get_product_searchPage = async function (req, res, next) {
  try {
    const searchKey = req.params.searchKey;
    const page = 0;
    if (!searchKey) throw new Error("Please provide necessary informations");
    const { products, totalProducts } = await productModel.get_search_result(
      searchKey,
      page
    );
    // res.send({isSuccess: true,data: products, totalCount : totalProducts});
    res.render("./authViews/userHome.ejs", {
      page: "search-page",
      product: { data: products },
      totalProducts,
      searchKey,
    });
  } catch (error) {
    next(error);
  }
};

// finds the product list based on the search key and returns the data
exports.get_serach_result = async function (req, res, next) {
  try {
    const searchKey = req.query.searchKey;
    const page = req.query.pno;
    if (!searchKey) throw new Error("Please provide necessary informations");
    const { products, totalProducts } = await productModel.get_search_result(
      searchKey,
      page
    );
    res.send({ isSuccess: true, data: products, totalCount: totalProducts });
  } catch (error) {
    next(error);
  }
};

exports.post_filtered_result = async function (req, res, next) {
  try {
    const filters = req.body.filter;
    const searchKey = req.body.searchKey

    // base pipeline
    const pipeline = [{
      $match: {
          isDeleted: false
      }
    },{
      $lookup: {
        from: "categories", 
        localField: "category", 
        foreignField: "_id", 
        as: "category"
      }
    },{
      $match: {
        $or: [
          {name: { $regex: searchKey, $options: 'i' }}, 
          {
            "category.category":{$regex: searchKey, $options: 'i'}
          }
        ]
      }
    }]

    // discount filter stage
    if(filters.discountFilter && !isNaN(filters.discountFilter)){
      pipeline.push({
        $match: {
          $expr: { 
            $gte: [
              {
                $add: [{ $arrayElemAt: ["$category.offer", 0] }, "$discount"]
              }, 
              parseInt( filters.discountFilter)
            ]
          }
        }
      })
    }

    // brand filter stage
    if(filters.brandFilter?.length){
      pipeline.push({
        $match: {
          brand: {
            $in: filters.brandFilter.map(brand => new RegExp(brand, "i"))
          }
        }
      })
    }

    // pay on delivery filter
    if(filters.deliveryFilter){
      pipeline.push({
        $match: {
          isPayOnDelivery: true
        }
      })
    }

    // availability filter
    if(filters.availabilityFilter){
      pipeline.push({
        $match: {
          stock : {
            $gt: 1
          }
        }
      })
    }

    // price filter
    if(filters.priceFilter.starting || filters.priceFilter.ending != Infinity){
      let ending = filters.priceFilter.ending;
      if(ending == "Infinity") ending = Infinity
      console.log(ending)
      pipeline.push({
        $match: {
          currentPrice: {
            $gte : filters.priceFilter.starting, 
            $lte : ending
          }
        }
      })
    }

    const products = await productModel.aggregate(pipeline);
    res.send({ isSuccess: true, products });
  } catch (error) {
    res.send({isSuccess: false, errorMessage: error.message})
  }
};
