require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const engine = require('ejs-mate');
const nodeMailer = require('nodemailer');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const Listing = require('./models/listing.model.js');
const methodOverride = require('method-override');

const app = express();
const connectDB = require('./db/db.js');

const PORT = process.env.PORT || 3500;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Updated uploadOnCloudinary to handle buffer directly
const uploadOnCloudinary = async (fileBuffer, options = {}) => {
  try {
    if (!fileBuffer) return null;
    // Convert buffer to base64 data URI for Cloudinary upload
    const fileBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    const response = await cloudinary.uploader.upload(fileBase64, {
      resource_type: 'image',
      ...options,
    });
    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

// Multer setup for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Nodemailer Transport Setup
const transporter = nodeMailer.createTransport({
  secure: true,
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: 'punnyaeeconstruction@gmail.com',
    pass: 'vgldszkavhiqpwxp',
  },
});

function sendMail(to, sub, msg) {
  return transporter.sendMail({
    from: '"Shubamrut Designing Studio" <punnyaeeconstruction@gmail.com>',
    to,
    subject: sub,
    html: msg,
  });
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Set EJS as the templating engine
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('listings/home');
});

app.get('/walkthrough', (req, res) => {
  res.render('listings/walkthrough');
});

app.get('/contact', (req, res) => {
  res.render('listings/contact');
});

