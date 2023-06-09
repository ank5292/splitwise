const { async } = require("q");
const db = require("../models");
const UserExpense = db.userExpense;
const UserSplit = db.userSplit;
const Op = db.Sequelize.Op;
const AppUser = db.appUser;
const UserGroup = db.userGroup


function getErrorBody(message){
    return {
        responseStatus : 'ERROR',
        details:{
            message 
        }
    }
}

function createExpenseObject (req){
    
    return {
        name: req.body.name,
        paidUserId: req.body.paidUserId,
        amount : req.body.amount,
        expenseType : req.body.expenseType,
        groupId : req.body.groupId
      };
}


createSplitObjects = async (expense,receivers) => {
    console.log("enter here")
    console.log(receivers)
    let userSplits=[]

    if(expense.expenseType == 'EQUAL'){

        let splitedamount = parseFloat(parseInt(expense.amount)/receivers.length).toFixed(2);
        for(let i=0;i<receivers.length;i++){

            let userDetails = await AppUser.findByPk(receivers[i].toString())
            if(!userDetails) return {error : `user with ${receivers[i]} is invalid`}

            let userGroup
            if(expense.groupId){
                userGroup = await UserGroup.findAll({where: { userId :userDetails.id.toString(), groupId : expense.groupId.toString() }})
                if(!userGroup) return {error : `user is with userId ${userDetails.id} is not present in ${expense.groupId}`}
            }
            const userSplit = {
                expenseId : expense.id,
                paidUserId : expense.paidUserId,
                receivedUserId : userDetails.id,
                amount : splitedamount,
                groupId : expense.groupId
            }

            userSplits.push(userSplit)
        }

      }else if(expense.expenseType == 'UNEQUAL'){

        let totalAmount = 0;
        for(let i=0;i<receivers.length;i++){

            let userDetails = await AppUser.findByPk(receivers[i].userId.toString())
            if(!userDetails) return {error : `user with ${receivers[i].userId} is invalid`}

            let userGroup
            if(expense.groupId){
                userGroup = await UserGroup.findAll({where: { userId :userDetails.id.toString(), groupId : expense.groupId.toString() }})
                if(!userGroup) return {error : `user is with userId ${userDetails.id} is not present in ${expense.groupId}`}
            }
            totalAmount = totalAmount + parseFloat(receivers[i].amount)
            const userSplit = {
                expenseId : expense.id,
                paidUserId : expense.paidUserId,
                receivedUserId : userDetails.id,
                amount : receivers[i].amount,
                groupId : expense.groupId
            }

            userSplits.push(userSplit)
        }

        if(totalAmount != expense.amount) return {error : 'split amount mismatched with total amount'}

      }else if(expense.expenseType == 'PERCENTAGE'){


        
        let totalPerctange =0
        for(let i=0;i<receivers.length;i++){

            let userDetails = await AppUser.findByPk(receivers[i].userId.toString())
            if(!userDetails) return {error : `user with ${receivers[i].userId} is invalid`}
    
            let userGroup
            if(expense.groupId){
                userGroup = await UserGroup.findAll({where: { userId :userDetails.id.toString(), groupId : expense.groupId.toString() }})
                if(!userGroup) return {error : `user is with userId ${userDetails.id} is not present in ${expense.groupId}`}
            }
            let splitedamount = parseFloat((parseInt(expense.amount)* parseInt(receivers[i].percentage))/100.00).toFixed(2);
            console.log(splitedamount)
            const userSplit = {
                expenseId : expense.id,
                paidUserId : expense.paidUserId,
                receivedUserId : userDetails.id,
                amount : splitedamount,
                groupId : expense.groupId
            }
            totalPerctange = totalPerctange + parseFloat(receivers[i].percentage)

            userSplits.push(userSplit)
        } 
        if(totalPerctange != 100 ) return { error : 'Percentange not sum up to 100'}
      }
      

    return userSplits
}




