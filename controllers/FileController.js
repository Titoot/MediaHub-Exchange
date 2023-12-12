const UserController = require("../controllers/UserController");
const { File, Folder, Subfolder } = require("../model/folders");
const mongoose = require('mongoose');
const { User } = require("../model/user");
const Type = require("../model/type");
const jwt = require("jsonwebtoken");
const utils = require("../utils")
const path = require("path")

exports.CreateFile = async (req, res) => {
    const { FileParentPath, NewFileName, FileType, size } = req.body;

    if (!(FileParentPath && NewFileName && FileType)) {
        return res.status(400).json({success: false, message: "All Field Inputs Are Required"});
    }
    const FileTypes = ['Game', 'Movie', 'Series', 'Anime']

    if(!FileTypes.includes(FileType))
    {
        return res.status(400).json({success: false, message: "Please Select a Valid File Type"});
    }

    const token = req.cookies.access_token;
    const isLoggedIn = await UserController.isLoggedInF(token)
    if(!isLoggedIn)
    {
        return res.status(401).json({ success: false, message: "User Unauthenticated" })
    }  
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        const user = await User.findById(decoded.userId)

        const isMainFile = user.username === FileParentPath.slice(1);
        const ParentPath = utils.pathNormalize(path.join(FileParentPath, NewFileName))
        const NormalizedParentPath = utils.pathNormalize(FileParentPath)

        const existingFile = await File.findOne({
            owner: user._id,
            path: ParentPath,
        });
      
        if (existingFile) {
            return res.status(409).json({
              success: false,
              message: "Can't Create a Duplicate File In the Same Folder",
            });
        }
        let  contentDetails;
        switch (FileType) {
            case 'Game':
              contentDetails = await Type.Game.create({});
              break;
            case 'Movie':
              contentDetails = await Type.Movie.create({});
              break;    

            default:
              throw new Error('Invalid FileType');
          }
        
        if(isMainFile)
        {
            const folder = await Folder.findOne({name: user.username});
            const file = await File.create({
                name: NewFileName,
                path: ParentPath,
                owner: user._id,
                size: size || '-',
                typeModel: FileType,
                contentDetails: contentDetails
            });
            await folder.updateOne({ $push: { files: file } })

            return res.status(201).json({ success: true, message: "File Created Successfully" })
        }

        const levelCheck = await Subfolder.findOne({owner: user._id, path: NormalizedParentPath})
        if(!levelCheck)
        {
            return res.status(409).json({ success: false, message: "File Must Be Created Under An Existing Folder" })
        }

        if(!FileParentPath.includes(user.username))
        {
            return res.status(401).json({ success: false, message: "Files Must Be Created Under Your Own Ownership Only!" })
        }

        const file = await File.create({
            name: NewFileName,
            path: ParentPath,
            owner: user._id,
            size: size ? size : '-',
            typeModel: FileType,
            contentDetails: contentDetails
        });

        await levelCheck.updateOne({ $push: { files: file } })

        return res.status(201).json({ success: true, message: "File Created Successfully" })

    } catch(brr) {
        console.error(brr)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
    }
}

exports.DeleteFile = async (req, res) => {
    const { FileId } = req.body;

    if (!(FileId)) {
        return res.status(400).json({success: false, message: "All Field Inputs Are Required"});
    }

    const token = req.cookies.access_token;
    const isLoggedIn = await UserController.isLoggedInF(token)
    if(!isLoggedIn)
    {
        return res.status(401).json({ success: false, message: "User Unauthenticated" })
    }

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    const user = await User.findById(decoded.userId)

    const fileToDelete = await File.findOne({_id: new mongoose.Types.ObjectId(FileId), owner: user._id });

    const contentToDelete = await Type.Game.deleteOne({_id: fileToDelete.contentDetails});
    
    const deletedfile = await Subfolder.updateOne({ files: { $in: fileToDelete._id } },{ $pull: { files: fileToDelete._id } });

    const mainFolder = await Folder.findById(user.OwnedFolder)

    const folder = await mainFolder.updateOne({ $pull: { files: fileToDelete._id } });

    await fileToDelete.deleteOne()

    return res.status(200).json({ success: true, message: "File Deleted Sucessfully" })
}