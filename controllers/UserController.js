const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Folder } = require("../model/folders");
const { User } = require("../model/user")

exports.Login = async (req, res) => {
    try{
      const { username, password } = req.body;
  
      if (!(username && password)) {
        return res.status(400).json({success: false, message: "All Field Inputs Are Required"});
      }
  
      const user = await User.findOne({ username });
  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { userId: user._id },
          process.env.TOKEN_KEY,
          {
            expiresIn: "7d",
          }
        );
  
        return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                })
                .status(200)
                .json({ success: true, message: "Logged in successfully 😊 👌" })
      }
      return res.status(400).json({success: false, message: "Invalid Credentials"});
  }catch(err)
  {
    console.log(err);
  }
}

exports.Register = async (req, res) => {
    try {
        // Get user input
        const { username, password } = req.body;
    
        // Validate user input
        if (!(username && password)) {
          return res.status(400).json({success: false, message:"All input is required"});
        }
        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ username });
    
        if (oldUser) {
          return res.status(409).json({success: false, message:"User Already Exist. Please Login"});
        }

        let folder = await Folder.findOne({name: username})

        if(folder)
        {
            return res.status(409).json({success: false, message:"Folder Already Exists."})
        }

        folder = await Folder.create({
            name: username
        });
    
        // Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);
    
        // Create user in our database
        const user = await User.create({
          username: username,
          password: encryptedPassword,
          OwnedFolder: folder._id
        });
    
        // Create token
        const token = jwt.sign(
          { user_id: user._id },
          process.env.TOKEN_KEY,
          {
            expiresIn: "7d",
          }
        );

        return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                })
                .status(200)
                .json({ success: true, message: "Account created successfully 😊 👌" })
      } catch (err) {
        console.log(err);
      }
};

exports.isLoggedIn = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token)
    {
        res.locals.isLoggedIn = false;
        next()
        return
    }

    if(!jwt.verify(token, process.env.TOKEN_KEY))
    {
        res.locals.isLoggedIn = false;
        next()
        return
    }

    res.locals.isLoggedIn = true;
    next()
}

exports.isLoggedInF = (token)  => {
    if (!token)
    {
        return false;
    }

    if(!jwt.verify(token, process.env.TOKEN_KEY))
    {
        return false;
    }

    return true;
}