const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { User, getUserByEmail, getUserById } = require('./models/User.js');
const flash = require('connect-flash');
const { getMaxListeners } = require('./models/Transactions.js');

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
        // Authenticate by email
        const user = await getUserByEmail(email);

        if (!user) {
            return done(null, false, { message: 'No user with that email found', flash: 'No user with that email found' });
        }

        // Check if the password is correct
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            // Redirect to '/admin' if the user is 'mohanoork1@gmail.com'
            if (user.email === 'mohanoork1@gmail.com') {
                return done(null, user, { message: 'Login successful', redirectUrl: '/admin' });
            } else {
                return done(null, user, { message: 'Login successful', redirectUrl: '/buses' });
            }
        } else {
            return done(null, false, { message: 'Incorrect password', flash: 'Incorrect password' });
        }
    } catch (error) {
        return done(error);
    }
};

  

  // Use the Local Strategy with Passport
  passport.use(new localStrategy({ usernameField: 'email' }, authenticateUser));

  // Serialize user to store in the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    done(null, user);
  });
}

module.exports = initialize;
