const db = require("../models");
const AppUser = db.appUser;
const UserSplit = db.userSplit;
const Sequelize = require("sequelize");



function getUserObject(req){

    return {
      name: req.body.name,
      email: req.body.email,
      password : req.body.password
    };
}

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

    if(!reqBody?.email){
        return res.status(400).send(getErrorBody("email field should present in request body"))   
    }

    let check = await AppUser.findAll({where: { email :reqBody?.email }})
    if(check.length > 0){
        return res.status(400).send(getErrorBody("email is already in use"))
    }
    if(!reqBody?.password){
        return res.status(400).send(getErrorBody("password field should present in request body"))
    }
  
    // Save Tutorial in the database
    let appUser = getUserObject(req)
    AppUser.create(appUser)
      .then(data => {
        res.status(200).send({
            responseStatus : "SUCCESS",
            data
        })
        
      })
      .catch(err => {
          let message =err.message || "Some error occurred while creating the Tutorial."
          res.status(500).send(getErrorBody(message))
        });
  };



// Find a single user with an id
exports.findOne = async (req, res) => {

    if(!req.params.id){
        return res.status(400).send(getErrorBody("missing parmas of user id"));
    }
    const id = req.params.id;
  
    AppUser.findByPk(id)
      .then(data => {
        if (data) {
          res.send({
            responseStatus : "SUCCESS",
            data
        });
        } else {
          res.status(404).send(getErrorBody(`Cannot find User with id=${id}.`))
        }
      })
      .catch(err => {
          let message = "Error retrieving User with id=" + id
          res.status(500).send(getErrorBody(message))
      });
  };


// Update a User by the id in the request
exports.update = async (req, res) => {

    if(!req.params.id){
        return res.status(400).send(getErrorBody("missing parmas of user id"));
    }

    let reqBody = req.body;
    if(reqBody?.email){
        let check = await AppUser.findAll({where: { email :reqBody?.email }})
        if(check.length > 0){
            return res.status(400).send(getErrorBody("email is already in use"))
        }
    }

    const id = req.params.id;
  
    AppUser.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            responseStatus:"SUCCESS",
            body : {
                message: "User was updated successfully."
            }
          });
        } else {
          res.status(400).send(getErrorBody(`Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`));
        }
      })
      .catch(err => {
        res.status(500).send(getErrorBody("Error updating User with id=" + id));
      });
  };



// Delete a User with the specified id in the request
exports.delete = (req, res) => {

    if(!req.params.id){
        return res.status(400).send(getErrorBody("missing parmas of user id"));
    }

    const id = req.params.id;

    AppUser.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            responseStatus : "SUCCESS",
            data : {
                message: "User was deleted successfully!"
            }
          });

        } else {
          res.status(400).send(getErrorBody(`Cannot delete User with id=${id}. Maybe User was not found!`));
        }
      })
      .catch(err => {
        res.status(500).send(getErrorBody("Could not delete User with id=" + id));
      });
  };




exports.getBalanceSheetOfUser = async (req, res) =>{

    const userdId = req.params.id;
    
    let reqUserDetail = await AppUser.findByPk(userdId)
    if(!reqUserDetail) res.status(400).send(getErrorBody("Invalid user"));
    reqUserDetail = reqUserDetail.dataValues

    let given = await UserSplit.findAll({
        group: ['paidUserId', 'receivedUserId'],
        attributes: ['receivedUserId', [Sequelize.fn('sum', Sequelize.cast(Sequelize.col('amount'),'float')), 'count']],
        where : {paidUserId : userdId},
        raw: true
    })
    
    let taken = await UserSplit.findAll({
            group: ['paidUserId', 'receivedUserId'],
            attributes: ['paidUserId', [Sequelize.fn('sum', Sequelize.cast(Sequelize.col('amount'),'float')), 'count']],
            where : {receivedUserId : userdId},
            raw: true
    })
    
    let result = [];
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
            balancesheet : balancesheet
        }
    })

}