const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET || "Quora Project by kaushik."

const decodeToken = (token) => {
    return jwt.verify(token, secret, (err, data) => {
        if (err)
            return null
        else
            return data
    })
}

const userAuthentication = async (req,res,next) => {
    try{
        let token = req.headers['user-auth-key']
        if(!token) return res.status(401).send({status : false, message : "Token must be present"})

        let verifyToken = decodeToken(token)
        if(!verifyToken)
            return res.status(401).send({
                status: false,
                message: "Token is either Invalid or Expired. User Must log in with Valid details."
            })
        req.headers['valid-user'] = verifyToken.userId
        next()
    }catch(err){
        res.status(500).send({
            status: false,
            message: err.message
        })
    }
}

module.exports = {userAuthentication}