// Create and Save a new Expense
exports.create = async (req, res) => {
  
    let reqBody = req.body;
    if(!reqBody?.name){
        return res.status(400).send(getErrorBody("name field should present in request body"))   
    }
    if(!reqBody?.paidUserId){
        return res.status(400).send(getErrorBody("paidUserId should present in request body"))   
    }
    let paidUserDetail = await AppUser.findByPk(reqBody?.paidUserId?.toString())
    if(!paidUserDetail) return res.status(400).send(getErrorBody("paidUserId is invalid id"))

    if(!reqBody?.receiverUserIds){
        return res.status(400).send(getErrorBody("receiver users id field should present in request body"))   
    }
    if(!reqBody?.amount || !parseInt(reqBody?.amount)){
        return res.status(400).send(getErrorBody("amount field should present in request body or should be in correct"))   
    }
    if(!reqBody?.expenseType){
        return res.status(400).send(getErrorBody("expense type field should present in request body"))   
    }
    
    const userExpense = createExpenseObject(req)

    let data = await UserExpense.create(userExpense)
    let expense = data.dataValues
    let userSplits = await createSplitObjects(expense,req.body.receiverUserIds)

    if(userSplits.error) return res.status(400).send(getErrorBody(userSplits.error)) 

    for(let i=0;i<userSplits.length;i++){

        await UserSplit.create(userSplits[i])
    }


      res.status(200).send({
        responseStatus : "SUCCESS",
        data :expense
      })

  };



// Find a single Tutorial with an id
exports.findOne = async (req, res) => {
    if(!req.params.id) return res.status(400).send(getErrorBody("expense id is not present in query"))
    const id = req.params.id;
  
    let data = await UserExpense.findByPk(id)

    if(!data) return res.status(404).send(getErrorBody(`expense is not found with ${id}`))
    let userExpense = data.dataValues
    let paidUserDetails = await AppUser.findByPk(userExpense.paidUserId)
    userExpense.paidUserName = paidUserDetails.name

    let splits = await UserSplit.findAll({
        where: { expenseId : id}
      })

    let splitArray = []
    for(let i=0;i<splits.length;i++){
        receivedUserIdDetails = await AppUser.findByPk(splits[i].receivedUserId)
        splitArray.push({
            amount : splits[i].amount,
            paidUserId : paidUserDetails.id,
            paidUserName : paidUserDetails.name,
            receivedUserId :receivedUserIdDetails.id,
            receivedUserName : receivedUserIdDetails.name
        })
    }

    userExpense.splits = splitArray
    res.send({
        responseStatus : "SUCCESS",
        data : userExpense
    })
  };


// Update a Expense by the id in the request
exports.update = async (req, res) => {
    if(!req.params.id) return res.status(400).send(getErrorBody("expense id is not present in query")) 
    const expenseId = req.params.id
    let userExpense = createExpenseObject(req);
    await UserExpense.update(userExpense, {
        where: { id: expenseId }
    })
    userExpense.id = expenseId
    let userSplits = await createSplitObjects(userExpense,req.body.receiverUserIds)
    if(userSplits.error) return res.status(400).send(getErrorBody(userSplits.error)) 
    for(let i=0;i<userSplits.length;i++){
        console.log(userSplits[i])
        await UserSplit.upsert(userSplits[i])
    }

    let removedUser = req.body.removedUserIds

    for(let i =0;i<removedUser.length;i++){
        this.deleteUserSplit(removedUser[i],expenseId)
    }

    res.send({
        responseStatus : "SUCCESS",
        data : {
            message : "Expense is updated"
        }
    })
  };

exports.delete = (req,res) => {
    
    if(!req.params.id) return res.status(400).send(getErrorBody("expense id is not present in query")) 
    UserExpense.destroy({
        where: { id : req.params.id}
      })
        .then(num => {
          console.log("UserExpense is deleted "+ req.params.id)
        })
        .catch(err => {
          console.log("cannot delete the user "+err)
    });

    UserSplit.destroy({
        where: { expenseId : req.params.id}
      })
        .then(num => {
          console.log("UserSplit is deleted "+ req.params.id)
        })
        .catch(err => {
          console.log("cannot delete the user "+err)
    });
    
    res.send({
        responseStatus : "SUCCESS",
        data : {
            message : "Expense is Deleted"
        }
    })
};


// Delete a Tutorial with the specified id in the request
exports.deleteUserSplit = (receivedUserId,expenseId) => {
  
    UserSplit.destroy({
      where: { receivedUserId: receivedUserId.toString() , expenseId : expenseId}
    })
      .then(num => {
        console.log("Split is deleted "+ receivedUserId)
      })
      .catch(err => {
        console.log("cannot delete the user "+err)
      });
  };
