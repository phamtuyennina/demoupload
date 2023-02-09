const server = require("./server")
const client = require("./client")
function route(app){
    app.use("/api/v1/admin", server)
    app.use("/video-player", client)
}
module.exports = route