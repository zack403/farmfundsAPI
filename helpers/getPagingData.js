module.exports = function (response, page, limit) {
    const { count: totalItems, rows: data } = response;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, data, totalPages, currentPage };
}