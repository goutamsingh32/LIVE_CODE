import React, { useState, useEffect, useRef } from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';
import { removeFromLocalStorage } from '../service';

/**For Each client */
const EditorPage = () => {

  const socketRef = useRef(null);
  const reactNavigator = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const codeRef = useRef(null);

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();


      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      /**Handle socket errors  */
      function handleErrors(err) {
        console.log('socket error', err);
        toast.error('Socket connection failed, try again later');
        reactNavigator('/');
      }

      // Emit JOIN event to the room
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username, //TODO
      });

      // Listen to Joined event
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room`);
          console.log(`${username} joined`);
        }

        setClients(clients);

        // emit sync code event to update code for newly joined socket
        socketRef.current.emit(ACTIONS.SYNC_CODE, { socketId, code: codeRef.current });
      });


      // listen to DISCONNECTED event
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);

        setClients((prev) => {
          return prev.filter(client => client.socketId !== socketId);
        })
      })
    }

    init();

    // Clear the listeners

    return () => {
      // unsubscribe from all listeners & disconnect the socket
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.disconnect();
    }
  }, []);

  /**Handle copy roomId action */
  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied!')

    } catch (err) {
      toast.error('Oops! something went wrong');
    }
  }

  function leaveRoom() {
    removeFromLocalStorage('theme');
    removeFromLocalStorage('code');
    removeFromLocalStorage('language');
    reactNavigator('/');

  }

  if (!location.state) {
    return <Navigate to='/' />
  }

  return (
    <div className="mainWrap">
      <div className="aside">

        <div className="asideInner">

          <div className="logo">
            <img className='logoImage' src="https://rubylazaro.files.wordpress.com/2014/02/livecode-110dpi.png" alt="logo" />
          </div>
          <h3>Connected</h3>

          <div className="clientsList">
            {
              clients.map((client) => (
                <Client
                  key={client.socketId}
                  username={client.username} />
              ))
            }
          </div>

        </div>

        <button className='btn copyBtn' onClick={copyRoomId} >Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom} >Leave</button>
      </div>


      <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => {
          codeRef.current = code;
        }} />
      </div>

    </div>
  )
}

export default EditorPage;