const express = require('express')
const router = express.Router()

const {userLogin} = require('../controller/loginController')
const {userAuthentication} = require('../middleware/authentication')
const {createUser, getUser, updateUser} = require('../controller/userController')
const {createQuestion, getQuestions, getQuestionById, updateQuestion, deleteQuestion} = require('../controller/questionController')
const {createAnswer, getAnswers, updateAnswer, deleteAnswer} = require('../controller/answerController')

//User API Route Handlers
router.post('/register', createUser)
router.post('/login', userLogin)
router.get('/user/:userId/profile', userAuthentication, getUser)
router.put('/user/:userId/profile', userAuthentication, updateUser)

//Question API Route Handlers
router.post('/question', userAuthentication, createQuestion)
router.get('/questions', getQuestions)
router.get('/questions/:questionId', getQuestionById)
router.put('/questions/:questionId', userAuthentication, updateQuestion)
router.delete('/questions/:questionId', userAuthentication, deleteQuestion)

//Answer API Route Handlers
router.post('/answer', userAuthentication, createAnswer)
router.get('/questions/:questionId/answer', getAnswers)
router.put('/answer/:answerId', userAuthentication, updateAnswer)
router.delete('/answers/:answerId', userAuthentication, deleteAnswer)

module.exports = router