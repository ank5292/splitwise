const express = require('express')
const db = require('./models/index');
const  appUser = require("./controllers/appuser.controller");
const  userExpense = require("./controllers/userExpense.controller");
const  group = require("./controllers/group.controller");
const cors = require("cors");

const app = express();

const port = 3001;

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
app.use(express.json());


db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });


// user routes
app.get('/api/v1/users/:id',appUser.findOne)
app.post('/api/v1/users',appUser.create)
app.put('/api/v1/users/:id',appUser.update)
app.delete('/api/v1/users/:id',appUser.delete)

app.get('/api/v1/user/:id/balancesheet', appUser.getBalanceSheetOfUser)

//user group routes
app.get('/api/v1/user/:userId/groups',group.getAllGroupOfUser) // get all the groups of user
app.post('/api/v1/user/:userId/groups',group.create) // create the group by user

app.get('/api/v1/user/:userId/groups/:groupId',group.getGroupDetails) // get the group details
app.put('/api/v1/user/:userId/groups/:groupId',group.updateGroup) // update the group details
app.delete('/api/v1/user/:userId/groups/:groupId',group.deleteGroup) // delete the group

app.post('/api/v1/user/:userId/groups/:groupId/users',group.addOrRemoveUserFromGroup)  // add or delete user

app.get('/api/v1/user/:userId/groups/:groupId/expenses',group.getAllExpenseOfGroup) // get all the expense of group
app.post('/api/v1/user/:userId/groups/:groupId/expenses',group.addExpensetoGroup)  // add expenses of group

app.get('/api/v1/user/:userId/groups/:groupId/balancesheet',group.getBalanceSheetOfUserInGroup) // get balance sheet of user from group


// expense route
app.get('/api/v1/expenses/:id',userExpense.findOne)
app.post('/api/v1/expenses',userExpense.create)
app.put('/api/v1/expenses/:id',userExpense.update)
app.delete('/api/v1/expenses/:id',userExpense.delete)


// will start the server 
app.listen(port ,() =>{
    console.log(`App running on port ${port}`);
    
}); 


 