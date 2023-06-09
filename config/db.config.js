module.exports = {
    HOST: "localhost", // can  be move to env
    USER: "postgres", // can be move to env
    PASSWORD: "postgres", // can be move to env secrets
    DB: "splitwise",
    
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };