import React from 'react' ;
import Avatar from 'react-avatar' ;

// need to destructure the object received in the arguement
const Client = ({username}) => {
  return (
    <div className='client'>
        <Avatar name = {username} size = {50} round = '14px'/>
        <span className="userName">
            {username}
        </span>
    </div>
  )
}

export default Client