module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'b3e2e358e12d9e3572100289fd2f977d'),
  },
});
