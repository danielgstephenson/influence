import { io } from './socketIo/socket.io.esm.min.js'
const socket = io()
const blueDiv = document.getElementById('blueDiv')
const greenDiv = document.getElementById('greenDiv')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
context.imageSmoothingEnabled = false

socket.on('updateClient', (msg) => {
  record.msg = msg
  for (const property in msg.state) {
    state[property] = msg.state[property]
  }
  camera.position = msg.position
  const reply = { controls }
  socket.emit('updateServer', reply)
})

// function range (n) { return [...Array(n).keys()] }
// function clamp (a, b, x) { return Math.max(a, Math.min(b, x)) }
// const sum = array => array.reduce((a, b) => a + b, 0)

// Disable Right Click Menu
document.oncontextmenu = () => false

const mouse = {
  down: [false, false, false],
  x: 0,
  y: 0
}
const controls = {
  up: false,
  down: false,
  left: false,
  right: false,
  select: false,
  active: true,
  zoom: 0.5
}
const record = {}
const keys = new Map()
keys.set('w', 'up')
keys.set('s', 'down')
keys.set('a', 'left')
keys.set('d', 'right')
keys.set('ArrowUp', 'up')
keys.set('ArrowDown', 'down')
keys.set('ArrowLeft', 'left')
keys.set('ArrowRight', 'right')
keys.set(' ', 'select')
keys.set('Enter', 'select')

const camera = {
  position: { x: 50, y: 50 }
}
const state = {}

function updateMouse (e) {
  const canvasRect = canvas.getBoundingClientRect()
  mouse.y = Math.floor((e.pageY - canvasRect.top) * 100 / canvasRect.width)
  mouse.x = Math.floor((e.pageX - canvasRect.left) * 100 / canvasRect.width)
}

window.onmousemove = function (e) {
  updateMouse(e)
}

window.onmousedown = function (e) {
  console.log('state', state)
  // console.log('controls', controls)
  if (e.button === 0) mouse.down[0] = true
  if (e.button === 1) mouse.down[1] = true
  if (e.button === 2) mouse.down[2] = true
  updateMouse(e)
}

window.onmouseup = function (e) {
  if (e.button === 0) mouse.down[0] = false
  if (e.button === 1) mouse.down[1] = false
  if (e.button === 2) mouse.down[2] = false
}

window.onkeydown = function (e) {
  keys.forEach((value, key) => {
    if (e.key === key) controls[value] = true
  })
  if (e.key === 'Enter') controls.active = !controls.active
}

window.onkeyup = function (e) {
  keys.forEach((value, key) => {
    if (e.key === key) controls[value] = false
  })
}

window.onwheel = function (e) {
  controls.zoom -= e.deltaY / 1000
}

function setupCanvas () {
  const size = 0.99 * Math.min(window.innerWidth, window.innerHeight)
  canvas.width = size
  canvas.height = size
  const xTranslate = 0.5 * canvas.width
  const yTranslate = 0.5 * canvas.height
  const scale = Math.exp(controls.zoom)
  const minSize = Math.min(window.innerHeight, window.innerWidth)
  const xScale = scale * minSize / 100
  const yScale = scale * minSize / 100
  context.setTransform(xScale, 0, 0, yScale, xTranslate, yTranslate)
  context.imageSmoothingEnabled = true
}

const colors = {
  0: 'hsl(180, 100%, 80%)',
  1: 'hsl(220, 100%, 50%)',
  2: 'hsl(140, 100%, 25%)',
  wall: 'hsl(360, 100%, 5%)'
}

function drawState () {
  context.clearRect(0, 0, 100, 100)
  context.globalAlpha = 0.5
  if (state.nodes) {
    const counts = {
      blue: 0,
      green: 0
    }
    state.nodes.forEach(node => {
      context.globalAlpha = node.team === 0 ? 0.05 : 0.2
      if (node.team === 1) counts.blue += 1
      if (node.team === 2) counts.green += 1
      context.beginPath()
      context.fillStyle = colors[node.team]
      const x = node.position.x - camera.position.x
      const y = node.position.y - camera.position.y
      context.arc(x, y, node.radius, 0, 2 * Math.PI)
      context.fill()
    })
    blueDiv.innerHTML = counts.blue
    greenDiv.innerHTML = counts.green
  }
  if (state.walls) {
    context.globalAlpha = 1
    context.fillStyle = colors.wall
    state.walls.forEach(wall => {
      const x = wall.position.x - 0.5 * wall.width - camera.position.x
      const y = wall.position.y - 0.5 * wall.height - camera.position.y
      context.fillRect(x, y, wall.width, wall.height)
    })
  }
  if (state.players) {
    state.players.forEach(player => {
      if (player.active) {
        context.globalAlpha = 1
        context.fillStyle = colors[player.team]
        const x = player.position.x - camera.position.x
        const y = player.position.y - camera.position.y
        context.beginPath()
        context.arc(x, y, player.radius, 0, 2 * Math.PI)
        context.fill()
        context.fillStyle = 'black'
        const holeRadius = 0.8 * player.radius * Math.sqrt(1 - player.buildTimer)
        context.beginPath()
        context.arc(x, y, holeRadius, 0, 2 * Math.PI)
        context.fill()
      }
    })
  }
  if (state.attackers) {
    context.globalAlpha = 1

    state.attackers.forEach(attacker => {
      if (attacker.active) {
        context.fillStyle = 'red'
        const x = attacker.position.x - camera.position.x
        const y = attacker.position.y - camera.position.y
        context.beginPath()
        context.arc(x, y, attacker.radius, 0, 2 * Math.PI)
        context.fill()
        context.fillStyle = 'black'
        const holeRadius = 0.8 * attacker.radius * Math.sqrt(1 - attacker.freezeTimer)
        context.beginPath()
        context.arc(x, y, holeRadius, 0, 2 * Math.PI)
        context.fill()
      }
    })
  }
}

function draw () {
  setupCanvas()
  drawState()
  window.requestAnimationFrame(draw)
}

draw()
