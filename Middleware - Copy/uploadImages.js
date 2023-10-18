const cloudinary = require("cloudinary").v2

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});

exports.upload_single_image = async function(file){
    let publicId = Date.now();
    const result = await cloudinary.uploader.upload(file.path, { public_id: publicId})
    return result;
}

exports.upload_multiple_image = async function(files){
  console.log(files);
  console.log(typeof files)
    const cloudinaryPromiseArray = files.map(async x => {
      let publicId = Date.now();
      return await cloudinary.uploader.upload(x.path, {public_id: publicId})
    })

    const result = await Promise.all(cloudinaryPromiseArray);
    return result;

    // return cloudinaryPromiseArray;
}