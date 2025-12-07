// import express from 'express';
// const router = express.Router();
// import passport from '../config/passport.js';
// import jwt from 'jsonwebtoken';
// import { authenticate } from '../middleware/auth.js';
//
// // Generate tokens for social auth
// const generateTokens = (userId) => {
//   const accessToken = jwt.sign(
//     { userId },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRES_IN }
//   );
//
//   const refreshToken = jwt.sign(
//     { userId },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
//   );
//
//   return { accessToken, refreshToken };
// };
//
// // ==================== GOOGLE OAUTH ====================
// router.get('/google',
//   passport.authenticate('google', {
//     scope: ['profile', 'email'],
//     session: false,
//   })
// );
//
// router.get('/google/callback',
//   passport.authenticate('google', {
//     failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
//     session: false,
//   }),
//   async (req, res) => {
//     try {
//       const tokens = generateTokens(req.user.id);
//
//       // Redirect to frontend with tokens
//       res.redirect(
//         `${process.env.CLIENT_URL}/auth/callback?` +
//         `access_token=${tokens.accessToken}&` +
//         `refresh_token=${tokens.refreshToken}&` +
//         `user_id=${req.user.id}`
//       );
//     } catch (error) {
//       res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
//     }
//   }
// );
//
// // ==================== LINK/UNLINK SOCIAL ACCOUNTS ====================
// router.post('/link/google', authenticate, async (req, res) => {
//   try {
//     const { accessToken } = req.body;
//     const userId = req.user.id;
//
//     // Verify Google token and get profile
//     // In production, use Google API to verify token and get profile
//     // For now, we'll assume the frontend sends the profile
//
//     const { profile } = req.body;
//
//     if (!profile || !profile.email) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid profile data',
//       });
//     }
//
//     // Check if Google account is already linked to another user
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         provider: 'GOOGLE',
//         providerId: profile.id,
//         id: { not: userId },
//       },
//     });
//
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: 'This Google account is already linked to another user',
//       });
//     }
//
//     // Update user with Google provider info
//     const user = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         provider: 'GOOGLE',
//         providerId: profile.id,
//         avatar: profile.picture || undefined,
//         emailVerified: true,
//       },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         provider: true,
//       },
//     });
//
//     res.json({
//       success: true,
//       data: { user },
//       message: 'Google account linked successfully',
//     });
//   } catch (error) {
//     logger.error('Link Google account error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to link Google account',
//     });
//   }
// });
//
// router.post('/unlink/google', authenticate, async (req, res) => {
//   try {
//     const userId = req.user.id;
//
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });
//
//     if (!user || user.provider !== 'GOOGLE') {
//       return res.status(400).json({
//         success: false,
//         error: 'Google account is not linked',
//       });
//     }
//
//     // Require user to set a password before unlinking
//     if (!user.password) {
//       return res.status(400).json({
//         success: false,
//         error: 'Please set a password before unlinking Google account',
//       });
//     }
//
//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: {
//         provider: 'LOCAL',
//         providerId: null,
//       },
//       select: {
//         id: true,
//         email: true,
//         provider: true,
//       },
//     });
//
//     res.json({
//       success: true,
//       data: { user: updatedUser },
//       message: 'Google account unlinked successfully',
//     });
//   } catch (error) {
//     logger.error('Unlink Google account error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to unlink Google account',
//     });
//   }
// });
//
// export default router;