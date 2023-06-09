module.exports = (sequelize, Sequelize) => {
    const UserGroup = sequelize.define("group_user", {
      userId: {
        type: Sequelize.STRING
      },
      groupId: {
        type: Sequelize.STRING
      }
    });
  
    return UserGroup;
  };
  