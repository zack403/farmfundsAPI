module.exports = (err, req, res, next) => {
    res.status(500).send({
        status : 500,
        error: err.message === 'Validation error' ? err.errors[0].message : err.message      
      });
}