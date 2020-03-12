const users = [];

const findUserByOidAsync = function(oid) {
    return new Promise((resolve, reject) => {
        const user = users.find(u => u.oid === oid);
        if (!user) {
            resolve(null);
        } else {
            resolve(user);
        }
    });
}

const addUserAsync = function(user) {
    return new Promise((resolve, reject) => {
        users.push(user);
        resolve();
    });
}

module.exports = { findUserByOidAsync, addUserAsync };