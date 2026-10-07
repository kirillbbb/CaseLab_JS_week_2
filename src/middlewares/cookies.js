export function cookieParser(req, _res, next) {
  req.cookies = {};
  const header = req.get("Cookie");
  if (header) {
    for (const pair of header.split(";")) {
      const index = pair.indexOf("=");
      if (index > 0) req.cookies[pair.slice(0,index).trim()] = decodeURIComponent(pair.slice(index+1).trim());
    }
  }
  next();
}
