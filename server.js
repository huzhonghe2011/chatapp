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

// 在外部创建一次实例
const options = {
  timeZone: 'Asia/Shanghai', // 设置时区为中国（上海）
  hour12: false, // 24小时制
  year: 'numeric', // 显示完整年份
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
};

const chinaTimeFormatter = new Intl.DateTimeFormat('zh-CN', options);

// 获取中国时间（北京时间）并按指定格式返回
function getChinaTime() {
  const now = new Date();
  const formattedTime = chinaTimeFormatter.format(now);

  // 格式化输出：YYYY-MM-DD HH:MM:SS
  return formattedTime.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '\\$1-\\$2-\\$3 \\$4:\\$5:\\$6');
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
