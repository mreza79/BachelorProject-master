const express = require('express')
const Restaurant = require('../models/restaurant')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/restaurants', auth, async (req, res) => {
    // const restaurant = new restaurant(req.body)
    const restaurant = new Restaurant({
        ...req.body,
        manager: req.manager._id
    })
    console.log(...req.body)
    console.log(req.manager._id)
    try {
        await restaurant.save()
        res.status(201).send(restaurant)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/restaurants/', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[part[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.manager.populate({
            path: 'restaurants',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.manager.restaurants)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/restaurants/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const restaurant = await Restaurant.findOne({ _id, owner: req.manager._id })

        if (!restaurant) {
            return res.status(404).send()
        }
        res.send(restaurant)
    } catch (e) {
        res.status(500).send(e)
    }
})
router.patch('/restaurants/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) return res.status(400).send({ error: 'Invalid Updates!' })

    try {
        const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: req.manager._id })

        if (!restaurant) {
            return res.status(404).send()
        }

        updates.forEach((update) => restaurant[update] = req.body[update])
        await restaurant.save()
        res.send(restaurant)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/restaurants/:id', auth, async (req, res) => {
    try {
        const restaurant = await Restaurant.findOneAndDelete({ _id: req.params.id, owner: req.manager._id })

        if (!restaurant) {
            return res.status(404).send()
        }

        res.send(restaurant)
    } catch (e) {
        res.status(500).send(e)
    }
})


module.exports = router