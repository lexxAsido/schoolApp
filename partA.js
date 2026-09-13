/*  
           PART A - MY ANSWERS

Question 1
if two Adas exist in db student.find({name}) will fetch the two Adas in an array.
while fineOne() would return one document instead of an array.
find() is used when you expect multiple possible matches, such as searching students by name. 
while findOne() is used when you only need one matching document.


Question 2
The current code does a plain equality match:

const { name } = req.query;
const student = await Student.find({ name });
MongoDB compares strings exactly as given — it does not ignore case and does not trim whitespace. 
So:
/get-student-by-name?name=Ada matches a document with name: "Ada".
/get-student-by-name?name=ada will not match "Ada", because "ada" !== "Ada".
/get-student-by-name?name=Ada%20 (trailing space) will not match "Ada", because "Ada " !== "Ada".

In each failing case, the query doesn't error — it just returns an empty result, which can look like the student doesn't exist.

The fix is to do the matching inside MongoDB using a case-insensitive regex, rather than fetching all students and filtering in JavaScript:
const { name } = req.query;

const student = await Student.find({
  name: { $regex: name.trim(), $options: "i" }
});
$options: "i" makes the match case-insensitive, so ada, Ada, and ADA are all treated the same.
.trim() strips leading/trailing whitespace from the input before the query runs, so "Ada " still matches "Ada".

This keeps the comparison work inside the database query itself instead of pulling every student into Node and filtering with .filter(), which doesn't scale as the collection grows.


Question 3
Reason one: how the endpoint is being called (params vs body, method, URL)

The route is defined as:

app.put("/update-student/:id", async (req, res) => {
  const { id } = req.params;

This means the ID must be part of the URL path, not the request body:
PUT http://localhost:4555/update-student/6a9718a135d8ee2f4a33ba87

If the admin is instead sending the ID inside the JSON body (and leaving it out of the URL, or using a wrong ID in the URL), req.params.id 
won't match the student she actually intends to update. 
findByIdAndUpdate would then either update the wrong document, 
find nothing, or throw a cast error — and in any of those cases, 
the response she sees would look like "nothing changed," giving the impression the old document is still there. 
The method also matters: if the request is accidentally sent as a GET or POST instead of PUT, 
it won't hit this route handler at all, and she'd just be looking at a find/read response instead of the result of an update.

Reason two: Mongoose update options (new, runValidators, and missing fields)

The route already includes:
{ new: true }

new: true tells Mongoose to return the document after the update is applied, 
instead of the default behavior (returning the document as it was before the update). 
So if new: true were missing or removed, the response sent back to the admin would show the old, 
pre-update version — even though the update itself succeeded in the database. 
That alone could explain her seeing "the old document," even without anything being wrong with the actual save.

Separately, runValidators is not currently set. Without runValidators: true, Mongoose skips schema validation on update operations, 
so an update that fails validation could be silently rejected or behave unexpectedly instead of clearly erroring.

There's also a risk from how the update object is built:

const { name, age, email, phone, address, course, institution } = req.body;
If the admin's request doesn't include every one of these fields, the missing ones become undefined after destructuring. 
Passing an object with undefined values into findByIdAndUpdate can overwrite existing fields with undefined rather than leaving them untouched — 
so a partial update (e.g. changing only phone) could unintentionally wipe out other fields, making the resulting document look "wrong" rather 
than simply "old." This is why a partial-update use case is better handled by PATCH, updating only the fields actually provided.


Question 4

The current code is:

const student = await Student.findById(id);
return res.status(200).json({
  message: "Student fetched successfully",
  student
});

Valid ObjectId, student exists

findById() locates the matching document, and the route sends 200 OK with the student data in the response body. 
This case works correctly as-is.

Valid ObjectId, student does not exist
When the ID is a properly formatted ObjectId but no document matches it, 
Mongoose's findById() doesn't throw an error — it simply resolves to null.

The current code never checks for that null value, so it still falls through to the success response:

{
  "message": "Student fetched successfully",
  "student": null
}

sent with a 200 OK status. This is misleading — the request "succeeded" from the server's point of view, 
but the caller gets an empty result disguised as a success. The fix is to explicitly check if (!student) and 
return a 404 Not Found in that case, since "no document with this id" is a legitimate, expected outcome that deserves its own status code.

Invalid ID, such as abc123

This is a fundamentally different failure from the case above. A valid MongoDB ObjectId has a specific format (a 24-character hex string). 
When "abc123" is passed to findById(), Mongoose tries to cast that string into an ObjectId before it ever queries the database — and 
that cast fails, throwing a CastError.

That error is caught by the route's existing catch block:

javascript
} catch (error) {
  return res.status(500).json({ message: "Internal server error" });
}

which sends a generic 500 Internal Server Error. That's the wrong status code for this situation: a 500 implies something broke unexpectedly on the server, but here the problem is that the client sent a malformed request — the ID was never a valid ObjectId to begin with. That's a client-side input error, which belongs in the 4xx range, not 5xx.

Why a CastError and a missing document are not the same bug

CastError (invalid ID format, e.g. "abc123") → the request itself is malformed before any database lookup happens → should be a 400 Bad Request.
Valid ID, but no matching document → the request was well-formed and the query ran successfully, it just found nothing → should be a 404 Not Found.

To handle both correctly, the catch block should inspect the error type — checking error.name === "CastError" (or error.kind === "ObjectId") 
and returning 400 for that case, while everything else continues to fall back to 500 for genuine unexpected server errors, 
with the null-check for missing documents handled separately as a 404 before the try block would ever need to catch anything.

Question 5
The actual collection name in mongo DB is students and not Student becuase by 
default Mongoose takes the model name,lowercases it and pluralizes it.
This matters too If someone bypasses the API and queries MongoDB directly, they need to use the real collection name — students — 
not the model name from the code.
MongoDB won't error out, it will happily query a collection called Student, 
which doesn't exist (or is simply empty), and return an empty result set. 
There's no warning that they've guessed the wrong name.

Question 6
This line in app.js is responsible for making JSON request bodies available through req.body:
app.use(express.json());
express.json() only parses the body when the request's Content-Type header is application/json without it, 
the middleware skips parsing and req.body comes back empty ({}), even though your code has that middleware set up correctly.
 So the fields destructured from req.body all become undefined, causing either a Mongoose validation error
  (if fields are required) or a saved document full of undefined values.











*/
