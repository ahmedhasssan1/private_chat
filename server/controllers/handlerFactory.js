const catchAsync=require('./../utility/catchAsync');
const AppError = require('../utility/errorHandler');
const { redisClients } = require('../redisClient');

//desgin pattern factory

exports.softDelete = (model) => {
  return catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    const findDocument = await model.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true, runValidators: true }
    );

    if (!findDocument) {
      return res.status(404).json({
        message: "No record exists with this ID"
      });
    }
    
    res.status(200).json({
      status: "success",
      data: {
        findDocument
      }
    });
  });
};


exports.deleteone = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('no document exist with this id ', 404));
    }
    res.status(204).json({
      status: 'done',
      data: null,
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({message:"this document is not found"})
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getDocumentById = (model) =>
  catchAsync(async (req, res, next) => {
    const doc=req.params.id;
    let findOne = await model.findById(doc);
    if(!findOne || findOne.isDeleted){
        return res.status(404).json({message:"this user has been deleted"})
    }
    
    res.status(200).json({
      status: 200,
      data: {
        findOne,
      },
    });
  });

exports.getAll = (model) =>
  catchAsync(async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    if (
      (req.query.page && (isNaN(page) || page < 1)) ||
      (req.query.limit && (isNaN(limit) || limit < 1))
    )
    {
      return next(new AppError('must page and limit be intger'))
    }
    const startIndex = (page - 1) * limit;

    const cacheKey = `All${model.modelName}_page${page}_limit${limit}`;
    // console.log("key",cacheKey);
    
    const cached = await redisClients.get(cacheKey);
    if (cached) {
      console.log('cache hit!');
      return res.status(200).json(JSON.parse(cached));
    }else{
      console.log('cash missed');
    }

    const doc = await model.find().skip(startIndex).limit(limit);
     const response = {
      result: doc.length,
      status: 'success',
      data: { doc },
    };
    await redisClients.setEx(cacheKey, 3600, JSON.stringify(response));
    res.status(200).json(response);

  });

  exports.getAllUsers = (model) =>
  catchAsync(async (req, res, next) => {
    
    const doc = await model.find({isDeleted:false});
    res.status(200).json({
      result: doc.length,
      status: 'succes',
      data: {
        doc,
      },
    });
  });
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};