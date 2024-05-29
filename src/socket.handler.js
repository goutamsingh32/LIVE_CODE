const ACTIONS = require('./Actions');

/**
 * Handler for all socket related operations
 * @param {import('socket.io').Server} io 
*/
module.exports = (io) => {

    /**
   * Store **in-memory** mapping of socket-id to username
   * @type {{ [string]: string }}
   */
    const userSocketMap = {};
    /**
     * Used to get list of all clients present in room
     * @param {string} roomId current room id
     * @returns Array of socket id and username of clients present in room
     */
    function getAllConnectedClients(roomId) {
        return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
            (socketId) => {
                return {
                    socketId,
                    username: userSocketMap[socketId]
                };
            });
    }


    io.on('connection', (socket) => {

        console.log(`socket connected: `, socket.id);

        socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
            userSocketMap[socket.id] = username; // Store username as value and sockedId as key
            socket.join(roomId);

            const clients = getAllConnectedClients(roomId);

            // notify all other connected clients about new joinee
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit(ACTIONS.JOINED, { //TODO rather than sending message to each socket id, can we send message to a room
                    clients,
                    username,
                    socketId: socket.id
                });
            })
        });

        // listen to code-change event of current socket
        socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
            socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code }); // emit code-change event to all other sockets in the read
        });

        // listen to sync-code event for a new joinee
        socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
            io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        })

        // listen to event triggered just before current socket is disconnected
        socket.on('disconnecting', () => {
            const rooms = [...socket.rooms];

            rooms.forEach((roomId) => {
                // broadcast disconnected event from current socket to all other sockets in each room
                socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                    socketId: socket.id,
                    username: userSocketMap[socket.id]
                })
            });

            delete userSocketMap[socket.id];
            socket.leave();
        })
    });

}