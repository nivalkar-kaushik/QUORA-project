const { userModel, passwordModel } = require('../model/userModel');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10

let nameRegEx = /^(?![\. ])[a-zA-Z\. ]+(?<! )$/
let emailRegEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let mobileRegEx = /^(\+\d{1,3}[- ]?)?\d{10}$/
let passRegEx = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/

//validity check
const isValid = value => {
    if (typeof value === 'undefined' || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true
}

// const uniqueCheck = async (key, value) => {
//     let data = {}; data[key] = value
//     return await userModel.findOne(data)
// }


const createUser = async (req, res) => {
    let tempPass = req.body.password
    try {
        let data = req.body

        if (!Object.keys(data).length)
            return res.status(400).send({ status: false, message: "Enter data to create User." })

        //---------------------------------------------fname
        if (!isValid(data.fname))
            return res.status(400).send({ status: false, message: 'First name is required' })
        if (isValid(data.fname) && !nameRegEx.test(data.fname?.trim()))
            return res.status(400).send({ status: false, message: 'Invalid First name' })

        //---------------------------------------------lname
        if (!isValid(data.lname))
            return res.status(400).send({ status: false, message: 'Last name is required' })
        if (isValid(data.lname) && !nameRegEx.test(data.lname?.trim()))
            return res.status(400).send({ status: false, message: 'Invalid Last name' })

        //---------------------------------------------email
        if (!isValid(data.email))
            return res.status(400).send({ status: false, message: 'Email is required' })
        if (!emailRegEx.test(data.email?.trim()))
            return res.status(400).send({ status: false, message: 'Invalid Email!!!' })

        let findEmail = await userModel.findOne({ email: data.email })
        if (findEmail)
            return res.status(400).send({ status: false, message: 'Email is already used' })

        //-----------------------------------------------phone number
        if (!isValid(data.phone))
            return res.status(400).send({ status: false, message: 'Phone is required' })
        if (!mobileRegEx.test(data.phone?.trim()))
            return res.status(400).send({ status: false, message: 'Invalid Phone number!!!' })

        let findPhone = await userModel.findOne({ phone: data.phone })
        if (findPhone)
            return res.status(400).send({ status: false, message: 'Phone number is already used' })

        //-----------------------------------------------password---------------------------------------------------------------
        if (!isValid(data.password))
            return res.status(400).send({ status: false, message: 'Password is required' })
        if (isValid(data.password) && (data.password.trim().length < 8 || data.password.trim().length > 15))
            return res.status(400).send({ status: false, message: 'Password length between 8 and 15' })

        // if(!isValid(data.creditScore))//commented for phase 2 as default credit score 500 is added for every user in userModel
        //     error.push('CreditScore is required')
        if (isValid(data.creditScore) && isNaN(data.creditScore))
        return res.status(400).send({ status: false, message: 'credit score should be a number' })

        if (Number(data.creditScore) < 500)
            data.creditScore = 500//bcz for new user credit score must be minimum 500

        data.password = await bcrypt.hash(data.password, saltRounds)
        data.fname = data.fname?.split(' ').map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(' ')
        data.lname = data.lname?.split(' ').map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(' ')
        const createUser = await userModel.create(data)

        res.status(201).send({ status: true, message: 'User created successfully.', data: createUser })

    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

const getUser = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!mongoose.isValidObjectId(userId))
            return res.status(401).send({ status: false, message: 'Invalid userId.' })

        let userDetails = await userModel.findById(userId)
        if(!userDetails)  
            return res.status(404).send({ status: false, message: 'user dont exist.' })

        if (userId != req.headers['valid-user'])
            return res.status(401).send({ status: false, message: 'user not authorised.' })

        res.status(200).send({ status: true, message: 'success', data: userDetails })
    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

const updateUser = async (req, res) => {
    try {
        let data = req.body
        let userId = req.params.userId
        // let signedUser = req.headers['valid-user']

        if (!mongoose.isValidObjectId(userId))
            return res.status(401).send({ status: false, message: 'Invalid userId.' })

        let user = await userModel.findById(userId)
        if(!user)  
        return res.status(404).send({ status: false, message: 'user dont exist.' })

        if (userId != req.headers['valid-user'])
            return res.status(401).send({ status: false, message: 'user not authorised.' })

        if (!Object.keys(data).length)
            return res.status(400).send({ status: false, message: "Enter data to update User." })

        let temp={}
        if (data.fname) {
            if (isValid(data.fname) && !nameRegEx.test(data.fname?.trim()))
                return res.status(400).send({ status: false, message: "fname must be in proper format" })
            temp.fname = data.fname
        }

        if (data.lname) {
            if (isValid(data.lname) && !nameRegEx.test(data.lname?.trim()))
                return res.status(400).send({ status: false, message: "lname must be in proper format" })
            temp.lname = data.lname
        }

        if (data.email) {
            if (isValid(data.email) && !emailRegEx.test(data.email?.trim()))
                return res.status(400).send({ status: false, message: "email must be in proper format" })
            let findEmail = await userModel.findOne({ email: data.email })
            if (findEmail)
                return res.status(400).send({ status: false, message: "email already present" })

            temp.email=data.email
        }

        if (data.phone) {
            if (isValid(data.phone) && !mobileRegEx.test(data.phone?.trim()))
                return res.status(400).send({ status: false, message: "phone number must be in proper format" })
            let findPhone = await userModel.findOne({ phone: data.phone })
            if (findPhone)
                return res.status(400).send({ status: false, message: "phone number already exists" })

            temp.phone = data.phone
        }
        
        if(Object.keys(temp)==0)
        return res.status(400).send({ status: false, message: "you can only update lname,fname,email,phone" })



        temp.fname = temp.fname?.split(' ').map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(' ')
        temp.lname = temp.lname?.split(' ').map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(' ')
        let updatedUser = await userModel.findOneAndUpdate({ _id: userId, isDeleted: false }, temp, { new: true })
        res.status(200).send({ status: false, message: 'Successfully Updated', data: updatedUser })

    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createUser, getUser, updateUser }