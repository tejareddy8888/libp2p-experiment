# Help!
If you are stuck on a particular chapter, you can check the code snippets below. While each Chapter has it's solution in the following Chapters code, the common code is edited over time. You can see the solution code that is needed for the common code below.

[01-Transports](#01-transports)
[02-Multiaddrs](#02-multiaddrs)
[03-Muxing-Encryption](#03-muxing-encryption)
[04-Protocols](#04-protocols)
[05-Discovery](#05-discovery)
[06-Pubsub](#06-pubsub)
[07-Multiaddrs](#07-multiaddrs)

## 01-Transports
No common changes

## 02-Multiaddrs
No common changes

## 03-Muxing-Encryption
TODO: We should update the Metrics code for peer:connect/peer:disconnect

## 04-Protocols
TODO: Add the Message.js chat logging code

**Chat.js**

Replace the `sendMessage` declaration with the following code.

```js
const sendMessage = () => {
  setMessage('')
  if (!message) return
  // Iterate over all peers, and send messages to peers we are connected to
  libp2p.peerStore.peers.forEach(async (peerData) => {
    // If they dont support the chat protocol, ignore
    if (!peerData.protocols.includes(ChatProtocol.PROTOCOL)) return

    // If we're not connected, ignore
    const connection = libp2p.connectionManager.get(peerData.id)
    if (!connection) return

    try {
      const { stream } = await connection.newStream([ChatProtocol.PROTOCOL])
      await ChatProtocol.send(message, stream)
    } catch (err) {
      console.error('Could not negotiate chat protocol stream with peer', err)
    }
  })

  // Update the messages for the view
  setMessages((messages) => [...messages, message])
}
```

Replace the `useEffect` call with the following code.

```js
useEffect(() => {
  // Wait for libp2p
  if (!libp2p) return

  if (!chatClient) {
    // Add chat handler
    libp2p.handle(ChatProtocol.PROTOCOL, ChatProtocol.createHandler(setMessages))

    // Set the chat client to so the handler add code doesn't run again
    setChatClient(true)
    return
  }
})
```

## 05-Discovery
TODO: We should update the Metrics code for peer:discovery

## 06-Pubsub
TODO: Update the Message.js chat logging code

**Chat.js**

Replace the `sendMessage` declaration with the following code.
```js
const sendMessage = async () => {
  setMessage('')
  if (!message) return
  try {
    await chatClient.send(message)
    console.info('Publish done')
  } catch (err) {
    console.error('Could not send message', err)
  }
}
```

Replace the `useEffect` call with the following code.

```js
useEffect(() => {
  // Wait for libp2p
  if (!libp2p) return

  // Create the pubsub chatClient
  if (!chatClient) {
    const pubsubChat = new PubsubChat(libp2p, PubsubChat.TOPIC)

    // Listen for messages
    pubsubChat.on('message', (message) => {
      if (message.from === libp2p.peerId.toB58String()) {
        message.isMine = true
      }
      setMessages((messages) => [...messages, message])
    })
    // Listen for peer updates
    pubsubChat.on('peer:update', ({ id, name }) => {
      setPeers((peers) => {
        let newPeers = { ...peers }
        newPeers[id] = { name }
        return newPeers
      })
    })

    setChatClient(pubsubChat)
  }
})
```

## 07-Messaging

**Chat.js**

Replace the `sendMessage` declaration with the following code.
```js
const sendMessage = async () => {
  setMessage('')
  if (!message) return
  // Check for commands before sending the message
  // Just return early if a command was found
  if (chatClient.checkCommand(message)) return
  // No commands, send the message!
  try {
    await chatClient.send(message)
    console.info('Publish done')
  } catch (err) {
    console.error('Could not send message', err)
  }
}
```
