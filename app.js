require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const engine = require('ejs-mate');
const nodeMailer = require("nodemailer");
const { title } = require('process');
const app = express();
const PORT = process.env.PORT || 3500;


// Transport Setup
const transporter = nodeMailer.createTransport({
  secure : true,
  host : "smtp.gmail.com",
  port : 465,
  auth : {
    user : process.env.EMAIL_ID,
    pass : process.env.EMAIL_PASS
    },
});

function sendMail(to, sub, msg){
  return transporter.sendMail({
    from : "Shubamrut Designing Studio",
    to,
    subject : sub,
    html : msg,
  })
}





// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the templating engine
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get("/", (req, res) => {
  res.render('listings/home');
});




// // contact form
// app.get("/contact", (req, res)=>{
//     res.render('listings/contact');
// });
// app.post("/contact", async(req, res) => {
//   const { name, number, email, message } = req.body;

//   const emailContent = `
//    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
//       <h2>New Enquiry Received</h2>
//       <p><strong>Name:</strong> ${name}</p>
//       <p><strong>Phone:</strong> ${number}</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Message:</strong> ${message}</p>
//     </div>
//   `;
//   try {
//     await sendMail("tejas.s.surse2004@gmail.com", "NEW ENQUIRY", emailContent);
//     res.render('listings/contact', { message: "Email sent successfully" });
//   } catch (err) {
//     console.log(err);
//     res.render("listings/error", { title: "Failed to send enquiry. Please try again later." });
//   }
// });

// Page Not Found
app.use((req, res) => {
    res.status(404).render('listings/404');
});



// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
