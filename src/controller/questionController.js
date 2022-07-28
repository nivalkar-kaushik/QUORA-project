const { default: mongoose } = require('mongoose')
const questionModel = require('../model/questionModel')
const answerModel = require('../model/answerModel');
const { userModel } = require('../model/userModel');

//validity check
const isValid = value => {
    if (typeof value === 'undefined' || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    return true
}

const createQuestion = async (req, res) => {
    let data = req.body, findUser

    try {
        if (!Object.keys(data).length)
            return res.status(400).send({ status: false, message: "Enter your Qestion details." })

        //--------------------------------------------------------description
        if (!isValid(data.description))
            return res.status(400).send({ status: false, message: "description is required." })

        //---------------------------------------------------------tag
        if (data.hasOwnProperty('tag')) {
            if (!Array.isArray(data.tag))
                return res.status(400).send({ status: false, message: "tag is of type array" })

            let temp = data.tag.filter(e => e.length != 0).map(e => e.trim())
            data.tag = temp
        }

        //-------------------------------------------------------------asked by
        if (!isValid(data.askedBy))
            return res.status(400).send({ status: false, message: "askedby user objectid is required" })

        if (!mongoose.isValidObjectId(data.askedBy.trim()))
            return res.status(400).send({ status: false, message: "user object id is invalid" })

        let findUser = await userModel.findById(data.askedBy)

        if (!findUser)
            return res.status(400).send({ status: false, message: "user dont exist" })

        if (data.askedBy.trim() != req.headers['valid-user'])
            return res.status(401).send({ status: false, message: 'user not authorised.' })

        if (findUser.creditScore < 100)
            return res.status(400).send({ status: false, message: "Insufficient credit score. Can't post the question." })

        const createQuestion = await questionModel.create(data)
        await userModel.findOneAndUpdate({ _id: data.askedBy, creditScore: { $gt: 0 } }, { "$inc": { creditScore: -100 } }, { new: true })//deducting creditscore by -100 from userModel
        res.status(201).send({ status: true, message: 'Question posted successfully.', data: createQuestion })

    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }

}

const getQuestions = async (req, res) => {
    try {
        let tag, sort

        if (req.query.tag)
            tag = req.query.tag.split(/[, '"+-;]+/).map(x => { return x.trim() && { tag: x } })

        if (isValid(req.query.askedBy) && !mongoose.isValidObjectId(req.query.askedBy))
            delete req.query.askedBy

        let total = [...tag || [], { askedBy: req.query.askedBy || null }]

        if (isValid(req.query.sort) && req.query.sort.trim() == 'descending') sort = -1
        else sort = 1

        delete req.query.sort

        if (!Object.keys(req.query).length) {
            let questions = await questionModel.find({ isDeleted: false }).lean()
            if (!questions.length)
                return res.status(404).send({ status: false, msg: "No Questions found." })
            let answers = await answerModel.find({ questionId: questions, isDeleted: false }, { isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 }).sort({ createdAt: -1 }).lean()
            if (answers.length) {
                for (let i in questions) {
                    questions[i]['answers'] = answers.filter(x => x.questionId.toString() == questions[i]._id)
                    if (!questions[i]['answers'].length)
                        questions[i]['answers'] = "No Answers Present for this Question yet."
                }
            }
            return res.status(200).send({ status: true, data: questions })
        }
        let questions = await questionModel.find({ $or: total, isDeleted: false, isPublished: true }).sort({ createdAt: sort }).lean()
        if (!questions.length)
            return res.status(404).send({ status: false, msg: "No Questions found." })
        let answers = await answerModel.find({ questionId: questions, isDeleted: false }, { isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0 }).sort({ createdAt: -1 }).lean()
        if (answers.length) {
            for (let i in questions) {
                questions[i]['answers'] = answers.filter(x => x.questionId.toString() == questions[i]._id)
                if (!questions[i]['answers'].length)
                    questions[i]['answers'] = "No Answers Present for this Question yet."
            }
        }
        return res.status(200).send({ status: true, data: questions })

    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

const getQuestionById = async (req, res) => {
    try {
        let qId = req.params.questionId.trim()

        if (!mongoose.isValidObjectId(qId))
            return res.status(400).send({ status: false, message: 'Invalid Quetion Objectid.' })

        let question = await questionModel.findOne({ _id: qId, isDeleted: false }).lean()
        if (!question)
            return res.status(404).send({ status: false, msg: "No Questions found." })

        let answers = await answerModel.find({ questionId: qId, isDeleted: false }).sort({ createdAt: -1 }).lean()
        if (answers.length)
            question['answers'] = answers
        else question['answers'] = "No Answers Present for this Question yet."
        return res.status(200).send({ status: true, data: question })
    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

const updateQuestion = async (req, res) => {
    let data = req.body
    let qId = req.params.questionId.trim()

    try {
        
        if (!mongoose.isValidObjectId(qId))
            return res.status(400).send({ status: false, message: 'Invalid Quetion Objectid.' })

        let findQuestion = await questionModel.findOne({ _id: qId, isDeleted: false })

        if (!findQuestion)
            return res.status(400).send({ status: false, message: 'Question not found.' })

        if (findQuestion.askedBy != req.headers['valid-user'])
            return res.status(400).send({ status: false, message: "You're not authorized to update this Question." })

        if (!Object.keys(data).length)
            return res.status(400).send({ status: false, message: "You didn't provide any data to update." })

        let temp={}
        if (data.description)
            temp.description = data.description

        if (data.hasOwnProperty('tag')) {
            if (!Array.isArray(data.tag))
                return res.status(400).send({ status: false, message: "tag is of type array" })

            let filterTag = data.tag.filter(e => e.length != 0).map(e => e.trim())
            temp.tag = filterTag
        }

        if(Object.keys(temp)==0)      return res.status(400).send({ status: false, message: "you can update only tag and description" })


        let updatedQuestion = await questionModel.findOneAndUpdate({ _id: qId, isDeleted: false },
            {
                description: temp.description?.trim(),
                $addToSet: { tag: { $each: temp.tag || [] } }
            },
            { new: true })
      
        res.status(201).send({ status: true, message: 'Successfully Updated', data: updatedQuestion })
    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

const deleteQuestion = async (req, res) => {
    let qId = req.params.questionId.trim()
    try {
        if (!mongoose.isValidObjectId(qId))
            return res.status(400).send({ status: false, message: 'Invalid Quetion Objectid.' })

        let findQuestion = await questionModel.findOne({ _id: qId, isDeleted: false })
        if (!findQuestion)
            return res.status(404).send({ status: false, message: 'Question not found.' })

        if (findQuestion.askedBy != req.headers['valid-user'])
            return res.status(400).send({ status: false, message: "You're not authorized to delete this Question." })

        let deleteQ = await questionModel.findOneAndUpdate({ _id: qId }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        res.status(200).send({ status: true, message: 'Successfully deleted.', data: deleteQ })
    } catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createQuestion, getQuestions, getQuestionById, updateQuestion, deleteQuestion }