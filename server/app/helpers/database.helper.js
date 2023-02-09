const mongoose = require("mongoose")
class Database {
    connection = mongoose.connection;
    constructor() {
        try {
            this.connection
            .on('open', console.info.bind(console, 'Database connection: Open'))
            .on('connected', console.info.bind(console, 'Database connection: Connected'))
            .on('close', console.info.bind(console, 'Database connection: Close'))
            .on('disconnected', console.info.bind(console, 'Database connection: Disconnecting'))
            .on('disconnected', console.info.bind(console, 'Database connection: Disconnected'))
            .on('reconnected', console.info.bind(console, 'Database connection: Reconnected'))
            .on('fullsetup', console.info.bind(console, 'Database connection: Fullsetup'))
            .on('all', console.info.bind(console, 'Database connection: All'))
            .on('error', console.error.bind(console, 'MongoDB connection: Error'));
        } catch (error) {
            console.error(error);
        }
    }
    async connect(urlConnect) {
        try {
            const options = { autoIndex: false, maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000, family: 4  };
            await mongoose.connect( `${urlConnect}?retryWrites=true&w=majority`, options );
        } catch (error) {
            console.error(error);
        }
    }

    async close() {
        try {
            await this.connection.close();
        } catch (error) {
            console.error(error);
        }
    }
}
module.exports = new Database();