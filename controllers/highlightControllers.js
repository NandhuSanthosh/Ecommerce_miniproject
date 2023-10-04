const highLightModel = require("../Models/highlightModel");

exports.firstHighlight = async (req, res, next)=>{
    try {
        const highlights = await highLightModel.findOne({position: 1})
        .populate({
            path: "products", 
            populate: {
                path: "category",
                select: 'offer'
            }
        })
        res.send({isSuccess: true, data: highlights})
    } catch (error) {
        next(error)
    }
}

exports.get_hightlights = async (req, res, next)=>{
    try {
        const highlights = await highLightModel.find({position: {$ne : 1}})
        .sort("position")
        .populate({
            path: "products", 
            populate: {
                path: "category",
                select: 'offer'
            }
        })
        res.send({isSuccess: true, data: highlights})
    } catch (error) {
        next(error)
    }
}