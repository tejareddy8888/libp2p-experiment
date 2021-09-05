import React, { useState, useEffect } from 'react'
import Message from './Message'

// Chat over Pubsub
// import PubsubChat from '../libs/chat'

export default function Chat ({
  libp2p,
  ChatProtocol
}) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [chatClient, setChatClient] = useState(null)
  // eslint-disable-next-line
  const [peers, setPeers] = useState({})

  /**
   * Sends the current message in the chat field
   */
  const sendMessage = () => {
    setMessage('')
    if (!message) return
    // TODO: Iterate over all peers, and send messages to peers we are connected to.

    // Update the messages for the view
    setMessages((messages) => [...messages, message])
  }

  /**
   * Calls `sendMessage` if enter was pressed
   * @param {KeyDownEvent} e
   */
  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      sendMessage()
    }
  }

  /**
   * Leverage use effect to act on state changes
   */
  useEffect(() => {
    // Wait for libp2p
    if (!libp2p) return

    if (!chatClient) {
      // TODO: Add the chat handler to libp2p

      // Set the chat client to so the handler add code doesn't run again
      setChatClient(true)
    }
  })

  return (
    <div className='flex flex-column w-75 pa3 h-100 bl b--black-10'>
      <div className='w-100 flex-auto'>
        <ul className='list pa0'>
          {messages.map((message, index) => {
            return <Message peers={peers} message={message} key={message.message ? message.message.id : index} />
          })}
        </ul>
      </div>
      <div className='w-100 h-auto'>
        <input onChange={e => setMessage(e.target.value)} onKeyDown={(e) => onKeyDown(e)} className='f6 f5-l input-reset fl ba b--black-20 bg-white pa3 lh-solid w-100 w-75-m w-80-l br2-ns br--left-ns' type='text' name='send' value={message} placeholder='Type your message...' />
        <input onClick={() => sendMessage()} className='f6 f5-l button-reset fl pv3 tc bn bg-animate bg-black-70 hover-bg-black white pointer w-100 w-25-m w-20-l br2-ns br--right-ns' type='submit' value='Send' />
      </div>
    </div>
  )
}
