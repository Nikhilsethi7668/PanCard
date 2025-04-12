const multer = require("multer");
const { BadRequestError } = require("../errors");

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
    "text/x-csv",
    "application/x-csv",
    "text/comma-separated-values",
    "text/x-comma-separated-values",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new BadRequestError("Only CSV files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const handleUploadErrors = (req, res, next) => {
  upload.single("csv")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new BadRequestError("File upload error: " + err.message));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = handleUploadErrors;
