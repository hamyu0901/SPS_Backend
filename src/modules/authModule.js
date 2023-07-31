const crypto = require('crypto');

const createSalt = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            err && reject(err);
            resolve(buf.toString('base64'));
        })
    })
};

const createHashedPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        const salt = await createSalt();
        crypto.pbkdf2(password, salt, 9999, 64, 'sha512', (err, key) => {
            err && reject(err);
            resolve({ password: key.toString('base64'), salt });
        })
    })
};

const setHashedPassword = (password, salt) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 9999, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve(key.toString('base64'));
        });
    })
}

export { createHashedPassword, setHashedPassword }