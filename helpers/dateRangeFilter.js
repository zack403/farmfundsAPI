const { Sequelize, Op } = require("sequelize");


module.exports = function (dateRange, status, amt) {
    let filter;
    if(dateRange === 'today') {

        filter =  { 
            [Op.and]: [
                amt ? {amount: {[Op.gt]: 0}} : '',
                status ? {status: status} : '',
                {createdAt: { 
                    [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
                    [Op.lte]: new Date()
                  }
                }
            ]
        };
    } else if (dateRange === 'month') {
        
        filter =  { 
            [Op.and]: [
                amt ? {amount: {[Op.gt]: 0}} : '',
                status ? {status: status} : '',
                Sequelize.where(Sequelize.fn("date_part",'month', Sequelize.col('createdAt')), new Date().getMonth() + 1)
            ]
        };
    } else if (dateRange === 'year') {

        filter =  { 
            [Op.and]: [
                amt ? {amount: {[Op.gt]: 0}} : '',
                status ? {status: status} : '',
                Sequelize.where(Sequelize.fn("date_part",'year', Sequelize.col('createdAt')), new Date().getFullYear())
            ]
        };
    }

    return filter;
}