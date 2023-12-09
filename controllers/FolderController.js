const jwt = require("jsonwebtoken");
const path = require("path")
const UserController = require("../controllers/UserController");
const { Folder, Subfolder } = require("../model/folders");
const { User } = require("../model/user");
const utils = require("../utils")


exports.CreateFolder = async (req, res) => {
    const { FolderParentPath, NewFolderName } = req.body;

    if (!(FolderParentPath && NewFolderName)) {
        return res.status(400).json({success: false, message: "All Field Inputs Are Required"});
    }

    const token = req.cookies.access_token;

    if(!UserController.isLoggedInF(token))
    {
        return res.status(401).json({ success: false, message: "User Unauthenticated" })
    }  
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);

        const user = await User.findById(decoded.userId)

        const isMainFolder = user.username === FolderParentPath.slice(1);
        const ParentPath = utils.pathNormalize(path.join(FolderParentPath, NewFolderName))
        const NormalizedParentPath = utils.pathNormalize(FolderParentPath)
        
        if(isMainFolder)
        {
            const folder = await Folder.findOne({name: user.username});
            const subfolder = await Subfolder.create({
                name: NewFolderName,
                files: [],
                path: ParentPath,
                owner: user._id
            });
            await folder.updateOne({subfolders: [subfolder]})

            return res.status(201).json({ success: true, message: "Folder Created Successfully" })
        }

        const existingFolder = await Subfolder.findOne({
            owner: user._id,
            path: ParentPath,
        });
      
        if (existingFolder) {
            return res.status(409).json({
              success: true,
              message: "Can't Create Dublicate Folders In the Same Folder",
            });
        }

        const levelCheck = await Subfolder.findOne({owner: user._id, path: NormalizedParentPath})
        if(!levelCheck)
        {
            return res.status(409).json({ success: true, message: "Folder Must Be Created Under An Existing Folder" })
        }

        if(!FolderParentPath.includes(user.username))
        {
            return res.status(401).json({ success: true, message: "Folders Must Be Created Under Your Own Ownership Only!" })
        }

        const subfolder = await Subfolder.create({
            name: NewFolderName,
            files: [],
            path: ParentPath,
            owner: user._id
        });

        await levelCheck.updateOne({ $push: { subfolders: subfolder } })

        return res.status(201).json({ success: true, message: "Folder Created Successfully" })

    } catch(brr) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
          });
    }
}