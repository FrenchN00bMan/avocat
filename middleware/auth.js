function requireAuth(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }

  return res.redirect('/admin/login');
}

module.exports = {
  requireAuth
};
