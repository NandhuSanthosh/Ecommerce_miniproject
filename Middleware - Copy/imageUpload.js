const cloudinary = require('cloudinary').v2;

import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});

exports.updaloadImage = async function(file){
    const result = await cloudinary.v2.uploader.upload( file)
}