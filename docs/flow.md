Frontend                    Backend
   |                           |
   |  POST /auth/logout        |
   |-------------------------->|
   |                           |  res.clearCookie('token')
   |                           |
   |  { message: "Logged out" }|
   |<--------------------------|
   |                           |
   |  Redirect ke /login       |
   |                           |