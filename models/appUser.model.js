module.exports = (sequelize, Sequelize) => {
    const AppUser = sequelize.define("app_user", {
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      }
    });
  
    return AppUser;
  };
  