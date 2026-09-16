const mongoose = require('mongoose');


const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  age: Number,

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: String,
  address: String,

  course: {
    type: String,
    minlength: 2
  },

  institution: String
}, {timestamps: true, versionKey: false});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
