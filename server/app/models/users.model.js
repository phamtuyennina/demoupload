const mongoose = require('mongoose')
const Schema = mongoose.Schema
const UserItemSchema = new Schema({
    _id: {
        type: String,
        lowercase: true,
        default: mongoose.Types.ObjectId
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },
    token: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "Administrator"
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
const UserItem = mongoose.model('lib_users', UserItemSchema)
module.exports = UserItem