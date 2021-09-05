const protons = require('protons')
const EventEmitter = require('events')

const { Request, Stats } = protons(`
message Request {
  enum Type {
    SEND_MESSAGE = 0;
    UPDATE_PEER = 1;
    STATS = 2;
  }

  required Type type = 1;
  optional SendMessage sendMessage = 2;
  optional UpdatePeer updatePeer = 3;
  optional Stats stats = 4;
}

message SendMessage {
  required bytes data = 1;
  required int64 created = 2;
  required bytes id = 3;
}

message UpdatePeer {
  optional bytes userHandle = 1;
}

message Stats {
  enum NodeType {
    GO = 0;
    NODEJS = 1;
    BROWSER = 2;
  }

  repeated bytes connectedPeers = 1;
  optional NodeType nodeType = 2;
}
`)

class Chat extends EventEmitter {
  /**
   *
   * @param {Libp2p} libp2p A Libp2p node to communicate through
   * @param {string} topic The topic to subscribe to
   */
  constructor (libp2p, topic) {
    super()

    this.libp2p = libp2p
    this.topic = topic

    this.connectedPeers = new Set()
    this.stats = new Map()
    this.libp2p.connectionManager.on('peer:connect', (connection) => {
      console.log('Connected to', connection.remotePeer.toB58String())
      if (this.connectedPeers.has(connection.remotePeer.toB58String())) return
      this.connectedPeers.add(connection.remotePeer.toB58String())
      this.sendStats(Array.from(this.connectedPeers))
    })
    this.libp2p.connectionManager.on('peer:disconnect', (connection) => {
      console.log('Disconnected from', connection.remotePeer.toB58String())
      if (this.connectedPeers.delete(connection.remotePeer.toB58String())) {
        this.sendStats(Array.from(this.connectedPeers))
      }
    })

    // Join if libp2p is already on
    if (this.libp2p.isStarted()) this.join()
  }

  /**
   * Subscribes to `Chat.topic`. All messages will be
   * forwarded to `messageHandler`
   * @private
   */
  join () {
    this.libp2p.pubsub.subscribe(this.topic, (message) => {
      try {
        const request = Request.decode(message.data)
        switch (request.type) {
          case Request.Type.UPDATE_PEER:
            this.emit('peer:update', {
              id: message.from,
              name: request.updatePeer.userHandle.toString()
            })
            break
          case Request.Type.STATS:
            this.stats.set(message.from, request.stats)
            console.log('Incoming Stats:', message.from, request.stats)
            this.emit('stats', this.stats)
            break
          default:
            this.emit('message', {
              from: message.from,
              ...request.sendMessage
            })
        }
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * Unsubscribes from `Chat.topic`
   * @private
   */
  leave () {
    this.libp2p.pubsub.unsubscribe(this.topic)
  }

  /**
   * Crudely checks the input for a command. If no command is
   * found `false` is returned. If the input contains a command,
   * that command will be processed and `true` will be returned.
   * @param {Buffer|string} input Text submitted by the user
   * @returns {boolean} Whether or not there was a command
   */
  checkCommand (input) {
    const str = input.toString()
    if (str.startsWith('/')) {
      const args = str.slice(1).split(' ')
      switch (args[0]) {
        case 'name':
          this.updatePeer(args[1])
          return true
      }
    }
    return false
  }

  /**
   * Sends a message over pubsub to update the user handle
   * to the provided `name`.
   * @param {Buffer|string} name Username to change to
   */
  async updatePeer (name) {
    const msg = Request.encode({
      type: Request.Type.UPDATE_PEER,
      updatePeer: {
        userHandle: Buffer.from(name)
      }
    })

    try {
      await this.libp2p.pubsub.publish(this.topic, msg)
    } catch (err) {
      console.error('Could not publish name change')
    }
  }

  /**
   * Sends the updated stats to the pubsub network
   * @param {Array<Buffer>} connectedPeers
   */
  async sendStats (connectedPeers) {
    const msg = Request.encode({
      type: Request.Type.STATS,
      stats: {
        connectedPeers,
        nodeType: Stats.NodeType.BROWSER
      }
    })

    try {
      await this.libp2p.pubsub.publish(this.topic, msg)
    } catch (err) {
      console.error('Could not publish stats update')
    }
  }

  /**
   * Publishes the given `message` to pubsub peers
   * @param {Buffer|string} message The chat message to send
   */
  async send (message) {
    const msg = Request.encode({
      type: Request.Type.SEND_MESSAGE,
      sendMessage: {
        id: (~~(Math.random() * 1e9)).toString(36) + Date.now(),
        data: Buffer.from(message),
        created: Date.now()
      }
    })

    await this.libp2p.pubsub.publish(this.topic, msg)
  }
}

module.exports = Chat
module.exports.TOPIC = '/libp2p/example/chat/1.0.0'
