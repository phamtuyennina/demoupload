const express = require('express')
const router = express.Router()
const { 
    usersController, 
    librariesController
} = require('../controllers')

router.post("/member/add", usersController.register);
router.post("/member/update/:id", usersController.update);
router.delete("/member/trash/:id", usersController.trash);

router.get("/media/list", librariesController.listMedia);
router.post("/media/upload", librariesController.uploadMedia);
router.post("/media/single", librariesController.uploadSingle);
router.post("/media/update/:id", librariesController.updateMedia);
router.delete("/media/trash/:id", librariesController.trashMedia);
router.delete("/media/empty", librariesController.emptyMedia);
router.delete("/media/delete/:id", librariesController.deleteMedia);
router.post("/media/upload-chunk", librariesController.uploadChunkMedia);
router.post("/media/chunktest", librariesController.uploadChunkTest);

module.exports =  router