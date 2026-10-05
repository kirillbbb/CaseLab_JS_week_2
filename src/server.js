import{createApp}from"./app.js";import{loadConfig}from"./config/env.js";import{sequelize}from"./db/sequelize.js";import{createLogger}from"./logger/index.js";
const config=loadConfig(),logger=createLogger(config),app=createApp(config,{logger});const server=app.listen(config.port,()=>logger.info({port:config.port},"server started"));
sequelize.authenticate().then(()=>logger.info("database connection ready")).catch(error=>logger.warn({error},"database is not ready; readiness endpoint will report 503"));
const shutdown=async signal=>{logger.info({signal},"shutting down");server.close(async()=>{await sequelize.close();process.exit(0);});};
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
