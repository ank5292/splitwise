const { async } = require("q");
const db = require("../models");
const { where } = require("sequelize");
const expenseController = require("./userExpense.controller");
const AppUser = db.appUser;
const Group = db.group;
const UserGroup = db.userGroup;
const UserExpense = db.userExpense;
const UserSplit = db.userSplit;
const Sequelize = require("sequelize");


function getErrorBody(message){
    return {
        responseStatus : 'ERROR',
        details:{
            message 
        }
    }
}
// Create and Save a new Tutorial
exports.create = async (req,res) => {
  
    let reqBody = req.body;
    if(!reqBody?.name){
        return res.status(400).send(getErrorBody("name field should present in request body"))   
    }
    // api/v1/user/:userId/groups
    const userId = req.params.userId
    let data = await AppUser.findByPk(userId)
    if(!data){
        return res.status(400).send(getErrorBody(`invalid user`))
    }
  
    // Save group in the database
    data = await Group.create(req.body)
    let group = data.dataValues
    await UserGroup.create({
        userId : userId,
        groupId : group.id
    })

    res.send({
     responseStatus :"SUCCESS",
     data : group   
    })
  };

exports.getAllGroupOfUser = async (req,res) =>{

    const userId = req.params.userId
    let data = await AppUser.findByPk(userId)
    if(!data){
        return res.status(400).send(getErrorBody(`invalid user`))
    }

    let userGroups = await UserGroup.findAll({where: { userId : userId }})
    
    let groups = []
    for(let i =0 ;i<userGroups?.length;i++){
        let group = await Group.findByPk(userGroups[i].groupId);
        console.log(group)
        groups.push({
            name : group.name,
            id : group.id
        })
    }

    res.send({
        responseStatus :"SUCCESS",
        data : groups
    })
}

// app.get('/api/v1/user/:userId/groups/:groupId') // get the group details
exports.getGroupDetails = async (req,res) => {

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    let groupDetail = data
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))

    let userGroups = await UserGroup.findAll({where: { groupId }})

    let userDetails = []
    for(let i=0;i<userGroups.length;i++){
        let user = await AppUser.findByPk(userGroups[i].userId)
        userDetails.push({
            userId : user.id,
            name : user.name
        })
    }

    res.send({
        responseStatus : "SUCCESS",
        data :{
            groupId : groupDetail.id,
            groupName : groupDetail.name,
            userDetails
        }
    })

}


// app.put('/api/v1/user/:userId/groups/:groupId') // update the group details
exports.updateGroup = async (req,res) =>{

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))

    await Group.update(req.body, {
        where: { id: groupId }
    })

    res.send({
        responseStatus : "SUCCESS",
        data : {
            message : "Group Updated Successfully"
        }
    })

} 
// app.delete('/api/v1/user/:userId/groups/:groupId') // delete the group

exports.deleteGroup = async (req,res) =>{

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))

    await UserGroup.destroy({
        where: { groupId : groupId}
      })
    
    await Group.destroy({
        where : {id : groupId}
    })

    res.send({
        responseStatus : "SUCCESS",
        data : {
            message : "Group Deleted Successfully"
        }
        
    })

}

exports.addOrRemoveUserFromGroup = async (req,res) => {

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))

    let addUsers = req.body.addUsers
    for(let i=0;i< addUsers.length ;i++){
        await UserGroup.create({userId :addUsers[i],groupId});
    }

    let removeUsers = req.body.removeUsers
    for(let i=0;i<removeUsers.length;i++){
        await UserGroup.destroy({where:{
            userId : removeUsers[i].toString(),
            groupId
        }})
    }

    res.send({
        responseStatus : "SUCCESS",
        data : {
            message : "User Added or Deleted Successfully to group"
        }

    })

}


exports.getAllExpenseOfGroup = async (req,res) => {

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    let groupDetail = data
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))

    let groupExpense = await UserExpense.findAll({where:{
        groupId
    }
    }
    )

    res.send({
        responseStatus :"SUCCESS",
        data :{
            groupId : groupDetail.id,
            groupName : groupDetail.name,
            expenses : groupExpense
        }
    })

}



exports.addExpensetoGroup = async (req,res) => {

    const userId = req.params.userId
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    data = await UserGroup.findAll({where : {userId,groupId}})
    if(!data) return res.status(403).send(getErrorBody(`user id not authorize`))
    console.log("I am here")
    req.body.groupId = groupId
    await expenseController.create(req,res)
    


}

exports.getBalanceSheetOfUserInGroup = async (req,res) => {
    const userdId = req.params.userId;
    
    const groupId = req.params.groupId

    let data = await Group.findByPk(groupId)
    if(!data) return res.status(404).send(getErrorBody(`Group not found`))
    let groupDetail = data.dataValues

    let reqUserDetail = await AppUser.findByPk(userdId)
    if(!reqUserDetail) res.status(400).send(getErrorBody("Invalid user"));
    reqUserDetail = reqUserDetail.dataValues

    let given = await UserSplit.findAll({
        group: ['paidUserId', 'receivedUserId'],
        attributes: ['receivedUserId', [Sequelize.fn('sum', Sequelize.cast(Sequelize.col('amount'),'float')), 'count']],
        where : {paidUserId : userdId,groupId},
        raw: true
    })
    
    let taken = await UserSplit.findAll({
            group: ['paidUserId', 'receivedUserId'],
            attributes: ['paidUserId', [Sequelize.fn('sum', Sequelize.cast(Sequelize.col('amount'),'float')), 'count']],
            where : {receivedUserId : userdId,groupId},
            raw: true
    })
    
    
    for(let i=0;i<taken.length;i++){
        let flag = true;
        for(let j=0;j<given.length;j++){
            if(taken[i].paidUserId == given[j].receivedUserId){
                flag = false;
                given[j].count = given[j].count - taken[i].count;
                if(given[j].count == 0){
                    given.splice(j,1);
                }
                break
            }

        }
        if(flag){
            given.push({
                receivedUserId : taken[i].paidUserId,
                count : 0 - taken[i].count
            })
        }
    }

    let balancesheet = []
    for(let i =0;i<given.length;i++){
        let userDetail = await AppUser.findByPk(given[i].receivedUserId)
        balancesheet.push({
            userdId : userDetail.id,
            userName : userDetail.name,
            amount : given[i].count
        })
    }
    res.send({
        responseStatus : "SUCCESS",
        data:{
            requestedUserId : reqUserDetail.id,
            requestedUserName : reqUserDetail.name,
            groupId : groupDetail.id,
            groupName : groupDetail.name,
            balancesheet : balancesheet
        }
    })

}

