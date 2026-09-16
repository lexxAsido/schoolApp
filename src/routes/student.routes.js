
const express = require("express");
const { createStudent, getStudents, getStudentById, updateStudent, getStudentByName, searchStudents, patchStudentCourse, deleteStudent } = require("../controllers/student.controllers");
const router = express.Router();

router.post("/create-student", createStudent);
router.get("/get-students", getStudents);
router.get("/get-student/:id", getStudentById);
router.put("/update-student/:id", updateStudent);
router.get("/get-student-by-name", getStudentByName);
router.get("/search-students", searchStudents);
router.patch("/:id/course", patchStudentCourse);
router.delete("/delete-student/:id", deleteStudent);

module.exports = router;