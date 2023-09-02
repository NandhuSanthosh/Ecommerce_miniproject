const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    category: {
        type: String, 
        required: true,
    }, 
    description: {
        type: String, 
        required: true
    }, 
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories'
    }, 
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'categories'
    }]
})

categorySchema.statics.get_categories = async function(p=0){
    const docPerPage = 10;
    const categories = await this.aggregate([{
        $lookup: {
            from: "categories", 
            localField: "parentCategory", 
            foreignField: "_id", 
            as: "parentCategoryDetails"
        }
    },{
        $lookup: {
            from: "categories", 
            localField: "subCategories", 
            foreignField: "_id", 
            as: "subCategoryDetails"
        }
    }, {
        $project: {
            subCategories: 0, 
            parentCategory: 0,
        }
    }]).skip(p * docPerPage).limit(docPerPage);

    const totalCount = await this.countDocuments()

    return {categories, totalCount};
}

categorySchema.statics.delete_category = async function(id){
    const categoryToDelete = await this.findOne({_id: id});
    if(categoryToDelete.parentCategory){
        parentUpdateResult = await this.updateOne({_id: categoryToDelete.parentCategory}, {$pull: {subCategories: id}})
        if(!parentUpdateResult.acknowledged){
            throw new Error("Parent Updation failed, document not deleted");
        }
    }

    if(categoryToDelete.subCategories.length >= 1){
        const subCategoriesUpdateResult = await this.updateMany({_id: {$in: [...categoryToDelete.subCategories]}}, {$unset: {parentCategory: ""}})
        if(!subCategoriesUpdateResult.acknowledged){
            throw new Error("Sub Category update failed: document not deleted");
        }
    }

    const result = await this.deleteOne({_id: id})
    if(!result.deletedCount){
        throw new Error("No document deleted, no such document")
    }
    
}

categorySchema.statics.update_category = async function(id, fieldsToUpdate){
    const category = await this.findByIdAndUpdate(id,{ $set: fieldsToUpdate },{ new: true })
    console.log(category);
    return category
}

categorySchema.pre('save', async function (next){
    const category = await this.constructor.findOne({category: this.category})
    if(category) throw new Error("There is already a category with the same name");

    // update in teh parent category field
    if(this.parentCategory){
        console.log(this.parentCategory);
        const parentCategory = await this.constructor.updateOne({_id: this.parentCategory}, {$push: {subCategories: this._id}})
        console.log(parentCategory);
    }
})

module.exports = mongoose.model("categories", categorySchema);