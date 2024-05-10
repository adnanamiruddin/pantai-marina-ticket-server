const responseWithData = (res, statusCode, data) => {
  res.status(statusCode).json(data);
};

const ok = (res, data) => responseWithData(res, 200, data);

const error = (res) =>
  responseWithData(res, 500, {
    status: 500,
    message: "Waduh! There is Something Wrong",
  });

const badRequest = (res, message) =>
  responseWithData(res, 400, {
    status: 400,
    message,
  });

const notFound = (res) =>
  responseWithData(res, 404, {
    status: 404,
    message: "Cannot Find It",
  });

const created = (res, data) => responseWithData(res, 201, data);

const unauthorize = (res) =>
  responseWithData(res, 401, {
    status: 401,
    message: "Unauthorize",
  });

const forbidden = (res) =>
  responseWithData(res, 403, {
    status: 403,
    message: "Forbidden",
  });

export default {
  error,
  badRequest,
  ok,
  created,
  unauthorize,
  notFound,
  forbidden,
};
