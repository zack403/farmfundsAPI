module.exports = function (page, size) {
    const limit = size ? +size : 15;
    const offset = page ? limit * (page - 1) : 0;

    return { limit, offset };
}