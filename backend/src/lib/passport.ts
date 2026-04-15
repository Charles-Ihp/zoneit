import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma";

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
            },
            create: {
              googleId: profile.id,
              email: profile.emails![0].value,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
            },
          });
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}
