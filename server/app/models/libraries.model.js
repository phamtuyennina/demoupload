const mongoose = require('mongoose')
const Schema = mongoose.Schema
const LibrariesItemSchema = new mongoose.Schema({
    _id: {
        type: String,
        lowercase: true,
        default: mongoose.Types.ObjectId
    },
    userId: {
        type: Number,
        required: true
    },
    originalname: {
        type: String,
    },
    filename: {
        type: String,
    },
    path: {
        type: String,
    },
    destination: {
        type: String,
    },
    size: {
        type: Number,
    },
    folder: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    mimetype: {
        type: String,
    },
    ext: {
        type: String,
    },
    actived: {
        check: {
            type: Number,
            default: 1
        },
        message: {
            type: String
        }
    },
    locked: {
        check: {
            type: Number,
            default: 1
        },
        message: {
            type: String
        }
    },
    permission: {
        check: {
            type: Number,
            default: 1
        },
        message: {
            type: String
        }
    },
    trash: {
        check: {
            type: Number,
            default: 1
        },
        message: {
            type: String
        }
    }
},{
    timestamps: true
})
const LibrariesItem = mongoose.model('lib_libraries', LibrariesItemSchema)
module.exports = LibrariesItem