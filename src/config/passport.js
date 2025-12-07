// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { prisma } from './database.js';
// import logger from './logger.js';
//
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });
//
// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         role: true,
//         status: true,
//       },
//     });
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });
//
// // Google OAuth Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
//     passReqToCallback: true,
//   },
//   async (req, accessToken, refreshToken, profile, done) => {
//     try {
//       // Check if user already exists
//       let user = await prisma.user.findUnique({
//         where: { email: profile.emails[0].value },
//       });
//
//       if (!user) {
//         // Create new user
//         user = await prisma.user.create({
//           data: {
//             email: profile.emails[0].value,
//             firstName: profile.name.givenName,
//             lastName: profile.name.familyName,
//             avatar: profile.photos[0]?.value,
//             provider: 'GOOGLE',
//             providerId: profile.id,
//             emailVerified: true,
//             status: 'ACTIVE',
//           },
//         });
//         logger.info(`New user created via Google: ${user.email}`);
//       } else {
//         // Update existing user if needed
//         if (user.provider !== 'GOOGLE' || user.providerId !== profile.id) {
//           user = await prisma.user.update({
//             where: { id: user.id },
//             data: {
//               provider: 'GOOGLE',
//               providerId: profile.id,
//               avatar: profile.photos[0]?.value || user.avatar,
//             },
//           });
//         }
//       }
//
//       // Update last seen
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { lastSeen: new Date() },
//       });
//
//       return done(null, user);
//     } catch (error) {
//       logger.error('Google OAuth error:', error);
//       return done(error, null);
//     }
//   }
// ));
//
// export default passport;