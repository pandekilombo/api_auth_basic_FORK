
const isNumber = (req, res, next) => {
    const id = req.params.id;
    console.log(id);
    if(!id){
        return res.status(400).json({
            message: 'ID is required'
        });
    }
    if (isNaN(id)) {
        return res.status(400).json({
            message: 'ID must be a number'
        });
    }
    next();
};

export default {
    isNumber
};
