const { usersModel } = require("../models")
const { ErrorHandler } = require("../helpers")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const bcrypt = require("bcrypt")
var CryptoJS = require("crypto-js")

module.exports = {
    register: catchAsyncErrors(async (req, res, next) =>{
        try {
            const { email, password, role, info } = req.body
            const resultRow = await usersModel.findOne({ email })
            if(resultRow){ return next(new ErrorHandler( false, req.__("%s already exists", "Email"), 200 )); }
            const token = await bcrypt.hash(email, 10)
            const passwordNew = CryptoJS.SHA256(password + token)
            const newRow = new usersModel({ email, password: passwordNew, info: info || {}, role: role || 'Administrator', token })

            await newRow.save();
            return res.status(200).json({ success: true, message: req.__("Register successfully"),data:newRow })
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    update: catchAsyncErrors(async (req, res, next)=>{
        try {
            const userId = req.params.id
            const resultRow = await usersModel.findOne({
                '_id': userId,
                'actived.check': 1,
                'locked.check': 0
            });
            if(!resultRow){ return next(new ErrorHandler(false, req.__("User does not exist or inactive."), 200)); }
            var paramsInfo = {}
            paramsInfo = req.body
            let updateRow = await usersModel.findOneAndUpdate(
                { '_id': userId }, paramsInfo, { new: true }
            )
            if (!updateRow){ return next(new ErrorHandler(false, req.__("Update profile error."), 200)); }
            const rowDAdmin = await usersModel.findOne({
                '_id': userId,
                'actived.check': 1,
                'locked.check': 0
            }, "-__v");
            return res.status(200).json({ success: true, message: req.__("Profile updated"), data: rowDAdmin })
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    trash: catchAsyncErrors( async (req, res, next)=>{
        try {
            const userId = req.params.id
            const checkRow = await usersModel.findOne({"_id": userId});
            if(!checkRow) return next(new ErrorHandler(false, req.__("This admin does not exist"), 200));
            const paramsInfo = {
                'trash.check': 1,
                'trash.message': "The data has been put in the trash"
            }
            let updateRow = await usersModel.findOneAndUpdate(
                { '_id': userId }, paramsInfo, { new: true }
            )
            if (!updateRow){
                return next(new ErrorHandler(false, req.__("Data update failed."), 200));
            }
            return res.status(200).json({ success: true, message: req.__("Admin [%s] has put it in the trash", memberId ) })
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500)); 
        }
    }),
}