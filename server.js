const express = require('express') ;
const http = require('http') ;
const path = require('path');
const {Server} = require('socket.io') ;
const ACTIONS = require('./src/Actions');
const socketHandler = require('./src/socket.handler');
const codeSubmissionHandler = require('./sourceCodeController');
const app = express();
const server = http.createServer(app) ;
/**Socket io instace using Server class */
const io = new Server(server) ;


app.use(express.static('build')) ;
app.get("*", (req,res,next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html')) ;
} )

// import & use socket-handler
socketHandler(io);

app.post('/compile',(req, res)=>{
    
    codeSubmissionHandler(req);
})

const PORT = process.env.PORT || 5000 ;
server.listen(PORT, () => {
    console.log(`server is listening at port ${PORT} ...`) ;
})