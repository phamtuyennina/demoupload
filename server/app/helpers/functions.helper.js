class Functions {
    isIsset(str){
        return !str;
    }
    isEmpty(str){
        return (!str || str.length === 0 );
    }
    isLength(str,options){
        if (str.length < options.min) {
            return false
        } else if (str.length > options.max) {
            return false
        }
        return true
    }
    makeOrder(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    makeRandom(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    getListMimeType(){
        var arrMime = [{
            "code": "audio",
            "mimetype": ["audio/aac","video/x-msvideo","application/x-cdf","audio/midi","audio/x-midi","audio/mpeg","audio/ogg","audio/opus","audio/wav","audio/webm","audio/3gpp","audio/3gpp2"]
        },{
            "code": "video",
            "mimetype": ["video/mp4","video/mpeg","video/ogg","video/mp2t","video/webm","video/3gpp","video/3gpp2"]
        },{
            "code": "image",
            "mimetype": ["image/avif","image/bmp","image/gif","image/vnd.microsoft.icon","image/jpeg","image/png","image/svg+xml","image/tiff","image/webp"]
        },{
            "code": "document",
            "mimetype": ["application/x-abiword","application/x-freearc","officedocument.wordprocessingml.document","application/vnd.oasis.opendocument.presentation","application/vnd.oasis.opendocument.spreadsheet","application/vnd.oasis.opendocument.text","application/pdf","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/msword","text/plain","text/css","text/csv","application/json","application/ld+json","text/javascript"]
        },{
            "code": "archive",
            "mimetype": ["application/zip","application/vnd.rar","application/x-tar","application/x-7z-compressed"]
        },{
            "code": "other",
            "mimetype": ["font/otf","font/ttf","font/woff","font/woff2","application/xml","text/xml","application/atom+xml","text/calendar","application/xhtml+xml","application/vnd.visio"]
        }];
        return arrMime;
    }
    getItemMimeType(code){
        const listMime = this.getListMimeType();
        var result =  listMime.find((ele, index) => {
            if (ele.code === code) {
                return ele
            }
        });
        return result
    }
}

module.exports = new Functions();