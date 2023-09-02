const productModel = require("../Models/productModel")
const errorHandler = require('../Middleware/errorHandler');
const {upload_single_image, upload_multiple_image} = require("../Middleware/uploadImages")


exports.get_products = async function(req, res, next){
    try {
        const pageCount = req.query.pno || 0
        const products = await productModel.get_products(pageCount);
        console.log(products.length)
        res.send({isSuccess: true, data: products});
    } catch (error) {
        next(error);
    }
}
exports.post_product = async function(req, res, next){
    let {productDetails} = req.body
    productDetails = JSON.parse(productDetails)
    try {
        const result = await upload_multiple_image(req.files)
        console.log(result);
        const image = getImagesArray(result);
        productDetails.images = image
        const newProduct = await productModel.create_product(productDetails);
        res.send({isSuccess: true, newProduct})
    } catch (error) {
        next(error);
    }
}

function getImagesArray(result){
    return result.map( imageDetails => {
        return imageDetails.secure_url;
    })
}

exports.delete_product = async function(req, res, next){
    const id = req.params.id;
    try {
        const deletedProduct = await productModel.delete_product(id);
        res.send({isSuccess: true, data: deletedProduct});
    } catch (error) {
        next(error);
    }
}

exports.delete_image = async function(req, res, next){
    const id = req.params.id
    const {src} = req.body
    console.log(src);
    try {
        await productModel.delete_image(id, src);
        res.send({isSuccess: true})
    } catch (error) {
        next(error);
    }
}

exports.patch_updateProduct = async function(req, res, next){
    const {id, updateObject} = req.body;
    try {
        const updatedObject = await productModel.update_product(id, updateObject);
        res.send({isSuccess: true, data: updatedObject});
    } catch (error) {
        next(error);
    }
}

exports.patch_addImage = async function(req, res, next){
    try {
        const id = req.params.id;
        const {secure_url} = await upload_single_image(req.file, req.body.id);
        
        // update in db
        const result = await productModel.add_image(id, secure_url);
        res.send({isSuccess: true, data: secure_url});

    } catch (error) {
        next(error);   
    }
}



// user side
exports.get_product_details = async function(req, res, next){
    const id = req.params.id
    try {
        if(!id) throw new Error("Please provide all the necessary details");
        console.log('here');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const product = await productModel.get_single_product_details(id);
        res.render('./authViews/userHome.ejs', {page: 'product-details', product})
    } catch (error) {
        next(error)
    }
}

exports.get_product_searchPage = async function(req, res, next){
    res.render('./authViews/userHome.ejs', {page: 'search-page'})
}

exports.get_serach_result = async function(req, res, next){
    try {
        const searchKey = req.query.searchKey;
        const page = req.query.p;
        if(!searchKey) throw new Error("Please provide necessary informations")
        const products = await productModel.get_search_result(searchKey, page)
        res.send(products);
    } catch (error) {
        next(error)
    }
}

