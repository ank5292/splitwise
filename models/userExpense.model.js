module.exports = (sequelize, Sequelize) => {
    const UserExpense = sequelize.define("user_expense", {
      name: {
        type: Sequelize.STRING
      },
      paidUserId: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.INTEGER
      },
      expenseType: {
        type: Sequelize.STRING
      },
      groupId: {
        type: Sequelize.STRING
      }
    });
  
    return UserExpense;
  };
  