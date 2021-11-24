const crypto = require('crypto');

var cryptoUtils = {
    encrypt: function (data, key) {
        const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createCipheriv('aes-192-cbc', Buffer.alloc(24, key, 'base64'), iv);
        let crypted = cipher.update(data, 'utf8', 'base64');
        crypted += cipher.final('base64');
        return crypted;
    },

    decrypt: function (encrypted, key) {
        const iv = Buffer.alloc(16, 0);
        const decipher = crypto.createDecipheriv('aes-192-cbc', Buffer.alloc(24, key, 'base64'), iv);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },

};


module.exports = cryptoUtils;