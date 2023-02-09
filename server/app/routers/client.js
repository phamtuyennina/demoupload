const express = require('express')
const router = express.Router()
const { 
    usersController, 
    librariesController
} = require('../controllers')

router.get("/:id", librariesController.viewStreamMedia);
router.get("/show/:id", librariesController.showMedia);
router.delete("/delete/:id", librariesController.deleteMedia);

module.exports =  router