const mongoose = require('mongoose');

const genusSchema = new mongoose.Schema({
    sci_name: {
        type: String,
        required: true,
    },
    vie_name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        required: true,
    },
    deletedAt: Date,
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

genusSchema.virtual('species', {
    ref: 'Species',
    localField: '_id',
    foreignField: 'genus_ref',
    match: { archived: false },
    count: true
})

const Genus = mongoose.model('Genus', genusSchema)

module.exports = Genus;