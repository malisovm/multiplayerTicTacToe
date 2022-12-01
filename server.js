const { Server } = require('socket.io')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = new Server().listen(server)
server.listen(process.env.PORT || 3001)
app.use(express.static(__dirname + '/app'))
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/app/index.html')
})
app.get('/roomselector', function (request, response) {
  response.sendFile(__dirname + '/app/index.html')
})
app.get('/game', function (request, response) {
  response.sendFile(__dirname + '/app/index.html')
})

const rooms = io.of('/').adapter.rooms

io.of('/').adapter.on('create-room', (room) => {
  console.log(`room ${room} was created`)
})
io.of('/').adapter.on('join-room', (room, id) => {
  console.log(`socket ${id} has joined room ${room}`)
})

const getRoomsAndSizes = () => {
  let allRooms = []
  rooms.forEach((value, key) => {
    allRooms.push({ name: key, size: value.size })
  })
  let userCreatedRooms = allRooms.filter((room) => room.name.includes('Room'))
  return userCreatedRooms
}

var roomsData = {}

io.on('connection', (socket) => {
  socket.on('userLoggedIn', (user) => {
    console.log(`User ${user} logged in`)
    io.emit('roomsListUpdate', getRoomsAndSizes())
    console.log(rooms)
  })
  socket.on('click', (values, room) => {
    if (values[0] === 'reset') {
      roomsData[room] = new Array(9).fill('')
      console.log(`room ${room} was reset`)
      io.to(room).emit('reset')
    } else {
      roomsData[room] = values
      console.log(values)
      io.to(room).emit('change', values)
    }
  })
  socket.on('userJoinedRoom', (room, role) => {
    socket.join(room)
    io.emit('roomsListUpdate', getRoomsAndSizes())
    if (role === 'spectator') {
      console.log(roomsData[room])
      console.log('SPECTATOR SOCKET', socket.id)
      if (roomsData[room]) socket.emit('change', roomsData[room])
    }
    console.log(getRoomsAndSizes())
  })
  socket.on('disconnect', () => {
    console.log(`Socket disconnected`)
    io.emit('roomsListUpdate', getRoomsAndSizes())
  })
  socket.on('deleteRoom', (room) => {
    console.log(`DELETING ROOM ${room}`)
    io.in(room).socketsLeave(room)
    console.log(getRoomsAndSizes())
  })
})
