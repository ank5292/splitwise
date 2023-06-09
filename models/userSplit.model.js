module.exports = (sequelize, Sequelize) => {
    const UserSplit = sequelize.define("user_split", {
      expenseId: {
        type: Sequelize.STRING
      },
      paidUserId: {
        type: Sequelize.STRING
      },
      receivedUserId:{
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.INTEGER
      },
      groupId: {
        type: Sequelize.STRING
      }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['expenseId', 'receivedUserId']
            }
        ]
    });
  
    return UserSplit;
  };
  