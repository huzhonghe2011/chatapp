const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

let onlineCount = 0;
let onlineUsers = new Set(); // 用一个 Set 来存储在线用户的 socket.id

// 创建Express应用
const app = express();

// 创建http服务器
const server = http.createServer(app);

// 创建Socket.io服务器并将其附加到http服务器上
const io = socketIo(server);

// 设置静态文件目录
app.use(express.static('public'));

// 获取中国时间（北京时间）并按指定格式返回
function getChinaTime() {
  const options = {
    timeZone: 'Asia/Shanghai', // 设置时区为中国（上海）
    hour12: false, // 24小时制
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份需要补充为两位数
  const day = now.getDate().toString().padStart(2, '0'); // 日期需要补充为两位数
  const hours = now.getHours().toString().padStart(2, '0'); // 小时需要补充为两位数
  const minutes = now.getMinutes().toString().padStart(2, '0'); // 分钟需要补充为两位数
  const seconds = now.getSeconds().toString().padStart(2, '0'); // 秒需要补充为两位数

  return `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
}

// 定义一个连接事件，用于监听客户端的连接
io.on('connection', (socket) => {
  console.log('一个用户连接: ' + socket.id);
  onlineUsers.add(socket.id);  // 用户连接时，把 socket.id 添加到集合中
  onlineCount = onlineUsers.size;  // 更新在线人数

  // 发送当前在线人数到所有客户端
  io.emit('onlineCount', onlineCount);

  // 监听来自客户端的聊天消息
  socket.on('chatMessage', (msg) => {
    const timestamp = getChinaTime(); // 获取中国时间
    const userId = socket.id;  // 获取用户的 socket.id

    console.log(`${msg.nickname} ${timestamp} 发送消息: ${msg.text}`);

    // 向所有客户端广播消息
    io.emit('chatMessage', msg);
  });

  // 监听断开连接事件
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);  // 用户断开时，从集合中移除 socket.id
    onlineCount = onlineUsers.size;  // 更新在线人数
    console.log('一个用户断开连接: ' + socket.id);
    
    // 发送更新后的在线人数到所有客户端
    io.emit('onlineCount', onlineCount);
  });
});

// 设置根路径返回一个简单的 HTML 页面
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 设置服务器监听端口
server.listen(3000, () => {
  console.log('服务器正在运行在 http://localhost:3000');
});
