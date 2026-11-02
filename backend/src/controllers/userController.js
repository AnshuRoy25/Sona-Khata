// GET /api/user/me
export async function getMe(req, res) {
  res.json({ user: req.user });
}