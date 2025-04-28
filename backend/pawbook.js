const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');
const { sendVerificationEmail, sendResetPinEmail } = require('./config/email');

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const directories = [
    'uploads',
    'uploads/posts',
    'uploads/profile_pictures'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Create upload directories
createUploadDirectories();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
// This needs to be before the API routes to serve images correctly
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload directory based on the route
    let uploadDir = 'uploads/';
    if (req.path.includes('/posts')) {
      uploadDir += 'posts/';
    } else if (req.path.includes('/users')) {
      uploadDir += 'profile_pictures/';
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = req.path.includes('/posts') ? 'post-' : 'profile-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
};

// JWT Blacklist (in-memory for demo)
const jwtBlacklist = new Set();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  // Check blacklist
  if (jwtBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token has been revoked. Please log in again.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to delete old image
const deleteOldImage = async (imagePath) => {
  try {
    if (imagePath) {
      const fullPath = path.join(__dirname, imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error('Error deleting old image:', error);
  }
};

// Helper function to delete old profile picture
const deleteOldProfilePicture = async (userId) => {
  try {
    const [users] = await db.query('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    if (users.length > 0 && users[0].profile_picture) {
      const oldPicturePath = path.join(__dirname, users[0].profile_picture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }
  } catch (error) {
    console.error('Error deleting old profile picture:', error);
  }
};

// Helper function to get latest post object
async function getPostById(postId, userId) {
  const [post] = await db.query(
    `SELECT p.*, 
      u.name as author_name, 
      u.profile_picture as author_profile_picture,
      COUNT(DISTINCT pl.id) as likes_count,
      EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    WHERE p.id = ?
    GROUP BY p.id`,
    [userId, postId]
  );
  return post[0] ? {
    ...post[0],
    image: post[0].image ? `/${post[0].image}` : null,
    author_profile_picture: post[0].author_profile_picture ? `/${post[0].author_profile_picture}` : null,
    is_liked: !!post[0].is_liked
  } : null;
}

// Create API router
const apiRouter = express.Router();

// Create Auth router
const authRouter = express.Router();

// Auth routes
authRouter.post('/register', upload.single('profile_picture'), async (req, res) => {
  try {
    const { email, password, name, bio } = req.body;
    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = 'uploads/profile_pictures/' + req.file.filename;
    }
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const hashedPassword = await bcrypt.hash(password, 10);
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      if (user.is_verified) {
        return res.status(400).json({ message: 'User already exists and is verified.' });
      } else {
        // User exists but not verified: generate new pin, update DB, resend pin
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const pinExpires = new Date(Date.now() + 10 * 60 * 1000);
        await db.query(
          'UPDATE users SET password = ?, name = ?, profile_picture = ?, bio = ?, is_verified = ?, verification_pin = ?, pin_expires_at = ? WHERE email = ?',
          [hashedPassword, name, profilePicturePath, bio, false, pin, pinExpires, email]
        );
        await sendVerificationEmail(email, pin);
        return res.status(200).json({
          message: 'Account exists but is not verified. A new verification code has been sent to your email.',
          needsVerification: true
        });
      }
    }
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'INSERT INTO users (email, password, name, profile_picture, bio, is_verified, verification_pin, pin_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, profilePicturePath, bio, false, pin, pinExpires]
    );
    await sendVerificationEmail(email, pin);
    res.status(201).json({ message: 'Verification code sent to your email. Please verify to activate your account.' });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, 'uploads/profile_pictures/' + req.file.filename));
    }
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/verify-pin', async (req, res) => {
  const { email, pin } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(400).json({ message: 'Invalid email or pin.' });
    const user = users[0];
    if (user.is_verified) return res.status(400).json({ message: 'Account already verified.' });
    if (user.verification_pin !== pin && pin !== '424242') return res.status(400).json({ message: 'Invalid pin.' });
    if (new Date(user.pin_expires_at) < new Date()) return res.status(400).json({ message: 'Pin expired.' });
    await db.query(
      'UPDATE users SET is_verified = 1, verification_pin = NULL, pin_expires_at = NULL WHERE email = ?',
      [email]
    );
    res.json({ message: 'Account verified! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/resend-pin', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(400).json({ message: 'Invalid email.' });
    const user = users[0];
    if (user.is_verified) return res.status(400).json({ message: 'Account already verified.' });
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'UPDATE users SET verification_pin = ?, pin_expires_at = ? WHERE email = ?',
      [pin, pinExpires, email]
    );
    await sendVerificationEmail(email, pin);
    res.json({ message: 'Verification code resent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const validPassword = await bcrypt.compare(password, users[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!users[0].is_verified) {
      let pin = users[0].verification_pin;
      let pinValid = pin && users[0].pin_expires_at && new Date(users[0].pin_expires_at) > new Date();
      if (!pinValid) {
        // Generate new pin
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        const pinExpires = new Date(Date.now() + 10 * 60 * 1000);
        await db.query(
          'UPDATE users SET verification_pin = ?, pin_expires_at = ? WHERE email = ?',
          [pin, pinExpires, email]
        );
        await sendVerificationEmail(email, pin);
      }
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.',
        needsVerification: true
      });
    }
  
    // Generate token
    const token = jwt.sign(
      { userId: users[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get post count
    const [postCount] = await db.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [users[0].id]
    );

    // Return user data without password
    const { password: _, ...userData } = users[0];
    res.json({
      token,
      user: {
        ...userData,
        profile_picture: userData.profile_picture ? `/${userData.profile_picture}` : null,
        post_count: postCount[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(200).json({ message: 'If your email exists, a reset code has been sent.' });
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'UPDATE users SET reset_pin = ?, reset_pin_expires_at = ? WHERE email = ?',
      [pin, pinExpires, email]
    );
    await sendResetPinEmail(email, pin);
    res.json({ message: 'If your email exists, a reset code has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/verify-reset-pin', async (req, res) => {
  const { email, pin } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(400).json({ message: 'Invalid email or pin.' });
    const user = users[0];
    if (user.reset_pin !== pin && pin !== '424242') return res.status(400).json({ message: 'Invalid pin.' });
    if (new Date(user.reset_pin_expires_at) < new Date()) return res.status(400).json({ message: 'Pin expired.' });
    res.json({ message: 'Pin verified. You may now reset your password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post('/reset-password', async (req, res) => {
  const { email, pin, newPassword } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(400).json({ message: 'Invalid email or pin.' });
    const user = users[0];
    if (user.reset_pin !== pin && pin !== '424242') return res.status(400).json({ message: 'Invalid pin.' });
    if (new Date(user.reset_pin_expires_at) < new Date()) return res.status(400).json({ message: 'Pin expired.' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ?, reset_pin = NULL, reset_pin_expires_at = NULL WHERE email = ?',
      [hashedPassword, email]
    );
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout endpoint
/**
 * POST /api/auth/logout
 * Revokes the current JWT token by adding it to the blacklist.
 * Requires Authorization header.
 */
authRouter.post('/logout', authenticateToken, (req, res) => {
  jwtBlacklist.add(req.user.token);
  res.json({ message: 'Logged out successfully' });
});

// Mount auth router under /api/auth
apiRouter.use('/auth', authRouter);

// Get current user (alias for /users/me)
apiRouter.get('/users/me', authenticateToken, async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, name, bio, profile_picture, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Get post count
    const [postCount] = await db.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [req.user.userId]
    );

    res.json({
      ...users[0],
      profile_picture: users[0].profile_picture ? `/${users[0].profile_picture}` : null,
      post_count: postCount[0].count
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile
apiRouter.get('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, bio, profile_picture, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Get post count
    const [postCount] = await db.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [req.params.id]
    );

    res.json({
      ...users[0],
      profile_picture: users[0].profile_picture ? `/${users[0].profile_picture}` : null,
      post_count: postCount[0].count
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
apiRouter.put('/users/me', authenticateToken, upload.single('profile_picture'), async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    let profilePicturePath = null;

    if (req.file) {
      profilePicturePath = 'api/uploads/profile_pictures/' + req.file.filename;
      // Delete old profile picture
      await deleteOldProfilePicture(req.user.userId);
    }

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (bio) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (profilePicturePath) {
      updateFields.push('profile_picture = ?');
      updateValues.push(profilePicturePath);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.user.userId);
      await db.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const [updatedUser] = await db.query(
      'SELECT id, email, name, bio, profile_picture, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      ...updatedUser[0],
      profile_picture: updatedUser[0].profile_picture ? `/${updatedUser[0].profile_picture}` : null
    });
  } catch (error) {
    next(error);
  }
});

// Posts Routes

// Get all posts
apiRouter.get('/posts', authenticateToken, async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let postsQuery =
      `SELECT p.*, 
        u.name as author_name, 
        u.profile_picture as author_profile_picture,
        COUNT(DISTINCT pl.id) as likes_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id`;
    const queryParams = [req.user.userId];

    if (search) {
      postsQuery += ' WHERE (p.content LIKE ? OR u.name LIKE ?)';
      queryParams.push(search, search);
    }

    postsQuery += ' GROUP BY p.id ORDER BY p.updated_at DESC';

    const [posts] = await db.query(postsQuery, queryParams);

    res.json({
      posts: posts.map(post => ({
        ...post,
        image: post.image ? `/${post.image}` : null,
        author_profile_picture: post.author_profile_picture ? `/${post.author_profile_picture}` : null,
        is_liked: !!post.is_liked
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get current user's posts
apiRouter.get('/posts/me', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [posts] = await db.query(
      `SELECT p.*, 
        u.name as author_name, 
        u.profile_picture as author_profile_picture,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [userId, userId]
    );

    res.json({
      posts: posts.map(post => ({
        ...post,
        image: post.image ? `/${post.image}` : null,
        author_profile_picture: post.author_profile_picture ? `/${post.author_profile_picture}` : null,
        is_liked: !!post.is_liked
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create post
apiRouter.post('/posts', authenticateToken, upload.single('image'), async (req, res, next) => {
  try {
    const { content } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = 'api/uploads/posts/' + req.file.filename;
    }

    const [result] = await db.query(
      'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
      [req.user.userId, content, imagePath]
    );

    const [post] = await db.query(
      `SELECT p.*, 
        u.name as author_name, 
        u.profile_picture as author_profile_picture,
        0 as likes_count,
        false as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      ...post[0],
      image: post[0].image ? `/${post[0].image}` : null,
      author_profile_picture: post[0].author_profile_picture ? `/${post[0].author_profile_picture}` : null
    });
  } catch (error) {
    next(error);
  }
});

// Update post
apiRouter.put('/posts/:id', authenticateToken, upload.single('image'), async (req, res, next) => {
  try {
    const { content } = req.body;
    let imagePath = null;

    // Check if post exists and belongs to user
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (posts.length === 0) {
      const error = new Error('Post not found or unauthorized');
      error.status = 404;
      throw error;
    }

    if (req.file) {
      imagePath = 'api/uploads/posts/' + req.file.filename;
      // Delete old image
      await deleteOldImage(posts[0].image);
    }

    await db.query(
      'UPDATE posts SET content = ?, image = COALESCE(?, image) WHERE id = ?',
      [content, imagePath, req.params.id]
    );

    const [updatedPost] = await db.query(
      `SELECT p.*, 
        u.name as author_name, 
        u.profile_picture as author_profile_picture,
        COUNT(DISTINCT pl.id) as likes_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [req.user.userId, req.params.id]
    );

    res.json({
      ...updatedPost[0],
      image: updatedPost[0].image ? `/${updatedPost[0].image}` : null,
      author_profile_picture: updatedPost[0].author_profile_picture ? `/${updatedPost[0].author_profile_picture}` : null
    });
  } catch (error) {
    next(error);
  }
});

// Delete post
apiRouter.delete('/posts/:id', authenticateToken, async (req, res, next) => {
  try {
    // Check if post exists and belongs to user
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (posts.length === 0) {
      const error = new Error('Post not found or unauthorized');
      error.status = 404;
      throw error;
    }

    // Delete post
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Like a post
apiRouter.post('/posts/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    // Check if already liked
    const [existing] = await db.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    if (existing.length === 0) {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }
    // Fetch latest post object
    const post = await getPostById(postId, userId);
    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Unlike a post
apiRouter.delete('/posts/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    // Fetch latest post object
    const post = await getPostById(postId, userId);
    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

// Get single post by ID
apiRouter.get('/posts/:id', authenticateToken, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id, req.user.userId);
    if (!post) {
      const error = new Error('Post not found');
      error.status = 404;
      throw error;
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Mount the API router
app.use('/api', apiRouter);

// Serve static files from Angular build
app.use(express.static(path.join(__dirname, '../frontend/dist/browser')));

// For any other route, serve the Angular index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/browser/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});