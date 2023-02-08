const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    users: async () => {
      return await User.find({}).populate('savedBooks');
    },
    user: async (parent, args, context) => {
        if (!context.user) throw new AuthenticationError('Please log in!');
        return await User.findById(context.user._id);
    },
	},

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
			return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
		saveBook: async (parent, args, context) => {
			if (!context.user) throw new AuthenticationError('Please log in!');
			const user = await User.findById(context.user._id);
			user.savedBooks.push({ ...args });
			await user.save();
			return user;
		},
    deleteBook: async (parent, {bookId}, context) => {
      if (!context.user) throw new AuthenticationError('Please log in!');
      const user = await User.findById(context.user._id);

      for (let i = 0; i < user.savedBooks.length; i++) {
        if (user.savedBooks[i].bookId === bookId) {
          user.savedBooks.splice(i, 1);
          await user.save();
          return user;
        }
      }
    }
  }
};

module.exports = resolvers;