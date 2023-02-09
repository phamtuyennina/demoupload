const { librariesModel, usersModel } = require("../models")
const { ErrorHandler, Functions, ApiFeatures } = require("../helpers")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const bcrypt = require("bcrypt")
const pathRoot = require("path")
var CryptoJS = require("crypto-js")
var fs = require("fs");
const md5 = require("md5");
const bodyParser =require("body-parser");
const jwt = require('jsonwebtoken')
const multer = require('multer');
const uuid = require('uuid');
const multiparty = require('multiparty');
const fsExtra = require('fs-extra');

const uploadPath = pathRoot.join(__dirname, '/media/userp'); // Register the upload path
fsExtra.ensureDir(uploadPath);

module.exports = {
    /**
     * Media
     * Method uploadMedia
     * [query: {type, folder}]
     * [body: {files}]
     * */
    uploadChunkTest : catchAsyncErrors(async (req, res, next)=>{
        const {name,size,currentChunkIndex,totalChunks} = req.query;
        const firstChunk = parseInt(currentChunkIndex) === 0;
        const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) -1;
        const ext = name.split('.').pop();
        const data = req.body.toString().split(',')[1];
        const buffer = Buffer.from(data, 'base64');
        const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext;
    
        if (firstChunk && fs.existsSync('./media/'+tmpFilename)) {
            fs.unlinkSync('./media/test/'+tmpFilename);
        }
        fs.appendFileSync('./media/test/'+tmpFilename, buffer);
        var fileOpen = fs.statSync('./media/test/'+tmpFilename);
        //console.log(size);
        console.log(size+'-------------'+fileOpen.size+'---------currentChunkIndex:'+currentChunkIndex);
        if (size==fileOpen.size) {
            const finalFilename = name.split('.')[0] + '.' + ext;
            fs.renameSync('./media/test/'+tmpFilename, './media/test/'+finalFilename);
            console.log('DONE =====================================================');
            return res.status(200).json({finalFilename:finalFilename})
        } else {
            return res.status(200).json({success: true,currentChunkIndex:currentChunkIndex})
        }
    }),
    uploadMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            // console.log(`Here is a test v4 uuid: ${uuid.v4()}`);
            // return false;
            const queryStr = req.query
            let rowFolder = null;

            if(queryStr.folder!=null && queryStr.parentId!=null){
                rowFolder = await folderModel.findOne({ 
                    "$or": [{"name": { $eq: queryStr.folder }}, {"slug": { $eq: queryStr.folder }}], 
                    "_id": queryStr.parentId
                });
                if(!rowFolder){ return next(new ErrorHandler(false, req.__("The selected folder could not be found"), 500)); }
            } else{
                if(queryStr.folder){
                    rowFolder = await folderModel.findOne({ "$or": [{"name": { $eq: queryStr.folder }}, {"slug": { $eq: queryStr.folder }}], "level": { $eq: 1 } });
                    if(!rowFolder){
                        return next(new ErrorHandler(false, req.__("The selected folder could not be found"), 500));
                    }
                }else{
                    if(!queryStr.parentId){
                        return next(new ErrorHandler(false, req.__("Params [%s] cannot be empty","parentId"), 500));
                    }
                    rowFolder = await folderModel.findOne({ "_id": queryStr.parentId });
                    if(!rowFolder){
                        return next(new ErrorHandler(false, req.__("The selected folder could not be found"), 500));
                    }
                }
            }
            
            const path = rowFolder.path;
            const message = req.__('Only media files are allowed %s', '[' + process.env.MINE_TYPE_FILES + ']!')
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null,path)
                },
                filename: async function (req, file, cb) {
                    const resultFilter = await librariesModel.findOne({filename: { $eq: file.originalname } })
                    if(resultFilter){
                        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9)
                        cb(null, filename + '-' +file.originalname)
                    }else{
                        cb(null, file.originalname )
                    }
                }
            })
            var listMediaError = []
            const imageFilter = function (req, file, cb) {
                var ext = pathRoot.extname(file.originalname).slice(1);
                var default_ext = process.env.MINE_TYPE_FILES.split('|');
                if(parseInt(default_ext.indexOf(ext)) == -1){
                    req.fileValidationError = message
                    listMediaError.push(file);
                    cb(null, false)
                }
                cb(null, true);
            };
            let uploadMultipleFiles = multer({ storage: storage, fileFilter: imageFilter }).array('files', process.env.LIMIT_FILES);
            uploadMultipleFiles(req, res ,function(err) {
                var files = req.files, listMedia = []
                files.forEach(async (ele, index) => {
                    var ext = pathRoot.extname(ele.originalname).slice(1);
                    var default_ext = process.env.MINE_TYPE_FILES.split('|');
                    if(parseInt(default_ext.indexOf(ext)) > -1){
                        var mime = ele.mimetype;
                        var ext = mime.split("/");
                        var oip = {
                            "originalname": ele.originalname,
                            "filename": ele.filename,
                            "destination": ele.destination,
                            "size": ele.size,
                            "mimetype": ele.mimetype,
                            "ext": ext[1],
                            "path": ele.path,
                            "folder": queryStr.folder,
                            "parentId": rowFolder._id
                        }
                        listMedia.push(oip);
                        const saveItem = new librariesModel(oip)
                        await saveItem.save()
                    }
                });
                return res.status(200).json({success: true, message: req.__("%s has been added successfully!", "Media"), data: listMedia, error: listMediaError })
            });
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    uploadSingle: catchAsyncErrors( async (req, res, next)=>{
        try {
            const queryStr = req.query
            const checkUser = await usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });

            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }
            if(!queryStr.userId)  { return next(new ErrorHandler(false, req.__("UserId can't be empty"), 200)); }

            var path = './media/' + CryptoJS.MD5(queryStr.userId);
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
            const message = req.__('Only media files are allowed %s', '[' + process.env.MINE_TYPE_VIDEOS + ']!')
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null,path)
                },
                filename: async function (req, file, cb) {
                    const resultFilter = await librariesModel.findOne({filename: { $eq: file.originalname } })
                    if(resultFilter){
                        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9)
                        cb(null, filename + '-' +file.originalname)
                    }else{
                        cb(null, file.originalname )
                    }
                }
            })
            const imageFilter = function (req, file, cb) {
                if(file){
                    //console.log(file, 'yyyyyyy')
                    var ext = pathRoot.extname(file.originalname).slice(1);
                    var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                    if(parseInt(default_ext.indexOf(ext)) == -1){
                        req.fileValidationError = message
                        cb(null, false)
                        return res.status(200).json({
                            success: false,
                            message: message
                        })
                    }
                    cb(null, true);
                }else{
                    cb(null, false)
                    return res.status(200).json({
                        success: false,
                        message: req.__("File does not exists")
                    })
                }
            };
           
            let uploadSingleFiles = multer({ storage: storage, fileFilter: imageFilter }).single('files');
            
            uploadSingleFiles(req, res , async function(err) {
                var listMedia;
                //console.log(req.file  , 'xxxxxxx')
                var ext = pathRoot.extname(req.file.originalname).slice(1);
                var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                if(parseInt(default_ext.indexOf(ext)) > -1){
                    var mime = req.file.mimetype;
                    var ext = mime.split("/");
                    listMedia = {
                        "originalname": req.file.originalname,
                        "filename": req.file.filename,
                        "destination": req.file.destination,
                        "size": req.file.size,
                        "mimetype": req.file.mimetype,
                        "ext": ext[1],
                        "path": req.file.path,
                        "folder": path,
                        "userId": queryStr.userId
                    }
                    const saveItem = new librariesModel(listMedia)
                    await saveItem.save()
                    return res.status(200).json({
                        success: true,
                        mediaId: saveItem._id,
                        path: saveItem.path,
                        size: req.file.size,
                        mimetype: req.file.mimetype
                    })
                }else{
                    return res.status(200).json({
                        success: false,
                        message: message
                    })
                }
            });
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    
    updateMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            const mediaId = req.params.id
            const checkMedia = await librariesModel.findOne({_id: mediaId});
            if(!checkMedia) return next(new ErrorHandler(false, req.__("%s does not exist", "Media file"), 400));

            const queryStr = req.query
            const checkUser = await usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });

            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }
            if(!queryStr.userId)  { return next(new ErrorHandler(false, req.__("UserId can't be empty"), 200)); }

            var path = './media/' + CryptoJS.MD5(queryStr.userId);
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }

            const message = req.__('Only media files are allowed %s', '[' + process.env.MINE_TYPE_VIDEOS + ']!')
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null,path)
                },
                filename: async function (req, file, cb) {
                    const resultFilter = await librariesModel.findOne({filename: { $eq: file.originalname } })
                    if(resultFilter){
                        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9)
                        cb(null, filename + '-' +file.originalname)
                    }else{
                        cb(null, file.originalname )
                    }
                }
            })
            const imageFilter = function (req, file, cb) {
                var ext = pathRoot.extname(file.originalname).slice(1);
                var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                if(parseInt(default_ext.indexOf(ext)) == -1){
                    req.fileValidationError = message
                    cb(null, false)
                    return res.status(200).json({
                        error: true,
                        message: message
                    })
                }
                cb(null, true);
            };
            let uploadSingleFiles = multer({ storage: storage, fileFilter: imageFilter }).single('files');
            uploadSingleFiles(req, res , async function(err) {
                var listMedia;
                var ext = pathRoot.extname(req.file.originalname).slice(1);
                var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                if(parseInt(default_ext.indexOf(ext)) > -1){
                    var mime = req.file.mimetype;
                    var ext = mime.split("/");
                    listMedia = {
                        "originalname": req.file.originalname,
                        "filename": req.file.filename,
                        "destination": req.file.destination,
                        "size": req.file.size,
                        "mimetype": req.file.mimetype,
                        "ext": ext[1],
                        "path": req.file.path
                    }
                    const pathMedia = checkMedia.path;
                    if (fs.existsSync(pathMedia)) {
                        fs.unlink(pathMedia, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }else{
                                console.log('success')
                            }
                        })
                    }

                    let saveItem = await librariesModel.findOneAndUpdate(
                        { '_id': mediaId }, listMedia, { new: true }
                    )
                    
                    return res.status(200).json({
                        success: true,
                        mediaId: saveItem._id,
                        path: saveItem.path,
                        size: req.file.size,
                        mimetype: req.file.mimetype
                    })
                }
            });
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    
    /**
     * Media
     * Method trashMedia
     * [query: {type, folder, mediaId}]
     * */
    trashMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            const mediaId = req.params.id
            const resultMedia = await librariesModel.findOne({ "_id": mediaId });
            if(resultMedia){
                var opt;
                if(resultMedia.trash.check == 0){
                    opt = {"trash.check": 1, "trash.message": "Move to trash file successfully"}
                }else{
                    opt = {"trash.check": 0, "trash.message": "Un trash file successfully"}
                }
                await librariesModel.updateOne( { "_id": mediaId }, opt );
                return res.status(200).json({ success: true, message: req.__("The data has been successfully moved to the recycle bin") })
            }else{
                return res.status(400).json({ success: false, message: req.__("Media file does not exist") })
            }
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    /**
     * Media
     * Method emptyMedia
     * */
    emptyMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            const resultMedia = await librariesModel.find({ "trash.check": 1 });
            resultMedia.forEach((ele, index) => {
                const path = ele.path;
                if (fs.existsSync(path)) {
                    fs.unlink(path, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    })
                }
            });
            await librariesModel.deleteMany({ "trash.check": 1 });
            return res.status(200).json({ success: true, message: req.__("Media file deleted successfully") })
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    deleteMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            const queryStr = req.query;
            const checkUser = await usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });
            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }

            const mediaId = req.params.id
            const resultMedia = await librariesModel.findOne({'_id': mediaId});
            if(!resultMedia) { res.status(200).json({ success: false, message: req.__("Media file does not exists") }) }
            const path = resultMedia.path;
            if (fs.existsSync(path)) {
                fs.unlink(path, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }else{
                        console.log('success')
                    }
                })
            }
            await librariesModel.deleteOne({ '_id': mediaId });
            return res.status(200).json({ success: true, message: req.__("Media file deleted successfully") })
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
     /**
     * Media
     * Method listMedia
     * [ body: { filter , sort } ]
     * */
    listMedia: catchAsyncErrors( async (req, res, next)=>{
        try {
            const queryStr = req.query;
            const checkUser = await usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });

            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }

            var options = [];
            if(queryStr.userId){
                options = [
                    ...options,
                    { "userId": { $eq: queryStr.userId }},
                ]
            }
            if(queryStr.actived){
                options = [
                    ...options,
                    { "actived.check": { $eq: queryStr.actived }},
                ]
            }
            if(queryStr.locked){
                options = [
                    ...options,
                    { "locked.check": { $eq: queryStr.locked }},
                ]
            }
            if(queryStr.trash){
                options = [
                    ...options,
                    { "trash.check": { $eq: queryStr.trash }},
                ]
            }
            const sort = {
                "createdAt": -1
            }
            var filter = {}
            if(options.length > 0){
                filter = {
                    "$and": options
                }
            }

            const resultPerPage = Number(queryStr.limit) || 10
            const currentPage = Number(queryStr.page) || 1;
            const skip = resultPerPage * (currentPage - 1);
            const resultFilter = await librariesModel.find(filter, "-__v -actived -locked -permission -trash").skip(skip).limit(resultPerPage).sort(sort)
            const totalResult = await librariesModel.countDocuments(filter);
            const lastPage = Math.ceil(totalResult/resultPerPage);
            return res.status(200).json({
                success: true,
                pageInfo: {
                    totalResult: totalResult,
                    limit: resultPerPage,
                    page: currentPage,
                    lastPage: lastPage
                },
                data: resultFilter,
            });
           
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    viewStreamMedia: catchAsyncErrors( async (req, res, next)=>{
        
        try {
            const mediaId = req.params.id
            const checkRow = await librariesModel.findOne({"_id": mediaId});
            if(!checkRow) return next(new ErrorHandler(false, req.__("Media file does not exist"), 200));
            
            const range = req.headers.range;
            console.log(req.headers.range);
            console.log('AAAAAAAAAAAAAAAA');
            if(!range) range = 'bytes=0-'
            //if (!range) {  res.status(400).send("Requires Range header") }
            
            let videoPath = checkRow.path;
            let videoSize = fs.statSync(videoPath).size;
            const CHUNK_SIZE = 10 ** 6; // 1MB
            const start = Number(range.replace(/\D/g, ""));
            const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };
            res.writeHead(206, headers);
            const videoStream = fs.createReadStream(videoPath, { start, end });
            videoStream.pipe(res);

        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    showMedia: catchAsyncErrors( async (req, res, next)=>{
        try { 
            const queryStr = req.query;
            const checkUser = await usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });

            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }
            const mediaId = req.params.id
            const checkRow = await librariesModel.findOne({"_id": mediaId}, "-__v -destination -originalname -actived -locked -permission -trash");
            if(!checkRow) return next(new ErrorHandler(false, req.__("Media file does not exist"), 200));
           
            return res.status(200).json({
                success: true,
                data: checkRow
            });
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
    uploadChunkMedia: catchAsyncErrors(  (req, res, next)=>{
        try {
            const queryStr = req.query;
            const checkUser =  usersModel.findOne({ 
                "$and": [
                    { "password": queryStr.secret },
                    { "token": queryStr.token },
                ]
            });

            if(!checkUser) { return next(new ErrorHandler(false, req.__("Secret and Token does not exists"), 200)); }
            if(!queryStr.userId)  { return next(new ErrorHandler(false, req.__("UserId can't be empty"), 200)); }

            req.pipe(req.busboy);
            var path_name = './media/' + CryptoJS.MD5(queryStr.userId);
            if (!fs.existsSync(path_name)) {
                fs.mkdirSync(path_name);
            }

            // let form = new multiparty.Form();
            // form.on('error', function(err) {
            //     console.log('Error parsing form: ' + err.stack);
            // });
            // form.on('part', (part) =>{
            //     part.pipe(fs.createWriteStream(path_name + '/' + part.filename))
            //         .on('close', () => {
            //             res.status(200).json({success: true, message: `File Uploaded: ${part.filename}`})
            //         })
            //         part.on('error', function(err) {
            //             console.log(err)
            //         });
            // })
            // form.parse(req);
            
            req.busboy.on('file', (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                console.log(
                    `File [${fieldname}]: filename: %j, encoding: %j, mimeType: %j`,
                    filename, encoding, mimeType
                );
                const pathFile = path_name + '/' + filename
                const fstream = fs.createWriteStream(pathFile);
                file.pipe(fstream);
                file.on('data', (data) => {
                    console.log(`File [${filename}] got ${data.length} bytes`);
                })
                       
                fstream.on('close', () => {
                    console.log(`Upload of '${filename}' finished`);
                    const fileSizeInBytes = fs.statSync(pathFile).size;
                    var listMedia;
                    var ext = pathRoot.extname(pathFile);
                    var extName = pathRoot.extname(pathFile).slice(1);
                    var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                    console.log(default_ext.indexOf(extName))
                    var default_ext = process.env.MINE_TYPE_VIDEOS.split('|');
                    if(parseInt(default_ext.indexOf(extName)) > -1){
                        var mime = mimeType;
                        var ext = mime.split("/");
                        listMedia = {
                            "originalname": filename,
                            "filename": filename,
                            "destination": path_name,
                            "size": fileSizeInBytes,
                            "mimetype": mimeType,
                            "ext": extName,
                            "path": pathFile,
                            "folder": path_name,
                            "userId": queryStr.userId
                        }
                        const saveItem = new librariesModel(listMedia)
                        saveItem.save()
                        return res.status(200).json({
                            success: true,
                            mediaId: saveItem._id,
                            path: saveItem.path,
                            size: fileSizeInBytes,
                            mimetype: mimeType
                        })
                    }else{
                        return res.status(200).json({
                            success: false,
                            message: "Error"
                        })
                    }
                });
            });

            req.busboy.on('close', () => {
                console.log('Done parsing form!');
            });
        } catch (error) {
            return next(new ErrorHandler(false, error.message, 500));
        }
    }),
}