export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // Set req.user for compatibility with existing code
  req.user = req.session.user;
  next();
};