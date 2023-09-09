const mongoose = require('mongoose');

const speciesSchema = new mongoose.Schema({
    short_name: { type: String, required: true },
    sci_name: { type: String, required: true },
    author: { type: String, required: true },
    debut_year: { type: Number },
    avatar: {
        fileId: { type: String, required: true },
        fileUrl: { type: String, required: true },
    },
    other_name: [{
        name: { type: String, require: true },
        reference: { type: Number },
        _id: false
    }],
    vie_name: [{
        name: { type: String, require: true },
        reference: { type: Number },
        _id: false
    }],
    family_description: { type: String, required: true },
    takhtajan_system: {
        kingdom: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        division: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        layer: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        order: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        family: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        genus: {
            name: { type: String, required: true },
            nomenclature: { type: String, required: true },
            reference: { type: Number }
        },
        species: {
            nomenclature: { type: String, required: true },
            reference: { type: Number, default: '' }
        },
    },
    description: { type: String, required: true },
    microsurgerys: [{
        image: {
            fileId: { type: String, required: true },
            fileUrl: { type: String, required: true },
        },
        caption: { type: String, required: true },
        explains: { type: Array },
        _id: false,
    }],
    distribution: { type: String, required: true },
    phytochemicals: [{
        bio_active: { type: String, required: true },
        bio_reference: { type: Number },
        chemical_group: { type: String },
        segment: { type: String },
        physical_properties: { type: String, default: '' },
        spectrum: { type: Array, required: true },
        chemical_structure: {
            fileId: { type: String, required: true },
            fileUrl: { type: String, required: true }
        },
        pharma_effect: { type: String, default: '' },
    }],
    benefits: { type: String, required: true },
    references: [{
        content: { type: String, required: true },
        link: { type: String },
        _id: false,
    }],
    status: { type: Boolean, required: true },
    genus_ref: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Genus' },
    deletedAt: Date,
}, { timestamps: true })

const Species = mongoose.model('Species', speciesSchema)

module.exports = Species;