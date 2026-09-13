
//UPDATED APP.JS FILE
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');

const app = express();
const port = 4555;

dotenv.config();
app.use(morgan('dev'));
app.use(express.json());

const databaseConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/SchoolApp");
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

databaseConnection();

app.get("/", (req, res) => {
  res.send("Hello World");
});


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
});

const Student = mongoose.model("Student", studentSchema);


// CREATE STUDENT
app.post("/create-student", async (req, res) => {
  const {
    name,
    age,
    email,
    phone,
    address,
    course,
    institution
  } = req.body;

  try {

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required"
      });
    }

    const student = new Student({
      name,
      age,
      email,
      phone,
      address,
      course,
      institution
    });

    await student.save();

    return res.status(200).json({
      message: "Student created successfully",
      student
    });

  } catch (error) {

    // MongoDB duplicate-key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// GET ALL STUDENTS
app.get("/get-students", async (req, res) => {
  try {
    const students = await Student.find();

    return res.status(200).json({
      message: "Students fetched successfully",
      students
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// GET STUDENT BY ID
app.get("/get-student/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      message: "Student fetched successfully",
      student
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// UPDATE STUDENT
app.put("/update-student/:id", async (req, res) => {
  const { id } = req.params;

  const {
    name,
    age,
    email,
    phone,
    address,
    course,
    institution
  } = req.body;

  try {

    const student = await Student.findByIdAndUpdate(
      id,
      {
        name,
        age,
        email,
        phone,
        address,
        course,
        institution
      },
      {
        new: true
      }
    );

    return res.status(200).json({
      message: "Student updated successfully",
      student
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// GET STUDENT BY NAME
app.get('/get-student-by-name', async (req, res) => {
  const { name } = req.query;

  try {
    const student = await Student.find({ name });

    return res.status(200).json({
      message: "Student fetched successfully",
      student
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// SEARCH STUDENTS
app.get("/search-students", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({
      message: "Search query q is required"
    });
  }

  const searchText = q.trim();

  try {

    const students = await Student.find({
      $or: [
        {
          name: {
            $regex: searchText,
            $options: "i"
          }
        },
        {
          email: {
            $regex: searchText,
            $options: "i"
          }
        },
        {
          course: {
            $regex: searchText,
            $options: "i"
          }
        }
      ]
    });

    return res.status(200).json(students);

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// PATCH STUDENT COURSE
app.patch("/students/:id/course", async (req, res) => {
  const { id } = req.params;
  const { course } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  if (!course || course.trim() === "") {
    return res.status(400).json({
      message: "Course is required"
    });
  }

  try {

    const student = await Student.findByIdAndUpdate(
      id,
      {
        course: course.trim()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      message: "Student course updated successfully",
      student
    });

  } catch (error) {

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


// DELETE STUDENT
app.delete("/delete-student/:id", async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  try {

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }
    return res.status(200).json({
      message: "Student deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});