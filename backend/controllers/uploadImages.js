// import fs from 'fs'
// import path from 'path'

// import Resume from '../models/resumeModel.js'
// import upload from '../middleware/uploadMiddleware.js'
// import { error } from 'console'

// export const uploadResumeImages = async (req,res) =>{
//     try {
//         // CONFIGURE MULTER TO HANDLE IMAGES
//         upload.fields([{name: "thumbnail"}, {name: "profileImage"}])
//         (req,res,async (err) =>{
//             if (err) {
//                 return res.status(400).json({message: "File upload failed", error: err.message})
//             }

//             const resumeId = req.params.id;
//             const resume = await Resume.findOne({_id: resumeId, userId: req.user._id})

//             if (!resume) {
//                 return res.status(404).json({message: "Resume not found or unauthorized"})
//             }

//             // USE PROCESS CWD TO LOCATE UPLOADS FOLDER
//             const uploadsFolder = path.join(process.cwd(), "uploads")
//             const baseUrl = `${req.protocol}://${req.get("host")}`;

//             const newThumbnail = req.files.thumbnail?.[0];
//             const newProfileImage = req.files.profileImage?.[0];

//             if (newThumbnail) {
//                 if(resume.thumbnailLink){
//                     const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink))
//                     if(fs.existsSync)(oldThumbnail)
//                         fs.unlinkSync(oldThumbnail)
//                 }
//                 resume.thumbnailLink = `${baseUrl}/uploads/${newThumbnail.filename}`

//             }


//             // Same for profilePreview image
//             if (newProfileImage) {
//                 if(resume.profileInfo?.profilePreviewUrl){
//                     const oldProfile = path.join(uploadsFolder, path.basename(resume.profileInfo.profilePreviewUrl))
//                     if(fs.existsSync(oldProfile))
//                         fs.unlinkSync(oldProfile)
//                 }
//                 resume.profileInfo.profilePreviewUrl = `${baseUrl}/uploads/${newProfileImage.filename}`
//             }

//             await resume.save();
//             res.status(200).json({
//                 message: "Image uploaded Successfully",
//                 thumbnailLink: resume.thumbnailLink,
//                 profilePreviewUrl: resume.profileInfo.profilePreviewUrl
//             })
//         })
//     } 
    
//     catch (err) {
//         console.error('Error uploading image: ', err)
//         message: "failed to upload images"
//         error: err.message
//     }
// }

import fs from 'fs'
import path from 'path'
import Resume from '../models/resumeModel.js'
// import upload from '../middleware/uploadMiddleware.js' // <--- REMOVED: Multer is now in the route
// import { error } from 'console' // Removed unused import

// NOTE: Since Multer is running in the route, the file is available in req.file.
export const uploadResumeImages = async (req,res) =>{
    // *** Multer has already run successfully before this code executes ***

    try {
        const resumeId = req.params.id;
        
        // Safety check for user ID (from protect middleware)
        if (!req.user || !req.user._id) {
             return res.status(401).json({message: "Unauthorized"})
        }

        const resume = await Resume.findOne({_id: resumeId, userId: req.user._id})

        if (!resume) {
            return res.status(404).json({message: "Resume not found or unauthorized"})
        }

        // Use req.file for single file upload
        const newThumbnail = req.file; // <--- CRITICAL FIX: Accessing req.file
        // We assume newProfileImage logic is now handled elsewhere 
        // as the client only sends 'thumbnail'.
        // const newProfileImage = null; 

        // USE PROCESS CWD TO LOCATE UPLOADS FOLDER
        const uploadsFolder = path.join(process.cwd(), "uploads")
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        
        // Process Thumbnail
        if (newThumbnail) {
            if(resume.thumbnailLink){
                const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink))
                // Cleaned up fs.existsSync check
                if(fs.existsSync(oldThumbnail)) { 
                    fs.unlinkSync(oldThumbnail)
                }
            }
            // Access filename from req.file
            resume.thumbnailLink = `${baseUrl}/uploads/${newThumbnail.filename}`
        }


        // NOTE: The original code handled profileImage here. 
        // If profileImage is still required, you must modify the client to send it, 
        // and change the route back to upload.fields. 
        // For now, it is removed to fix the 400 error.

        // if (newProfileImage) {
        //     // ... profile image update logic ...
        // }

        await resume.save();
        res.status(200).json({
            message: "Image uploaded Successfully",
            thumbnailLink: resume.thumbnailLink,
            profilePreviewUrl: resume.profileInfo.profilePreviewUrl // Assumes this is updated elsewhere or not needed
        })
    } 
    
    catch (err) {
        console.error('Error uploading image: ', err)
        // Ensure you return a 500 status on internal error
        res.status(500).json({
            message: "Failed to upload images",
            error: err.message
        })
    }
}