app.post('/contact', async (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  try {
    const mailOptions = {
      from: '"Shubamrut Contact Form" <punnyaeeconstruction@gmail.com>',
      to: 'shubhamrut16@gmail.com',
      subject: subject || 'New Contact Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9ff; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #5B21B6;">📩 New Contact Form Submission</h2>
          <div style="margin-top: 10px; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p><strong>👤 Name:</strong> ${name}</p>
            <p><strong>📞 Phone:</strong> ${phone}</p>
            ${email ? `<p><strong>✉️ Email:</strong> ${email}</p>` : ''}
            ${subject ? `<p><strong>📌 Subject:</strong> ${subject}</p>` : ''}
            ${message ? `<p><strong>💬 Message:</strong><br><span style="white-space: pre-line;">${message}</span></p>` : ''}
          </div>
          <div style="margin-top: 30px; text-align: center; color: #888; font-size: 13px;">
            <p>Sent from <strong>Shubamrut Designing Studio</strong></p>
            <p>📍 Garkheda, Chhatrapati Sambhaji Nagar | ☎ +91 98908 86002</p>
            <div style="margin-top: 10px;">
              <a href="#" style="margin: 0 8px; color: #E1306C;">Instagram</a> |
              <a href="#" style="margin: 0 8px; color: #1877F2;">Facebook</a> |
              <a href="#" style="margin: 0 8px; color: #0077B5;">LinkedIn</a>
            </div>
          </div>
        </div>
      `,
    };

    await sendMail('shubhamrut16@gmail.com', subject || 'New Contact Form Submission', mailOptions.html);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

app.get('/about', (req, res) => {
  res.render('listings/about');
});

app.get('/gallery', async (req, res) => {
  try {
    const { type, category } = req.query;
    const query = {
      ListingType: { $in: ['gallery', 'both'] },
    };
    if (type) query.type = type;
    if (category) query.category = category;
    const listings = await Listing.find(query).select('Name type category images location description');
    res.render('listings/gallery', { listings, type, category });
  } catch (error) {
    console.error('Error fetching gallery listings:', error);
    res.render('listings/error', { title: 'Failed to load gallery listings. Please try again later.' });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const { type, category } = req.query;
    const query = {
      ListingType: { $in: ['projects'] },
    };
    if (type) query.type = type;
    if (category) query.category = category;
    const projects = await Listing.find(query).select('Name type category images location description');
    res.render('listings/projects', { projects, type, category });
  } catch (error) {
    console.error('Error fetching project listings:', error);
    res.render('listings/error', { title: 'Failed to load projects. Please try again later.' });
  }
});

app.get('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || !['gallery', 'both', 'projects'].includes(listing.ListingType)) {
      return res.render('listings/error', { title: 'Listing not found or not available in gallery.' });
    }
    res.render('listings/listingShow', { listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.render('listings/error', { title: 'Failed to load listing. Please try again later.' });
  }
});

// Admin Routes
let verified = 0;
const secretkey = 123456;

app.get('/admin', (req, res) => {
  res.render('listings/admin');
});

app.post('/verify-secret', (req, res) => {
  const { secretCode } = req.body;
  if (secretCode == secretkey) {
    verified = 1;
    res.redirect('/admin/listings');
  } else {
    res.render('listings/admin', { error: 'Invalid secret code' });
  }
});

app.get('/admin/listings', async (req, res) => {
  if (verified === 0) {
    res.render('listings/admin', { error: 'Please verify your secret code' });
    return;
  }
  try {
    const listings = await Listing.find();
    res.render('listings/adminAllListings', { listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.render('listings/error', { title: 'Failed to load listings. Please try again later.' });
  }
});

app.get('/admin/listings/new', (req, res) => {
  if (verified === 0) {
    res.render('listings/admin', { error: 'Please verify your secret code' });
    return;
  }
  res.render('listings/adminCreateListing');
});

app.post(
  '/admin/listings',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  async (req, res) => {
    if (verified === 0) {
      res.render('listings/admin', { error: 'Please verify your secret code' });
      return;
    }
    try {
      const { name, type, category, description, location, listingType } = req.body;
      const images = [];

      const uploadPromises = ['image1', 'image2', 'image3']
        .filter((field) => req.files[field])
        .map(async (field) => {
          const file = req.files[field][0];
          const start = Date.now();
          const result = await uploadOnCloudinary(file.buffer, {
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
            width: 1920,
            crop: 'limit',
          });
          console.log(`Uploaded ${field} in ${(Date.now() - start) / 1000} seconds`);
          if (result) {
            return {
              url: result.secure_url,
              filename: result.public_id,
            };
          }
          return null;
        });

      const uploadResults = await Promise.all(uploadPromises);
      images.push(...uploadResults.filter((result) => result !== null));

      const newListing = new Listing({
        Name: name,
        type: type,
        category: category,
        description: description,
        ListingType: listingType.toLowerCase(),
        images: images,
        location: location,
      });

      await newListing.save();
      res.redirect('/admin/listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      res.render('listings/error', { title: 'Failed to create listing. Please try again later.' });
    }
  }
);

app.get('/admin/listings/show/:id', async (req, res) => {
  if (verified === 0) {
    res.render('listings/admin', { error: 'Please verify your secret code' });
    return;
  }
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.render('listings/error', { title: 'Listing not found.' });
    }
    res.render('listings/show', { listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.render('listings/error', { title: 'Failed to load listing. Please try again later.' });
  }
});

app.get('/admin/listings/edit/:id', async (req, res) => {
  if (verified === 0) {
    res.render('listings/admin', { error: 'Please verify your secret code' });
    return;
  }
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.render('listings/error', { title: 'Listing not found.' });
    }
    res.render('listings/edit', { listing });
  } catch (error) {
    console.error('Error fetching listing for edit:', error);
    res.render('listings/error', { title: 'Failed to load listing. Please try again later.' });
  }
});

app.put(
  '/admin/listings/:id',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  async (req, res) => {
    if (verified === 0) {
      res.render('listings/admin', { error: 'Please verify your secret code' });
      return;
    }
    try {
      const { id } = req.params;
      const { name, type, category, description, location, listingType, deleteImages } = req.body;
      const listing = await Listing.findById(id);
      if (!listing) {
        return res.render('listings/error', { title: 'Listing not found.' });
      }

      // Delete selected images from Cloudinary
      if (deleteImages) {
        const deleteArray = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
        for (const filename of deleteArray) {
          await cloudinary.uploader.destroy(filename);
          listing.images = listing.images.filter((image) => image.filename !== filename);
        }
      }

      // Upload new images
      const images = listing.images;
      const uploadPromises = ['image1', 'image2', 'image3']
        .filter((field) => req.files[field])
        .map(async (field) => {
          const file = req.files[field][0];
          const result = await uploadOnCloudinary(file.buffer, {
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
            width: 1920,
            crop: 'limit',
          });
          if (result) {
            return {
              url: result.secure_url,
              filename: result.public_id,
            };
          }
          return null;
        });

      const uploadResults = await Promise.all(uploadPromises);
      images.push(...uploadResults.filter((result) => result !== null));

      // Update listing fields
      listing.Name = name;
      listing.type = type;
      listing.category = category;
      listing.description = description;
      listing.location = location;
      listing.ListingType = listingType.toLowerCase();
      listing.images = images;

      await listing.save();
      res.redirect('/admin/listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      res.render('listings/error', { title: 'Failed to update listing. Please try again later.' });
    }
  }
);

app.delete('/admin/listings/:id', async (req, res) => {
  if (verified === 0) {
    res.render('listings/admin', { error: 'Please verify your secret code' });
    return;
  }
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.render('listings/error', { title: 'Listing not found.' });
    }

    // Delete all images from Cloudinary
    for (const image of listing.images) {
      await cloudinary.uploader.destroy(image.filename);
    }

    // Delete listing from MongoDB
    await Listing.findByIdAndDelete(id);
    res.redirect('/admin/listings');
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.render('listings/error', { title: 'Failed to delete listing. Please try again later.' });
  }
});

app.get('/logout', (req, res) => {
  verified = 0;
  res.render('listings/admin');
});

// Start server
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();